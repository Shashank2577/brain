# Architecture Overview

The Fluid super-app is **one cohesive product** containing many independently-buildable mini-apps (calendar, mail, slides, notes, tasks, CRM, etc.). Users install or visit one super-app; inside it they have all their tools, with a persistent left rail for app switching, a persistent agent sidebar for AI, and shared identity + data across every mini-app.

This document describes the system at the layer-and-contract level. Subsystem details live in `01-super-app-and-shells.md`, `02-mini-apps.md`, etc.

## The three-layer architecture

```
                                       ┌──────────────────────────┐
                                       │ Shells (one per platform) │
                                       │ ──────────────────────── │
                                       │ Web shell  (dispatch)    │
                                       │ iOS shell  (future)       │
                                       │ Android shell (future)    │
                                       └────────────┬─────────────┘
                                                    │ HTTP + capability RPC
                                       ┌────────────┴─────────────┐
                                       │ Capability Registry      │
                                       │ + Inter-app RPC dispatcher│
                                       │ (lives inside dispatch's  │
                                       │  Nitro server)            │
                                       └────────────┬─────────────┘
                                                    │
            ┌───────┬──────────┬──────────┬─────────┴─────────┬──────────┬──────────┐
            ▼       ▼          ▼          ▼                   ▼          ▼          ▼
        ┌──────┐ ┌──────┐ ┌────────┐ ┌────────┐         ┌────────┐ ┌──────┐ ┌──────┐
        │notes │ │tasks │ │calendar│ │  mail  │   ...   │  CRM   │ │slides│ │forms │
        │ app  │ │ app  │ │  app   │ │  app   │         │  app   │ │ app  │ │ app  │
        └──┬───┘ └──┬───┘ └───┬────┘ └───┬────┘         └───┬────┘ └──┬───┘ └──┬───┘
           └─────┬──┴─────┬───┴────┬─────┴───────┬──────┬───┴────────┴────────┘
                 │        │        │             │      │
                 ▼        ▼        ▼             ▼      ▼
                 ┌────────────────────────────────────────┐
                 │ Shared workspace database (SQLite/PG)   │
                 │ + Shared Better Auth session store      │
                 │ + Shared OAuth tokens                   │
                 └────────────────────────────────────────┘
```

**Three layers**, each independently replaceable:

1. **App services (mini-apps)** — Each mini-app is a `templates/<name>/` directory with its own Nitro server, Drizzle schema, actions, and React Router UI. Apps don't talk to each other directly; they go through the registry.
2. **Capability registry + RPC** — Lives inside the dispatch Nitro server. Discovers each template's actions at boot, exposes them as typed RPC capabilities (`<app>.<capability>`), routes inter-app calls with identity propagation.
3. **Shells** — Per-platform user interfaces. The web shell is dispatch itself. Future iOS and Android shells consume the same registry HTTP API and render their own UI.

## The mini-app contract

Every mini-app (today and future) ships with all three of:

| Element | Contains |
|---|---|
| **Backend** | A Nitro server in `templates/<name>/server/` with its own Drizzle schema (tables namespaced to the app), migrations, and HTTP handlers. Owns its data exclusively. |
| **Actions** | `templates/<name>/actions/*.ts` — Zod-typed handler functions. Auto-derived into capabilities by the registry. The single source of truth for "what this app can do". |
| **UI** | `templates/<name>/app/` — React Router routes + components. Detects "embedded mode" (loaded inside the dispatch shell) and adapts (hides own sidebar). Same UI can be loaded standalone for development. |

**Optional**: a custom AGENTS.md / CLAUDE.md inside the mini-app describing agent guidance for that domain.

The contract is enforced by the framework, not by convention — `defineAction()` produces type-safe actions, and the framework's `ownableColumns()` / `accessFilter()` / `assertAccess()` model handles per-user data scoping uniformly.

## The capability layer

A capability is a typed function exposed by a mini-app:

```typescript
// templates/notes/actions/create-note.ts
export default defineAction({
  name: "create-note",
  description: "Create a new note",
  input: z.object({ title: z.string(), body: z.string().default("") }),
  output: z.object({ id: z.string(), title: z.string(), body: z.string(), createdAt: z.number(), ownerId: z.string() }),
  run: async (input, ctx) => {
    // ctx.userEmail, ctx.orgId, ctx.db etc.
  },
});
```

The registry auto-derives the capability `notes.create-note` from this. Inter-app calls look like:

```typescript
// inside templates/tasks/actions/create-task.ts
const note = await ctx.call("notes.create-note", { title: input.text, body: "" });
```

`ctx.call(...)` routes through dispatch's capability dispatcher, which:
1. Validates the input against the target capability's Zod schema
2. Forwards the user's session cookie so identity propagates (the created note has `ownerId = currentUser`, not `ownerId = tasks-app`)
3. Returns the typed output

This is the single point of inter-app coupling. Mini-apps don't import each other's modules; they go through the registry.

## Identity and data

- **One workspace database**, accessed via `DATABASE_URL` — every mini-app reads/writes its own tables, but they live in the same DB. The framework's `user`, `session`, `account`, `oauth_tokens` tables are shared. Mini-app-specific tables are namespaced (`notes_*`, `tasks_*`, etc.).
- **One Better Auth secret** — every mini-app validates session tokens against the same `BETTER_AUTH_SECRET`, so a sign-in at dispatch is recognised by every mini-app on the same origin.
- **One cookie** — `an_session_workspace` is the workspace-mode cookie, set with `Path=/`. Travels to every mini-app via the workspace gateway.
- **Google OAuth identity** — the social provider is configured at the workspace level. Per-app incremental scope grants happen when a mini-app needs additional Google scopes (e.g. calendar requests `calendar.events` after sign-in).

## The web shell (dispatch)

Dispatch is itself a mini-app, but with three special responsibilities:

1. **Renders the super-app shell** — left rail, top bar, agent sidebar, central content area
2. **Hosts the capability registry** — the dispatcher that all inter-app calls route through
3. **Owns the LLM provider config** — Claude / OpenAI / Gemini / OpenRouter / Bedrock all configured at the dispatch level

The left rail lists every mini-app installed in the workspace. Clicking an icon switches the central content area to that mini-app's UI (currently via iframe; reversible to Module Federation or merged React tree later). The agent sidebar stays mounted across switches.

## Future shells

Mobile iOS and Android shells will consume the same capability registry over HTTP. They will render their own native UI per mini-app. The mini-app contract stays the same — backend + manifest. Whether each mini-app's mobile UI is a WebView of the existing template or a native rewrite is a per-app decision deferred until [`ADR-006`](../decisions/ADR-006-mobile-foundation-strategy.md).

## Where things live

| Concern | Path |
|---|---|
| Mini-app source | `templates/<app>/` |
| Capability registry impl | `packages/dispatch/src/server/plugins/capability-registry.ts` (target — moves from `packages/fluid-os/src/registry.ts`) |
| RPC dispatcher | `packages/dispatch/src/server/plugins/rpc.ts` (target — moves from `packages/fluid-os/src/rpc/`) |
| LLM provider abstraction | `packages/core/src/server/agent-chat-plugin.ts` |
| Shared workspace config | `packages/shared-app-config/templates.ts` (the app allow-list) |
| Web shell UI | `templates/dispatch/app/` + `packages/dispatch/src/components/` |
| Future mobile shell | `packages/mobile-app/` |
| Scaffolder | `packages/fluid-os/src/scaffold/` (kept as a library; called from dispatch's Create-app flow) |

See subsystem docs (`01`–`06`) for detail per layer.
