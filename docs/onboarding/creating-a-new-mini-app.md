# Creating a new mini-app

This document specifies how a brand-new mini-app gets created and onboarded
into the super-app platform (the Fluid OS shell, served by the dispatch
package on port 8080). The audience is humans, agents, and CLI scripts —
all three follow the same contract and produce the same artifacts.

## What "onboarding a mini-app" means

"Onboarding" is the moment a new mini-app becomes a first-class citizen of
the shell: it appears in the dispatch left rail, its actions show up in the
shell's capability registry, and other mini-apps can call it via
`ctx.call("<id>.<capability>", input)`. Concretely, onboarding is a single
state change — the shell starts seeing `templates/<name>/package.json` (or
`apps/<name>/package.json` inside a workspace) and reads its
`actions/*.ts`, `agent-card`, and route manifest. Everything else — auth,
the agent chat, the shared SQL database, polling sync, observability — is
inherited from `@agent-native/core` and the workspace shell. No per-app
gateway registration, no manual port wiring.

## Three entry points

All three entry points scaffold the **same file tree** under
`templates/<name>/` (framework dev) or `apps/<name>/` (workspace). They
differ only in who is driving and how the trigger is delivered.

### 1. Developer-driven (CLI)

For developers writing code directly. From a fresh terminal at the repo
root:

```bash
pnpm fluid-os create-app <name> \
  --description "<one-line description>" \
  --consumes "<existing.capability,another.one>" \
  --capability "<id>:<description>"
```

Defined in `packages/fluid-os/src/cli/create-app.ts` and the underlying
scaffold helpers in `packages/fluid-os/src/scaffold/template.ts`. The
existing implementation only writes a single `manifest.ts` under
`examples/apps/<id>/` — the spec extends it to produce the full file tree
below. The flow is:

1. **Print the registry first.** `printRegistry(manifests)` runs
   unconditionally so the dev (and any agent operating the CLI) can see
   what already exists before adding capabilities.
2. **Validate the slug.** `validateScaffoldSpec` rejects anything that
   isn't lower-kebab.
3. **Validate `consumes`.** Each entry must already exist as
   `<appId>.<capabilityId>` in the registry. Unknown ids print a warning
   but do not block.
4. **Write the file tree** under `templates/<name>/` (see
   "What the scaffolder must produce" below).
5. **Update both template allow-lists** —
   `packages/shared-app-config/templates.ts` and
   `packages/core/src/cli/templates-meta.ts`. The
   `scripts/guard-template-list.mjs` guard runs in CI and `pnpm prep` and
   will fail if the two files drift, so the scaffolder writes both in the
   same step.
6. **Print next steps.** The CLI ends with a directive to run
   `pnpm dev:lazy` (the gateway scans `templates/*` and will pick up the
   new directory automatically) and to verify the new tile appears in the
   dispatch left rail at `http://localhost:8080`.

The CLI scaffolder does NOT hot-install. The dev restarts the workspace
server and confirms the registry picked up the new app.

### 2. User-driven (Dispatch UI)

For non-developer teammates working inside a running workspace. The entry
point is the `CreateAppPopover` component in
`packages/dispatch/src/components/create-app-popover.tsx`. The wizard:

1. **Trigger.** "+ Create app" button in the apps grid empty-state tile
   (or the trigger override prop). Opens a popover with two steps.
2. **Step 1 — Prompt.** A `PromptComposer` field: "Describe the app your
   teammate should be able to use…" The user types a free-form
   description; the popover slugifies it into a candidate `appId` via
   `titleFromPrompt`.
3. **Step 1.5 — Pick a starter (implicit).** The agent (not the user)
   picks a starting template from the public allow-list — `analytics`,
   `calendar`, `content`, `design`, `dispatch`, `forms`, `mail`, `slides`,
   `clips`, or `starter` when nothing fits. The prompt text shipped to
   the agent (`buildAppCreationPrompt`) names this exact choice list, so
   future blank-style options (CRUD-list, blog-post-from-prompt) become
   new entries in `ADDABLE_TEMPLATES` in
   `packages/dispatch/src/server/lib/app-creation-store.ts`.
4. **Step 2 — Access (optional).** The "key/resource picker" lets the
   user pre-grant Dispatch vault keys (`list-vault-secret-options`) and
   workspace resource packs (`list-workspace-resource-options`) to the
   new app. Selection is purely declarative — the actual vault grant
   happens after the app exists.
5. **Submit.** Calls
   `POST /_agent-native/actions/start-workspace-app-creation` with
   `{ prompt, appId, secretIds, resourceIds }`.
   `startWorkspaceAppCreation` in `app-creation-store.ts` routes to one
   of three modes:
   - **`local-agent`** (dev only) — returns a prompt for the local code
     agent. Vault keys and resources are queued.
   - **`builder`** (deployed) — `runBuilderAgent` opens a Builder branch
     with the constructed prompt. The pending app is recorded via
     `recordPendingWorkspaceApp` and surfaces in the apps grid as
     "Building in Builder" until the branch merges.
   - **`builder-unavailable` / `coming-soon`** — graceful fallback when
     Builder isn't configured.
6. **Agent prompt.** The exact prompt assembled by
   `buildWorkspaceAppPrompt` (workspace mode) or `buildAppCreationPrompt`
   (popover mode) tells the agent to:
   - Scaffold under `apps/<appId>/` and mount at `/<appId>`.
   - Use the same workspace database, namespacing new tables to the app.
   - Wire React Router routes app-local (no `/<appId>` prefix inside the
     app — `APP_BASE_PATH` supplies it).
   - Use shadcn/ui + Tabler icons, no inline LLM calls, optimistic UI.
   - Reuse first-party neighbors (mail, calendar, analytics, etc.) via
     A2A rather than cloning them.
7. **Confirmation.** The popover shows a success toast and (for Builder
   mode) a link to the branch.

### 3. Marketplace (future)

Not implemented this phase. Reserved contract:

- An installable mini-app is distributed as a tarball of its
  `templates/<name>/` directory plus a top-level `manifest.json`:

  ```json
  {
    "id": "kebab-slug",
    "name": "Display Name",
    "version": "1.0.0",
    "description": "…",
    "author": "you@example.com",
    "consumes": ["mail.send-email", "calendar.create-event"],
    "capabilities": [
      { "id": "create-thing", "description": "…", "tags": ["…"] }
    ],
    "secrets": [{ "key": "SOME_API_KEY", "urlAllowlist": ["api.x.com"] }],
    "agentCard": "/.well-known/agent-card.json"
  }
  ```

- The shell will fetch this manifest from a registry, verify a signature,
  extract the tarball into `apps/<id>/`, run its migrations, and register
  it the same way the CLI and Builder flows do. Until then, every entry
  point in this document is a closed system (dev + agent + dispatch UI).

## What the scaffolder must produce

A "shippable" baseline scaffold writes the following layout under
`templates/<name>/` (or `apps/<name>/` in a workspace). Paths are
relative to that directory.

```
templates/<name>/
├── package.json                       # workspace package, deps on @agent-native/core
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── react-router.config.ts
├── netlify.toml                       # NITRO_PRESET=netlify, base-path env
├── _gitignore                         # renamed to .gitignore on copy
├── .env.example                       # documented env vars (DATABASE_URL, OAUTH keys)
├── AGENTS.md                          # mini-app's own agent guide
├── CLAUDE.md                          # symlink → AGENTS.md
├── components.json                    # shadcn/ui config
├── ssr-entry.ts                       # framework entry — do not edit
├── app/
│   ├── root.tsx                       # HTML shell + ClientOnly wrapper
│   ├── routes.ts                      # React Router 7 route table
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   ├── global.css                     # Tailwind v4 only
│   ├── routes/
│   │   ├── _app.tsx                   # layout: sidebar (hidden in embedded mode)
│   │   ├── _app._index.tsx            # list view
│   │   └── _app.$id.tsx               # detail/edit view
│   ├── components/
│   │   ├── ui/                        # shadcn primitives (Button, Dialog, …)
│   │   └── things-list.tsx            # sample list component
│   ├── hooks/
│   │   └── use-things.ts              # useActionQuery wrappers
│   └── lib/
├── actions/
│   ├── list-things.ts                 # READ list (paginated)
│   ├── get-thing.ts                   # READ single
│   ├── create-thing.ts                # WRITE create
│   ├── update-thing.ts                # WRITE update
│   └── delete-thing.ts                # WRITE delete (soft-delete preferred)
├── server/
│   ├── db/
│   │   ├── schema.ts                  # Drizzle schema with ownableColumns()
│   │   └── index.ts                   # re-exports
│   └── plugins/
│       ├── db.ts                      # runMigrations — additive SQL only
│       ├── auth.ts                    # inherited from framework default
│       └── agent-chat.ts              # inherited createAgentChatPlugin
├── shared/                            # types shared with workspace gateway
└── tests/
    ├── actions/
    │   ├── create-thing.spec.ts       # unit test
    │   ├── list-things.spec.ts        # unit test
    │   └── update-thing.spec.ts       # unit test
    └── integration/
        └── crud-flow.spec.ts          # integration: action HTTP + DB
```

Key contracts inside that tree:

- **`package.json`** — `name: "<name>"`, `displayName: titleCase(name)`,
  workspace package with `"@agent-native/core": "workspace:*"` (rewritten
  by `workspacifyApp` and `getCoreDependencyVersion` for standalone
  scaffolds). Adds `postgres` runtime dep so production builds don't
  break when `DATABASE_URL` points at Postgres.

- **`server/db/schema.ts`** — every domain table uses
  `...ownableColumns()` so per-user/org scoping works:

  ```ts
  import { pgTable, text, integer } from "drizzle-orm/pg-core";
  import { ownableColumns, createSharesTable } from "@agent-native/core/db";

  export const things = pgTable("<name>_things", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body"),
    createdAt: integer("created_at").notNull(),
    ...ownableColumns(),
  });

  export const thingShares = createSharesTable("<name>_thing_shares");
  ```

  Note the `<name>_` prefix on the SQL table name — the workspace DB is
  shared across apps, so unprefixed `things` would collide.

- **`server/plugins/db.ts`** — calls `runMigrations` from
  `@agent-native/core` with **additive-only** SQL (`CREATE TABLE IF NOT
  EXISTS`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS`). No `DROP`, no
  `RENAME`, no `drizzle-kit push` against the workspace DB — both are
  blocked by the framework guards (`scripts/guard-no-drizzle-push.mjs`
  and the runtime check in `createDrizzleConfig`).

- **`actions/*.ts`** — every action is a `defineAction` call with a
  Zod-validated `input`, an `output` schema, and a handler that uses
  `accessFilter(table, sharesTable)`, `resolveAccess("<type>", id)`, or
  `assertAccess("<type>", id, role)` for every read/write. Five CRUD
  actions = five capabilities the shell exposes automatically via the
  `/_agent-native/actions/:name` mount.

- **`app/root.tsx`** — embedded-mode detection toggles the in-app
  sidebar:

  ```tsx
  const embedded = typeof window !== "undefined"
    && window.parent !== window
    && new URLSearchParams(window.location.search).get("embed") === "1";
  ```

  When `embedded`, render only the content surface; the shell renders the
  global chrome around the iframe.

- **`app/routes/_app.tsx`** uses app-local paths (`<Link to="/123">`,
  not `<Link to="/<name>/123">`). `APP_BASE_PATH` and
  `VITE_APP_BASE_PATH` are read from env at build time so the mounted
  workspace URL stays correct.

- **`AGENTS.md`** is the mini-app's own agent guide; `CLAUDE.md` is a
  symlink to it (created via the framework's
  `setupAgentSymlinks(appDir)`).

- **`vitest.config.ts`** mirrors the existing template configs
  (`templates/forms/vitest.config.ts`, `templates/slides/vitest.config.ts`,
  etc.) — Node env, alias `@` → `app/`, plus a `tests/setup.ts` that
  spins up an in-memory SQLite DB and seeds a default user.

- **`.env.example`** documents `DATABASE_URL`, any OAuth client ids/secrets,
  and `APP_BASE_PATH` so the secrets onboarding step (see the `secrets`
  skill) can register them in the sidebar setup checklist.

## Registration steps after scaffold

After the scaffolder produces the file tree, the new mini-app must be
registered in three places before it appears in the shell:

1. **Add it to `packages/shared-app-config/templates.ts`** (the
   single source of truth for first-party template metadata):

   ```ts
   {
     name: "<name>",
     label: "<Title>",
     hint: "<one-line description>",
     icon: "<TablerIconName>",
     color: "#hex",
     colorRgb: "r g b",
     devPort: <next-free-port>,         // e.g. 8101
     prodUrl: "https://<name>.agent-native.com",
     defaultMode: "prod",
     // Add `core: true` to feature it in CLI pickers and the homepage.
     // Leave `hidden` unset to make it public — the guard enforces
     // that public surfaces only show hidden:false slugs.
   }
   ```

2. **Mirror that entry in `packages/core/src/cli/templates-meta.ts`**.
   This duplication is intentional (see the file's header comment): the
   published `@agent-native/core` CLI can't depend on a workspace
   package, so the CLI ships its own copy. `scripts/guard-template-list.mjs`
   runs in CI and `pnpm prep`; it diffs the two files and fails the build
   if they drift on `hidden` flag or slug set.

3. **Restart `pnpm dev:lazy`.** The workspace gateway scans
   `templates/*` (or `apps/*` in a workspace) on startup and picks up
   the new directory automatically:
   - The dispatch shell calls `listWorkspaceApps()` from
     `packages/dispatch/src/server/lib/app-creation-store.ts`, which
     reads `apps/<name>/package.json` to populate the left rail.
   - The shell's capability registry auto-derives capabilities from
     `actions/*.ts` on the next request — no manual `os.install()` call
     is needed for the standard CRUD baseline.
   - The agent's tool catalog grows by the new actions on the next
     session refresh (via `/_fluid-os/skill.md`).

That's the entire onboarding path. Adding a tile to the dispatch UI,
wiring auth, hooking up the agent chat, exposing the agent card at
`/.well-known/agent-card.json` — all inherited from `@agent-native/core`
without per-app code.

## Acceptance criteria for a "shippable" mini-app

The scaffold must, with no hand-editing, satisfy all of the following
before being considered shippable:

- **All 5 baseline capabilities work** — `list`, `get`, `create`,
  `update`, `delete`. Each callable via the agent (as a tool) and via
  HTTP at `/_agent-native/actions/<name>` (as the same endpoint the
  frontend uses).
- **At least 3 unit tests + 1 integration test pass.** Unit tests cover
  individual action handlers with a mocked context; the integration test
  exercises the full HTTP → DB → response path via the framework's
  `runWithRequestContext` helper.
- **UI renders without console errors in both modes.** Standalone at
  `http://localhost:<devPort>/` and embedded at
  `http://localhost:8080/<name>?embed=1`. The embedded mode must hide
  the mini-app's own sidebar.
- **Inter-app comm proven.** At least one capability calls another
  installed app via `ctx.call("<other-app>.<capability>", input)`. The
  integration test asserts the cross-app call returns the expected
  shape. Default choice: the new app's `create-thing` action calls
  `dispatch.record-audit` (or any audit-log capability) to log creation
  events — this validates the contract without requiring a non-trivial
  neighbor.
- **Migration runs cleanly on the shared workspace DB.** Adding the new
  app to a workspace that already has data does not drop, rename, or
  corrupt any existing tables. The guard
  `scripts/guard-no-drizzle-push.mjs` must not fire.
- **Guards pass.** `pnpm prep` runs `guard-template-list.mjs`,
  `guard-no-drizzle-push.mjs`, `guard-no-unscoped-queries.mjs`, and
  `guard-extension-no-public.mjs` — all four must pass.
- **The agent card resolves.** `GET /<name>/.well-known/agent-card.json`
  returns a card with `name`, `url`, and at least one `skill` entry. The
  dispatch shell's `fetchAgentCardMetadata` uses this to discover the
  app.

## Test plan for the scaffolder itself

The scaffolder is tested with **golden-file checks plus end-to-end
build runs**:

1. **Golden-file test** in `packages/fluid-os/tests/scaffold/template.spec.ts`:
   - Snapshot the output of `buildManifestSource(spec)` and the full file
     tree of a `pnpm fluid-os create-app golden-app --description … …`
     run into a temp dir.
   - On every CI run, regenerate the tree and `diff` it against the
     fixture under `packages/fluid-os/tests/fixtures/golden-app/`. Any
     drift fails the test and is fixed by updating the fixture
     intentionally.

2. **Build-and-run test** in
   `packages/fluid-os/tests/scaffold/scaffold-builds.spec.ts`:
   - Scaffold a fresh `tests-tmp/golden-app/` mini-app.
   - Run `pnpm install --filter golden-app`, `pnpm --filter golden-app
     build`, and `pnpm --filter golden-app test`.
   - Assert all three exit zero and that the scaffold's own
     three unit tests + one integration test pass on the first run with
     no edits.

3. **Registry-pickup test** in
   `packages/dispatch/src/server/lib/app-creation-store.spec.ts`
   (already exists for the popover flow; extend it):
   - After scaffolding, call `listWorkspaceApps()` and assert the new
     entry appears with `status: "ready"`.
   - Assert the new app's five capabilities appear in
     `getArchitectureOverview()` / the equivalent registry list.

4. **Guard test** — `scripts/guard-template-list.mjs` must exit 0 after
   the scaffolder writes both `templates.ts` and `templates-meta.ts`
   entries.

5. **Negative test** — running `pnpm fluid-os create-app mail` (a name
   that already exists) must exit non-zero with a clear message and
   leave the filesystem untouched (`cleanupOnFailure` covers this for
   the workspace flow; the new scaffolder must do the same).

When all five tests pass, a fresh `pnpm fluid-os create-app <name> …`
run from a clean checkout produces a mini-app that boots, registers,
serves UI, exposes five capabilities, has tests passing, and is visible
to the agent — with zero hand-editing between scaffold and first
working call.

---

⠀
🟢 Spec written to docs/onboarding/creating-a-new-mini-app.md
