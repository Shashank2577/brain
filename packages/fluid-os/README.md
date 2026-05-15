# Fluid OS

A new layer on top of the agent-native framework that turns each template into an **independent app** participating in a shared **app ecosystem**.

It answers four questions the framework didn't have a clean answer for:

1. **How does a template app know what other apps exist?** → It queries the OS capability registry.
2. **How does it call them without copying their code?** → Typed RPC over the OS, gated by a signed session.
3. **How is the user authenticated once for all of them?** → A single OS identity. Apps trust an OS-issued JWT.
4. **How does the agent discover everything that's installed?** → The same registry is exposed as an agent tool catalog.

Existing templates are untouched. To plug an existing template into the OS, you add a single `app.manifest.ts` that declares its capabilities — no migration of internals.

## The contract

Every app exports one thing — a manifest — built with `defineApp`:

```ts
import { z } from "zod";
import { defineApp } from "@agent-native/fluid-os/manifest";

export const mailApp = defineApp({
  id: "mail",
  name: "Mail",
  description: "Read and send email.",
  url: "https://mail.example.com",
  routes: [{ path: "/inbox", label: "Inbox" }],
  capabilities: {
    send: {
      description: "Send an email.",
      input: z.object({ to: z.string().email(), subject: z.string(), body: z.string() }),
      output: z.object({ id: z.string() }),
      handler: async (input, ctx) => {
        // ctx.user        → OS-verified user
        // ctx.caller.appId → which app made the call
        // ctx.call(fqid, input) → call any other capability
        return { id: "..." };
      },
    },
  },
});
```

That's it. The manifest is the **only** thing the OS sees about the app. Internals (database, framework, language) are private.

## Architecture

```
   ┌───────────────────┐         ┌───────────────────┐
   │  App: notes       │         │  App: tasks       │
   │  - notes.create   │         │  - tasks.create   │
   │  - notes.list     │◄────────┤  - tasks.complete │
   │  - notes.search   │   RPC   │  (consumes notes) │
   └─────────┬─────────┘         └─────────┬─────────┘
             │                             │
             └─────────────┬───────────────┘
                           ▼
                ┌───────────────────────┐
                │      Fluid OS         │
                │  ┌─────────────────┐  │
                │  │ CapabilityRegistry │ ← all installed manifests
                │  ├─────────────────┤  │
                │  │ IdentityProvider │ ← signs/verifies OS sessions
                │  ├─────────────────┤  │
                │  │ RPC handler      │ ← POST /_fluid-os/rpc
                │  ├─────────────────┤  │
                │  │ Agent tool view  │ ← capabilities → tools
                │  └─────────────────┘  │
                └───────────────────────┘
                           ▲
                           │ single sign-on
                ┌──────────┴────────────┐
                │       The user        │
                └───────────────────────┘
```

## Pieces

| Module | Purpose |
| --- | --- |
| `manifest/` | `defineApp`, `defineCapability`, types. The public schema. |
| `registry.ts` | `CapabilityRegistry` — collects manifests, resolves `app.capability` ids, generates a markdown description for the agent. |
| `identity/session.ts` | `IdentityProvider` — signs/verifies OS session JWTs (HS256 via `jose`). |
| `rpc/server.ts` | `createRpcHandler` — turns the registry + identity into an HTTP handler. |
| `rpc/client.ts` | `createOsClient` — typed client an app uses to call the OS. |
| `agent/tools.ts` | `capabilitiesToAgentTools` — exposes every capability as an agent tool. |
| `host/index.ts` | `FluidOs` — composes registry + identity + RPC into one runnable object. |

## Cross-app calls

When an app handler runs, it gets a `ctx.call(fqid, input)` helper. That's how `tasks.create` can call `notes.create`:

```ts
handler: async (input, ctx) => {
  if (input.alsoNote) {
    const note = await ctx.call<{ id: string }>("notes.create", { title: input.text });
    return { ..., linkedNoteId: note.id };
  }
}
```

The call runs in-process when both apps are co-located with the OS; in a distributed deployment it goes over HTTP RPC.

## Identity

One OS, one user table, one signed token. Apps never see passwords or run their own auth UI — they receive a short-lived JWT signed by the OS. `IdentityProvider`:

- `sign(user, { audienceAppId, ttlSeconds })` — issues a token scoped to one audience.
- `verify(token, { audienceAppId })` — apps verify before trusting the user.

Tokens default to 15-minute TTL; the OS shell refreshes them transparently.

## Run the demo

```bash
cd packages/fluid-os
pnpm install
pnpm demo
```

You'll see seven apps install (`notes`, `tasks`, `mail`, `calendar`, `content`, `slides`, `dispatch`), the full capability registry print as the agent would read it, then a cross-app flow:

1. **`dispatch.broadcast`** fans out to **`mail.send-email`** for three recipients.
2. A second user (Bob) lists his inbox via **`mail.list-inbox`** and sees only the email addressed to him — sessions are user-scoped end to end.
3. **`content.create-document`** stores a doc; **`slides.create-deck-from-document`** then reads it via **`content.get-document`** and turns paragraphs into slides.
4. **`dispatch.send-and-schedule`** resolves a contact via **`mail.find-contact`**, checks the slot via **`calendar.check-availability`**, sends the email, and books the follow-up via **`calendar.create-event`** — all in one call.
5. Retrying the same slot is rejected by **`calendar.check-availability`** — the OS doesn't double-book.

## Adapting a real template

The five "real-template" manifests under `examples/apps/{mail,calendar,content,slides,dispatch}` deliberately match the **shape** of each template's actions — same capability names, same input/output. To plug in the live template:

1. Drop the manifest file into the template (or a colocated package).
2. Replace each capability `handler` with a call to the template's existing action (`defineAction`). The handler signature is identical; you only swap the body.
3. Boot the OS with `os.install(<template>App)` from the template's startup plugin.

Once you do that, no other template needs to reimplement `find-contact`, `send-email`, `check-availability`, `get-document`, etc. They look it up in `registry.listCapabilities()` and call it via `ctx.call(...)`.

## Shell UI

`http://localhost:4100/` serves a React + Tailwind + shadcn-style shell that matches the templates' visual language:

- **Sign-in** with GitHub OAuth (set `FLUID_OS_GITHUB_CLIENT_ID` / `FLUID_OS_GITHUB_CLIENT_SECRET`) or dev-mode buttons. The GitHub profile is mapped onto a single OS user record (keyed by GitHub id + email); every app sees the same user through `ctx.user`.
- **Sidebar** lists every installed app, with a capability count badge.
- **App detail pane** shows the app's name, URL, routes, what it `consumes` from other apps, and an interactive card per capability where you can edit JSON input and invoke the capability over the live RPC.

Build it with `pnpm build:shell`, then run `pnpm demo:server` (no demo flow) or `pnpm demo` (cross-app dance + server). The Vite dev server (`pnpm dev:shell`) proxies `/_fluid-os/*` to the OS for hot-reload editing.

## Creating new apps

Three equivalent entry points share one `ScaffoldSpec` shape:

1. **Wizard in the shell** — `Create app` button in the header. Reads the live registry, suggests which capabilities to `consume` from a plain-English description, scaffolds the manifest, **hot-installs it on the running OS** in one click. The new app appears in the sidebar without a restart.
2. **`POST /_fluid-os/scaffold`** — body matches the wizard's spec. Same hot-install path. Use this from agents, scripts, or external integrations.
3. **`pnpm create-app` CLI** — prints the registry first, validates `--consumes` against the live capability list, writes the manifest. Does not hot-install (the server is local to its own process).

See [CREATING-APPS.md](./CREATING-APPS.md) for the full agent-driven flow.

## How the agent learns what's installed

The OS publishes a **live** skill at two endpoints — both generated from the registry on every request, so nothing can drift:

- `GET /_fluid-os/skill.md` — markdown the agent can ingest as a session skill. Header + per-app section (description, capabilities, agent guidance) + cross-app patterns + scaffolding flow.
- `GET /_fluid-os/skill.json` — same data, structured.

Each manifest carries an optional `agentGuidance` field — a few sentences of pattern guidance specific to that app (e.g. "Mail is the only app that owns email — call `mail.send-email`, don't reimplement it"). The OS aggregates every app's guidance into the skill output.

## AI work goes through the agent

Capability handlers get `ctx.agent(prompt)` in addition to `ctx.call(...)`. The OS routes that call to a pluggable `AgentClient` (`packages/fluid-os/src/agent/client.ts`); the default is a stub that returns `[agent not configured]`. Plug in a real client at host construction time:

```ts
const os = new FluidOs({ secret, agent: new MyAgentClient(...) });
```

The `meetings` app uses this for transcription, summarization, and action-item extraction — no inline LLM calls in any handler.

## What's still ahead

- Persistent registry across processes (today it's in-memory; back it with SQL for multi-process deployments).
- Per-capability permission scopes (`scope` is in the JWT, but no caller checks it yet).
- Realtime channels — apps can call each other synchronously today; event fan-out is the next obvious primitive.

These are deliberate cuts so the contract is small and the rest can grow against a stable core.
