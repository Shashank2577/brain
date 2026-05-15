# ADR-004: Capability registry and RPC live inside the dispatch server

**Status:** Accepted (2026-05-16, branch `os-shell`)

## Context

The fluid-os work shipped a separate HTTP host at port 4100 (`packages/fluid-os/examples/host/server.ts`) with its own capability registry, RPC dispatcher, identity provider (dev-signin + GitHub OAuth), and a React shell. It runs alongside the workspace gateway at port 8080.

This duplicates everything: two shells, two identities, two cookie schemes, two LLM provider configs, two app-listing pages. Users hit `/dispatch/apps` and don't see notes/tasks/CRM because those live on the `:4100` host.

## Decision

**Kill the `:4100` host.** Move the capability registry, RPC dispatcher, and scaffolder into the dispatch Nitro server as a plugin. Dispatch becomes the single backend for the web super-app.

The `packages/fluid-os/` package is retained as a **library** that dispatch imports — it ships the registry, RPC protocol, scaffolder, manifest types, and agent tools. The package exports become consumable; the standalone HTTP server is deleted.

## Consequences

- **One Nitro server** at port 8080 (dispatch). Registry exposed at `/_agent-native/registry/apps`, `/_agent-native/registry/capabilities`. Inter-app RPC at `/_agent-native/registry/rpc`.
- **Capabilities auto-derive from each template's `actions/`** — no manifest file per template. The registry boot scans `templates/*/actions/*.ts` (or imports a generated manifest produced at build), wraps each `defineAction()` export as a capability, and registers it as `<app>.<action-name>`.
- **Identity propagation reuses workspace SSO.** `ctx.call("<target>.<capability>", input)` runs the target action inside `runWithRequestContext()` populated from the current request's session — no separate JWT minting, no `x-fluid-app-id` header dance.
- **All cookie / DB / OAuth wiring is dispatch's** (ADR-003).
- **Mobile shells consume the same registry.** They hit `/_agent-native/registry/*` over HTTP, same as the web shell does internally.

## Migration path (during Phase 1 + 4)

1. **Phase 1** — Move `packages/fluid-os/src/registry.ts`, `src/rpc/*`, `src/manifest/*` into `packages/dispatch/src/server/plugins/capability-registry/`. Wire as a dispatch plugin.
2. **Phase 1** — Implement capability auto-derivation from `templates/*/actions/*.ts`.
3. **Phase 4** — Delete `packages/fluid-os/examples/host/server.ts`, `examples/apps/*` (those are manifest-only stubs being promoted to templates in Phase 3), `src/host/`, `src/cli/`, `src/auth/` (workspace auth supersedes), `src/identity/`. Keep `src/scaffold/` (used in Phase 6).
4. **Phase 4** — Update `packages/fluid-os/package.json` exports to reflect library-only surface.

## Consequences for the agent

The dispatch agent chat already gets a tool registry. The auto-derived capabilities populate this same registry. No separate agent runtime. One LLM provider config (ADR-005) drives the whole super-app's AI.

## Alternatives considered

- **Keep `:4100` running and bridge `/dispatch/apps` to its listing endpoint.** Rejected — preserves the duplication, doesn't solve the cookie / DB / LLM-config split.
- **Move registry into `packages/core/` instead of `packages/dispatch/`.** Future-proof for "any template hosts the registry" — but unnecessarily generic. Dispatch is the shell and the natural home. Can refactor later if a different host emerges.

## References

- ADR-002 (iframes), ADR-003 (shared DB)
- [`architecture/03-capability-registry.md`](../architecture/03-capability-registry.md)
- Phase 1 + Phase 4 delivery docs
