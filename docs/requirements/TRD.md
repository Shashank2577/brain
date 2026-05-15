# Technical Requirements Document — Fluid Super-App

## Stack constraints (non-negotiable for this branch)

| Layer | Choice | Why |
|---|---|---|
| Language (backend) | **TypeScript (strict)** | Type safety across the capability registry contract |
| Language (frontend) | **TypeScript + React 18+** | Existing templates already use this |
| Server runtime | **Nitro (h3)** | Existing template foundation; same-runtime in dev (Node) + serverless deploy |
| ORM | **Drizzle** | Dialect-agnostic (SQLite / Postgres / D1 / Turso); existing templates use it |
| Validation | **Zod (Standard Schema)** | `defineAction()` already supports it; cross-app type derivation |
| Frontend routing | **React Router 7** | Existing templates use it; supports embedded mode |
| Frontend build | **Vite** | Per-template builds; could move to Turbopack later |
| Auth | **Better Auth** | Existing workspace SSO is wired; supports email/password + Google OAuth |
| Workspace orchestration | **`pnpm dev:lazy`** | Already implements workspace mode + same-origin gateway |
| Test runner | **Vitest** | Existing template tests use it |
| E2E | **Playwright** | (To be added; not currently installed at root) |
| Package manager | **pnpm 10.x** + workspaces | Existing setup |

## Architectural contracts

### Mini-app shape

A mini-app at `templates/<name>/` MUST contain:

```
templates/<name>/
├── package.json              # workspace package; "name": "<name>"
├── server/
│   ├── db/schema.ts          # Drizzle tables using ownableColumns()
│   └── plugins/db.ts         # runs migrations on boot
├── actions/                   # each .ts file is one capability
│   ├── list-<things>.ts
│   ├── create-<thing>.ts
│   └── ...
├── app/
│   ├── root.tsx              # detects embedded mode via @agent-native/core/client frame
│   ├── routes/
│   │   ├── _index.tsx
│   │   └── _app.*.tsx
│   └── components/
├── AGENTS.md                  # agent guidance for this mini-app's domain
├── CLAUDE.md → AGENTS.md      # symlink (via agent-native setup-agents)
├── tests/                     # vitest unit + integration
├── .env.example
├── tsconfig.json
└── vite.config.ts
```

### Capability contract

A capability is auto-derived from each `actions/*.ts` file. The registry MUST:

1. **Discover** all actions at boot from `templates/*/actions/*.ts`
2. **Validate** inputs against the action's Zod schema before dispatch
3. **Authenticate** the calling user via the workspace SSO cookie
4. **Authorize** via the action's declared `requires` / access role
5. **Propagate identity** when one capability calls another (`ctx.call(...)`); the called capability receives `ctx.userEmail` of the original user, not the calling app
6. **Return** typed output validated against the action's output schema
7. **Surface** errors as structured `{ ok: false, error: { code, message } }` envelopes

### Inter-app call contract

```typescript
// Inside any action's run(input, ctx):
const result: TargetOutput = await ctx.call<TargetInput, TargetOutput>(
  "<app>.<capability>",  // FQID
  input,                  // matches target's Zod input
);
```

- `ctx.call()` is sync-style (returns a Promise); the dispatcher calls the target action's `run()` directly when in-process (the common case in v1)
- Identity propagation MUST happen via `runWithRequestContext()` so `getRequestUserEmail()` returns the user inside the called action
- Cycles MUST be detected (A→B→A) and rejected with `cycle_detected` error

### Identity model

- **One Better Auth secret** (`BETTER_AUTH_SECRET`) per workspace. Set in every `templates/*/.env.local` and `templates/dispatch/.env.local`.
- **One database URL** (`DATABASE_URL`) per workspace. SQLite for local dev (`file:.dev-data/workspace.db`). Postgres / Turso / D1 for deploy.
- **One cookie name** in workspace mode: `an_session_workspace`. Set with `HttpOnly`, `Path=/`, `SameSite=Lax`, `Secure` in production.
- **Google OAuth credentials** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) at the workspace level. Templates that need extra scopes (mail, calendar) initiate per-app incremental consent flows.

### Sharing / access control

- Every "user-owned" table MUST include `ownableColumns()` (id, ownerEmail, orgId, etc.)
- Every list query MUST go through `accessFilter(table, sharesTable)`
- Every read-by-id MUST call `resolveAccess("<type>", id)` or `assertAccess("<type>", id, role)`
- Every write MUST call `assertAccess("<type>", id, "editor")` (or admin for delete)
- Custom HTTP routes outside `/_agent-native/actions/...` MUST wrap their work in `runWithRequestContext()` themselves (since the auto-mount only applies to actions)
- The `guard-no-unscoped-queries.mjs` CI guard MUST pass — opt-out via the explicit marker comment with reviewer signoff

## Persistence requirements

- **No data may be lost on dev-server restart.** No in-memory `Map<string, T>` for app data. (Application state for UI ephemera is fine in `application_state` SQL table.)
- **Schema changes are additive only.** Hosted templates share their production DB across deploy contexts; destructive migrations have caused incidents (see CLAUDE.md, 2026-04-21).
- **Each mini-app's tables are namespaced.** `notes_*`, `tasks_*`, `crm_contacts`, `crm_deals` etc. Framework tables (`user`, `session`, `account`, `oauth_tokens`, `application_state`) are shared.
- **Migrations run at template boot** via each `server/plugins/db.ts`. No `drizzle-kit push` against production (guard enforced).

## LLM provider abstraction

- Provider interface defined in `packages/core/src/server/llm/provider.ts` (to be created if not present)
- Each provider implements: `streamChat({ messages, tools, model, ... })` returning an async iterable of chunks
- Built-in providers: Anthropic, OpenAI, Google Gemini, OpenRouter, **Amazon Bedrock** (new)
- Provider chosen at dispatch level via env or settings UI: `LLM_PROVIDER=bedrock`, `LLM_MODEL=anthropic.claude-3-5-sonnet-20240620-v1:0`
- Bedrock-specific config: `AWS_REGION` (default us-east-1 for Bedrock), `AWS_PROFILE` or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`. See [ADR-005](../decisions/ADR-005-bedrock-as-llm-provider.md) and [`05-llm-providers.md`](../architecture/05-llm-providers.md).

## Performance targets

| Metric | Target | Stretch |
|---|---|---|
| Cold load of dispatch shell (auth + render) | < 2.5 s | < 1.5 s |
| Mini-app switch (rail click → content visible) | < 400 ms | < 200 ms |
| Inter-app capability call (in-process, no I/O) | < 50 ms | < 10 ms |
| Capability registry boot time | < 2 s | < 500 ms |
| First-time scaffolded app boot | < 30 s | < 15 s |

(Targets enforced by perf tests in Phase 7.)

## Security requirements

- All actions through the agent MUST go through the access check chain. The agent has no privileged path.
- Inter-app calls MUST NOT escalate privileges (calling app's identity is dropped; user identity propagates).
- Capability isolation: each mini-app SHOULD only call capabilities it has declared in its manifest's `consumes` (currently advisory; Phase 4+ work to enforce).
- Secrets MUST NEVER be in code or in DB rows readable by mini-apps' user code (use the framework's `secrets` skill / `vault_secrets` table).
- No mini-app's SQL can be passed unescaped through the extensions SQL proxy; existing guards apply.

## Browser support

- Latest 2 versions of Chrome, Firefox, Safari, Edge
- Safari iOS / Chrome Android for the (future) WebView-based mobile shell, if that route is chosen
- IE / legacy not supported

## Deployment model

- **v1 (this branch)** — Single-tenant self-host. One workspace, one DB, one set of credentials.
- **Future** — Multi-tenant (one DB per workspace), managed offering (single DB with org sharding).
- Out of scope for this branch.

## Constraints inherited from the existing codebase

- Workspace mode auto-detected via `AGENT_NATIVE_WORKSPACE=1` (set by `scripts/dev-lazy.ts`)
- Better Auth requires `BETTER_AUTH_SECRET` ≥ 32 hex chars
- React Router 7's `_index.tsx` files behave specially under base-path stripping (see existing fix in commit `7ae9b50b`)
- All Drizzle SQL must be dialect-agnostic (target is Postgres in production; SQLite locally) — see `portability` skill
- All AI calls go through the agent chat plugin, never inline LLM SDK imports in templates (see `delegate-to-agent` skill)

## Open technical questions (escalate)

- Should the capability registry be in-process (one Nitro server holding the dispatcher) or out-of-process (a dedicated tiny RPC server)? Current direction: in-process inside dispatch.
- Should mini-app `actions/` get a TypeScript barrel auto-generated at build time for typed cross-app calls? Trade-off: convenience vs build complexity.
- WebView vs native vs RN for mobile mini-app UIs — deferred to ADR-006.
