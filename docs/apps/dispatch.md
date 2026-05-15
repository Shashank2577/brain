# Dispatch

## Purpose

Workspace control plane — central inbox and router for Slack / Telegram / WhatsApp / email integrations, a vault for shared secrets, a registry for remote A2A agents, approvals + audit logs, and workspace-wide shared resources (skills, instructions, agents, knowledge). Dispatch is itself a mini-app (the shell) and owns its own data.

## Data model

`packages/dispatch/src/db/schema.ts` (re-exported from `templates/dispatch/server/db/index.ts`):

- `dispatch_destinations` — message routing targets (platform + destination + thread ref).
- `dispatch_identity_links` — link an internal user to an external platform identity (Slack / Telegram / etc.).
- `dispatch_link_tokens` — short-lived tokens used to claim a new identity link.
- `dispatch_approval_requests` — pending change requests with before/after value snapshots, summary, payload.
- `dispatch_audit_events` — append-only audit log: actor, action, target, summary, metadata.
- `vault_secrets` — workspace-wide encrypted secrets (name, credential key, value, provider).
- `vault_grants` — per-app grants of a secret (status: active/revoked, synced timestamp).
- `vault_requests` — app's request for a secret (pending approval).
- `vault_audit_log` — vault-specific audit trail.
- `workspace_resources` — shared `skill | instruction | agent | knowledge` resource (path + content + scope).
- `workspace_resource_grants` — per-app grants of a workspace resource.

Integration message queue, jobs, memory, and approvals live in framework / package-level tables (e.g. `integration_pending_tasks` in `@agent-native/core`).

## Capabilities

Only three template-level actions:

- `dispatch.view-screen`.
- `dispatch.run` — generic dispatcher entry.
- `dispatch.list-dispatch-usage-metrics` — usage metrics.

The remaining surface area lives inside the `@agent-native/dispatch` package (integration webhooks, vault management, approvals, agent routing) and is exposed via framework-mounted routes under `/_agent-native/integrations/*` and Dispatch's package-defined actions.

## UI routes

- `/` and `/overview` — landing.
- `/apps` and `/apps/:appId`, `/:appId`, `/new-app` — installed apps.
- `/agents` — remote A2A agent registry.
- `/approval` and `/approvals` — pending approvals.
- `/audit` — audit log.
- `/destinations` — Slack/Telegram/etc. routing targets.
- `/identities` — linked external identities.
- `/integrations` — connected platforms.
- `/messaging` — message console.
- `/metrics` — usage metrics.
- `/tools` and `/tools/:id` — workspace tools/skills.
- `/vault` — workspace secrets.
- `/workspace` — workspace settings.
- `/thread-debug` — agent thread inspector.
- `/team`, `/extensions`.

## Inter-app dependencies

- **Every other app via A2A** — dispatch routes domain prompts to the right agent (`call-agent --agent=<slug>`). The `AGENTS.md` explicitly delegates calendar, slides, content, mail, analytics, design, clips, forms questions to their respective agents. Inbound Slack/Telegram messages can also invoke `mail.queue-email-draft` for human-reviewed sends.

## Inter-app consumers

None — dispatch is the orchestrator at the top of the call graph. Other apps reply to A2A calls *from* dispatch but do not call into dispatch.

## Status

Production-ready (core: true).

## Known gaps

Most logic is hidden inside `@agent-native/dispatch`, so this template's surface is thin (3 actions, 21 routes pulled from the package). No CLAUDE.md at the template root — guidance lives in `AGENTS.md` only. Vault grants are app-scoped but cross-org sharing of secrets is not yet modeled.
