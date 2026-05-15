---
"@agent-native/dispatch": minor
---

Add a Nitro plugin that hosts the capability registry + inter-app RPC dispatcher inside dispatch. On boot it scans every `templates/*/actions/*.ts` file, auto-derives one capability per `defineAction()` export (FQID `<app>.<action-name>`), and exposes three new endpoints: `GET /_agent-native/registry/apps`, `GET /_agent-native/registry/capabilities`, and `POST /_agent-native/registry/rpc`. RPC dispatch reads the caller's workspace session via the existing `getSession()` resolver and runs each target action inside `runWithRequestContext({ userEmail, orgId })`, so `ctx.call("notes.create", ...)` from one mini-app preserves the calling user's identity rather than minting a new JWT. Re-uses `CapabilityRegistry` from `@agent-native/fluid-os/registry` unchanged.
