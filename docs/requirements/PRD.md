# Product Requirements Document — Fluid Super-App

## Personas

- **Pavel — Power user** (solo, builds his own tools, self-hosts). Wants every productivity tool he uses to live in one shell with one login.
- **Tara — Team lead at a 12-person company.** Wants her team's calendar, mail, CRM, notes to all see each other, and to be able to spin up new internal tools (forms, dashboards) without buying yet another SaaS.
- **Maya — Indie developer.** Wants to ship a new mini-app idea in an evening — shared auth + DB + AI included. Doesn't want to write CRUD boilerplate.
- **Agent — The AI assistant** that lives inside the super-app. Effectively a fifth user; its requirements are first-class.

## Top-level user stories

These are the load-bearing stories. Subsequent specs (FRD per feature) detail the behaviour.

### As a user, I want one signed-in experience

- **U-AUTH-1** — Sign in once at the super-app, never see another login screen across any mini-app.
- **U-AUTH-2** — Sign in via Google OAuth in one click, OR via email/password if I prefer.
- **U-AUTH-3** — Sign out anywhere in the super-app and be signed out everywhere.
- **U-AUTH-4** — See my name + avatar in the top right of every mini-app I'm in.

### As a user, I want to switch between mini-apps instantly

- **U-NAV-1** — See a left rail with icons for every mini-app installed in my workspace.
- **U-NAV-2** — Click any rail icon to switch to that mini-app with no full-page reload. Current mini-app state preserves on switch and return.
- **U-NAV-3** — See which mini-app I'm currently in (rail icon highlighted, page title updated, URL reflected).
- **U-NAV-4** — Deep-link to any mini-app at a specific view (e.g. `dispatch.example.com/?app=calendar&path=/booking/abc123`) and have the rail + content area open the right state.
- **U-NAV-5** — Use keyboard shortcuts to switch apps (e.g. `Cmd+1` through `Cmd+9` for the first 9 rail icons).

### As a user, I want my mini-apps to know about each other

- **U-INTER-1** — When I create a calendar event, the meetings mini-app can offer to record/transcribe it without me re-entering metadata.
- **U-INTER-2** — When the CRM logs an outreach to a contact, the email actually gets sent via the mail mini-app under my identity.
- **U-INTER-3** — When a meeting ends, action items become tasks in the tasks mini-app (one task per item, owned by me).
- **U-INTER-4** — When I'm viewing a contact in the CRM, I see their related calendar events, sent emails, and meeting notes — pulled live from the respective mini-apps.
- **U-INTER-5** — Inter-app data flows respect ownership. If I share a contact with Tara, she can call CRM capabilities on it; she cannot read my private notes that happened to reference the same contact.

### As a user, I want a persistent AI assistant

- **U-AI-1** — A persistent agent chat sidebar visible on every mini-app's screen.
- **U-AI-2** — Type a request like "draft a Pro plan follow-up for Carol and schedule a 30-min call next Tuesday" and have the agent invoke `crm.find-contact`, `mail.send-email`, `calendar.create-event` automatically — with my identity, with my approval at the right moment for irreversible actions.
- **U-AI-3** — See what the agent is doing (tool calls listed in the chat panel) so I can intervene if it's wrong.
- **U-AI-4** — The agent knows what mini-app + view I'm currently looking at (the `application_state` of the active mini-app is part of the agent's context).

### As a user, I want my data to be safe and mine

- **U-DATA-1** — Every mini-app stores its data in the workspace database I control.
- **U-DATA-2** — Per-user / per-org scoping is enforced — I never see another user's notes, contacts, or recordings except via explicit sharing.
- **U-DATA-3** — Sharing is per-resource, per-role (viewer / editor / admin), per-principal (user / org / public).
- **U-DATA-4** — Data export is possible per mini-app (e.g. download all my notes as a zip).

### As a user, I want to create new mini-apps on demand

- **U-CREATE-1** — A "+ Create app" button in the dispatch shell.
- **U-CREATE-2** — Pick a starting template (blank, CRUD-list, blog, dashboard, etc.) + give the new app a name and an icon.
- **U-CREATE-3** — After confirming, the agent + scaffolder produces a working mini-app under `templates/<my-name>/`, runs migrations on the shared DB, and adds the app to my left rail.
- **U-CREATE-4** — The new mini-app is callable from other mini-apps immediately via `ctx.call("my-app.do-thing", ...)`.
- **U-CREATE-5** — The agent can extend my new mini-app from the chat ("add a 'priority' field to my-app's items") without me leaving the super-app.

### As a developer, I want clean primitives to build a mini-app

- **D-DEV-1** — Use `defineAction()` to register a typed action; it becomes a capability and an agent tool for free.
- **D-DEV-2** — Use `ownableColumns()` + `accessFilter()` to get per-user/org scoping without writing custom SQL guards.
- **D-DEV-3** — Use `ctx.call(...)` for inter-app calls with typed input/output.
- **D-DEV-4** — `pnpm dev:lazy` runs my new app under the workspace gateway with hot-reload + shared auth + shared DB.
- **D-DEV-5** — Vitest unit + integration test setup is scaffolded with my new app.
- **D-DEV-6** — TypeScript types for capabilities are auto-generated so cross-app calls are type-safe at compile time.

### As an AI agent, I want first-class access

- **A-AGENT-1** — Discover every available capability via a single registry endpoint (no per-app integration).
- **A-AGENT-2** — Invoke any capability with the current user's identity, respecting their access scope.
- **A-AGENT-3** — Read the user's current view (`application_state` of the active mini-app) as context.
- **A-AGENT-4** — Have my tool calls subject to approval gates for irreversible actions (send email, delete, charge).
- **A-AGENT-5** — Operate against any configured LLM provider (Claude / OpenAI / Gemini / Bedrock) — the provider is invisible to the agent runtime.

## Mini-app catalog (target state for end of os-shell branch)

| Mini-app | Status | Notes |
|---|---|---|
| dispatch | Production | The shell itself; hosts registry + agent + left rail |
| calendar | Production | Google Calendar integration; events, booking links |
| mail | Production | Gmail integration; inbox, send, threads |
| slides | Production | Deck editor with AI generation + version history |
| forms | Production | Form builder + responses; XSS-fixed |
| content | Production | Notion-style pages |
| design | Production | AI image / design generation |
| analytics | Production | Data sources catalog + dashboards |
| clips | Production | Screen recording + transcription |
| **notes** | New (P3) | Full template promotion from manifest-only |
| **tasks** | New (P3) | Full template promotion |
| **CRM** | New (P3) | Full template; cross-app orchestrator |
| **meetings** | New (P3) | Full template; calendar + transcript + AI summary |

## Acceptance criteria for "production" status

A mini-app is production-ready when it has:

- [ ] Backend with proper Drizzle schema, migrations, and per-user/org scoping
- [ ] React Router UI that works in both standalone and embedded modes
- [ ] At least 5 baseline capabilities exposed (list, get, create, update, delete or domain equivalent)
- [ ] At least one inter-app dependency or consumer demonstrated and tested
- [ ] Unit tests for all actions (mocked DB)
- [ ] Integration tests for capability handlers (real ephemeral DB)
- [ ] At least one e2e test of the happy path through the UI
- [ ] AGENTS.md describing the mini-app's domain for AI guidance
- [ ] Listed in `packages/shared-app-config/templates.ts` (and its `templates-meta.ts` mirror)
- [ ] Sharing model wired via `registerShareableResource(...)` if applicable

## Out of scope (this branch)

- Marketplace / mini-app installation from third parties
- Per-mini-app paid tiers / metering
- Per-mini-app dedicated mobile UIs (foundation only)
- Voice control / dictation as a global super-app feature (clips has it; not a super-app primitive)
- Multi-region replicated database
