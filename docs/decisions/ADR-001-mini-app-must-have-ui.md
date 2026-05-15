# ADR-001: Every mini-app must have a UI

**Status:** Accepted (2026-05-16, branch `os-shell`)

## Context

We have two architectures running side-by-side in this repo:

- **Workspace templates** under `templates/<name>/` — full Nitro + Drizzle + React Router apps with their own UI
- **Fluid-OS manifest-only apps** under `packages/fluid-os/examples/apps/<name>/` — backend-only manifests with no UI

Notes, tasks, CRM, and meetings exist only as manifest-only apps. The dispatch shell at `/dispatch/apps` therefore doesn't show them — they're invisible to users.

We need to decide whether mini-apps in the Fluid super-app are allowed to be UI-less.

## Decision

**Every mini-app MUST have a UI** that renders inside the super-app shell. The user is the primary audience for every mini-app; "an app with no UI" is not an app, it's a service.

The only exception is **future agentic systems** — backend services exposed as capabilities for the agent to call but not displayed in the user-facing rail. They are a deliberate exception, not a default.

## Consequences

- The currently manifest-only apps (notes, tasks, CRM, meetings) are promoted to full templates with backend + UI in [Phase 3](../delivery/phase-3-mini-app-promotion.md).
- The `templates/<name>/` template format becomes the single canonical mini-app shape (see [ADR-002](ADR-002-iframe-content-area.md), [`architecture/02-mini-apps.md`](../architecture/02-mini-apps.md)).
- The `packages/fluid-os/examples/apps/` directory is removed in [Phase 4](../delivery/phase-4-cleanup.md). Capability declarations are auto-derived from each template's `actions/` instead.
- The scaffolder MUST produce a working UI for every new mini-app (see [`onboarding/creating-a-new-mini-app.md`](../onboarding/creating-a-new-mini-app.md)).

## Alternatives considered

- **Keep manifest-only apps as a lighter-weight format.** Rejected because they break the super-app UX (no presence in the rail) and confuse the architecture (two app shapes). The cost of building a UI is amortised by the scaffolder.
- **Have a "service mini-app" category** with no UI but registered in a separate "Services" tab. Rejected for v1 — premature. Revisit when the first concrete agentic-only service surfaces.

## References

- PRD section "Mini-app catalog"
- Pavel/Tara/Maya persona requirements
- User direction: "all apps should always have UI, except future agentic systems"
