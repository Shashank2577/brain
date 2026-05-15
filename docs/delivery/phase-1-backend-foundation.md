# Phase 1 — Backend Foundation

**Goal:** Move the capability registry + RPC dispatcher from the standalone `packages/fluid-os/` host into the dispatch Nitro server, and auto-derive capabilities from each template's `actions/` directory.

This phase is the keystone — every subsequent phase depends on it.

## Deliverables

- [ ] `packages/dispatch/src/server/plugins/capability-registry.ts` — dispatch plugin that boots a `CapabilityRegistry` instance, scans `templates/*/actions/*.ts`, auto-derives capabilities, exposes registry HTTP API
- [ ] `packages/dispatch/src/server/plugins/rpc.ts` — RPC handler at `/_agent-native/registry/rpc` for inter-app calls
- [ ] `packages/fluid-os/src/registry.ts` — kept as a library export (unchanged); dispatch plugin imports it
- [ ] `packages/fluid-os/src/rpc/server.ts` — kept as a library; dispatch plugin imports for `createRpcHandler()`
- [ ] HTTP API surface:
  - `GET /_agent-native/registry/apps` — list of registered mini-apps (id, name, description, icon, base path, capabilities count)
  - `GET /_agent-native/registry/capabilities` — list of FQID capabilities with Zod schemas (JSON Schema form for client tooling)
  - `POST /_agent-native/registry/rpc` — inter-app call (replaces fluid-os `/_fluid-os/rpc`)
- [ ] Identity propagation — `ctx.call("<fqid>", input)` runs the target action inside `runWithRequestContext({ userEmail, orgId })` from the calling request's session; no JWT minting
- [ ] **Relationship to A2A** — the existing A2A `call-agent` pattern (templates calling each other's agent chats via JSON-RPC over HTTP) stays. The capability registry is a faster in-process complement for action-level calls; A2A is the protocol-level fallback when targets are in a different process / on the network. ADR-004 amends to reflect this.

## Tasks

| ID | Task | Owner | Depends |
|---|---|---|---|
| T-P1-01 | Read fluid-os registry + rpc/server code; understand current behavior | Researcher | — |
| T-P1-02 | Read templates/*/actions/*.ts patterns; understand defineAction() output shape | Researcher | — |
| T-P1-03 | Draft capability auto-derivation logic (parse defineAction exports → capability records) | Product Engineer | T-P1-01, T-P1-02 |
| T-P1-04 | Implement dispatch plugin that boots the registry at startup | Product Engineer | T-P1-03 |
| T-P1-05 | Implement RPC handler with identity propagation (no new JWTs) | Product Engineer | T-P1-04 |
| T-P1-06 | Add unit tests for the auto-derivation logic | Product Engineer | T-P1-04 |
| T-P1-07 | Add integration test: register fake capability, call it via RPC, assert identity propagation | Product Engineer | T-P1-05 |
| T-P1-08 | Architect review pass | Architect | T-P1-04..07 |

## Acceptance criteria

- [ ] `GET /_agent-native/registry/apps` returns ≥ 10 entries (the current templates) when dispatch boots
- [ ] `GET /_agent-native/registry/capabilities` returns all auto-derived FQIDs with descriptions + JSON Schema input
- [ ] `POST /_agent-native/registry/rpc` with `{capability: "slides.list-decks", input: {}}` succeeds; assertions:
  - 200 OK
  - Response body matches the slides `list-decks` action's output schema
  - The action ran under the caller's user identity (verified by logging `getRequestUserEmail()` inside a test action)
- [ ] When tasks calls `notes.create` via `ctx.call(...)`, the resulting note's `ownerEmail` == calling user, NOT `"tasks"` or anything else
- [ ] Static guards still pass: `pnpm guards`
- [ ] Existing test suite still passes: `pnpm test`
- [ ] TypeScript clean: `pnpm typecheck`
- [ ] No new dependencies added to root `package.json` other than what's already present

## QA plan

- Unit: 8+ tests for the auto-derivation logic (action parsing, schema extraction, FQID generation)
- Integration: 4+ tests for the RPC handler (success, validation failure, target not found, identity propagation)
- Manual: hit the three new HTTP endpoints with curl + the seeded `alice@demo.local` cookie; verify shapes

## Pivot triggers

- **If auto-derivation from `actions/*.ts` files at boot is slow (>2s):** generate a `.generated/capabilities.json` manifest at build time, register from that file at boot. Build adds the action scan; runtime just reads the manifest.
- **If identity propagation breaks for nested calls (A→B→C):** stop in-process dispatch; route all inter-app calls through the A2A protocol over HTTP loopback. Slower but battle-tested.
- **If the registry boot blocks Nitro startup:** make registration lazy (first call to `/_agent-native/registry/*` triggers the scan). Trade-off: first call is slow, subsequent calls are fast.

## Risks

- Mini-apps that import each other's modules directly (instead of via `ctx.call`) won't be detected by the registry guard. Phase 4 adds a static check.
- Auto-derivation requires every action to use `defineAction()` consistently. Spot-check existing templates and patch any irregularities as part of T-P1-02.

## Out of scope

- Capability **isolation enforcement** (manifest.consumes whitelist) — deferred to a future phase. Currently advisory only.
- Inter-process / cross-server RPC. v1 is in-process inside dispatch.
- Cycle detection beyond simple A→A self-call. Multi-hop cycle detection is a future enhancement.

## Estimated effort

1.5 dev-days (Product Engineer) + 0.5 day review (Architect) = 2 days.
