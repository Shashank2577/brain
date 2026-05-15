# @agent-native/fluid-os

The capability-registry library that backs the dispatch super-app. Started life as a standalone OS with its own HTTP host on port `4100`; after Phase 4 of the `os-shell` workplan the host is gone and only the library primitives ship from here.

The dispatch Nitro server consumes these primitives via `packages/dispatch/src/server/plugins/capability-registry.ts`. Templates that need to reference the on-the-wire RPC paths or the `defineApp`/`OsUser`/`CapabilityContext` types import them from this package too.

## What ships

| Subpath               | Surface                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `.` (root)            | `CapabilityRegistry`, `defineApp`, `RPC_PATH`, `LIST_*_PATH`, `RpcRequest/Response`, `createOsClient`, `createRpcHandler` |
| `./manifest`          | `defineApp`, `AppManifest`, `CapabilityDef`, `CapabilityContext`, `OsUser`, `CapabilityMap`, `CapabilityEntry` |
| `./registry`          | `CapabilityRegistry`, `ResolvedCapability`                                                    |
| `./rpc/server`        | `createRpcHandler` — pluggable `resolveUser`/`agent` (dispatch supplies workspace session + agent chat in its own plugin) |
| `./rpc/client`        | `createOsClient`, `RpcError` — HTTP RPC client                                                |
| `./scaffold`          | `ScaffoldSpec`, `validateScaffoldSpec`, `buildManifestSource` — generators consumed by the dispatch app-creation UI in Phase 6 |

## The contract

Every app exports a manifest:

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
        // ctx.user        → workspace-verified user (dispatch session)
        // ctx.caller.appId → which app made the call
        // ctx.call(fqid, input) → invoke any other registered capability
        return { id: "..." };
      },
    },
  },
});
```

In the dispatch plugin, this manifest is auto-derived from each template's `actions/*.ts` files — `defineAction()` exports become `<app>.<action-name>` capabilities, no per-template manifest file required.

## Architecture (post Phase 4)

```
   ┌────────────────────┐
   │ Dispatch (Nitro)   │
   │ port 8080          │
   │                    │
   │  /_agent-native/   │
   │    registry/apps   │
   │    registry/caps   │
   │    registry/rpc    │
   └─────────┬──────────┘
             │ imports
             ▼
   ┌────────────────────┐
   │ @agent-native/     │
   │ fluid-os (library) │  → CapabilityRegistry, manifest types, RPC protocol
   └────────────────────┘
```

The historical `:4100` standalone host (`examples/host/server.ts`) and the React shell (`src/shell/`) were deleted in Phase 4 — see `docs/decisions/ADR-004-capability-registry-in-dispatch.md` and `docs/delivery/phase-4-cleanup.md`.

## Inter-app calls

Inside a capability handler, `ctx.call("<app>.<capability>", input)` invokes a sibling. Identity propagates: the sub-call's `ctx.user` is the original human user, not a "service-account" representing the calling app. The dispatch plugin wires this through `runWithRequestContext({ userEmail, orgId })` so downstream `getRequestUserEmail()` reads the right user.

## License

MIT
