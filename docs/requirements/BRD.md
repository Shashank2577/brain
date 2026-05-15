# Business Requirements Document — Fluid Super-App

## Vision

A **personal + team productivity super-app** where users and AI compose, use, and extend a growing catalog of mini-apps from one signed-in experience. Calendar, mail, notes, tasks, CRM, slides, forms, design, analytics, recordings — all in one shell, all aware of each other, all extendable by the user or by an agent that lives inside the shell.

## Problem we're solving

Current productivity stacks are fragmented. A typical knowledge worker holds:
- A calendar (Google / Outlook)
- An email client (Gmail / Outlook)
- A notes tool (Notion / Obsidian / Apple Notes)
- A todo app (Things / Todoist / Linear)
- A CRM (Salesforce / HubSpot / nothing)
- A docs tool (Google Docs / Notion)
- A presentation tool (Slides / Pitch)
- A form builder (Google Forms / Typeform)
- A screen-recorder (Loom / Clips)
- Plus dozens of integrations + automations across them

Each tool is a silo. Switching is expensive. Cross-app workflows require duplicate manual entry or fragile Zapier-style automations. AI lives at the edges (Copilot, ChatGPT) and can't natively act across the stack.

## What the Fluid super-app changes

1. **One signed-in surface** — one login, one identity, one set of credentials. Move from any app to any other with one click, never re-auth.
2. **Apps that genuinely know about each other** — the calendar can ask the meetings app to start a transcript; the CRM can ask mail to send an email; the agent can string capabilities together to fulfil a high-level user request. Inter-app communication is typed and identity-aware, not a brittle webhook chain.
3. **AI as a native citizen** — every mini-app exposes its actions as agent tools. The agent isn't a separate product layered on top; it's the way most non-trivial cross-app workflows get done.
4. **Extensibility** — users (or the agent on their behalf) can scaffold new mini-apps from templates. The marketplace is "everything any user has built that could be useful to others."
5. **Open + self-hostable** — the platform is composable and the user owns their data. Mini-apps can be developed independently and dropped into any super-app instance.

## Target users

- **Primary** — Builders / power users / small teams who want to compose their own productivity stack instead of buying ten separate SaaS tools
- **Secondary** — Developers who want a fast way to ship a new internal tool that benefits from shared identity, AI, and inter-app integration
- **Tertiary** — Larger orgs evaluating an AI-native replacement for parts of their stack (CRM, internal forms, knowledge base)

## Success criteria

### Phase 1 (this branch — by end of os-shell merge)
- A new user can sign in once and use all 9 existing mini-apps without further auth
- Mini-app data persists across restarts (P0 fix from PLAN.md)
- The left-rail / iframe shell allows one-click switching between any installed mini-app
- At least one inter-app workflow works end-to-end (CRM → mail → calendar, validated in browser)
- A user can scaffold a new mini-app from the Create-app flow and see it appear in the rail

### Phase 2 (next major milestone)
- Mobile shell foundation — iOS or Android lists installed apps from the same registry
- Bedrock LLM provider available alongside Claude/OpenAI/Gemini
- Test coverage above 60% across the framework + mini-apps
- At least 3 net-new mini-apps built by the agent on user request (proves the scaffolder)

### Strategic horizon (6-12 months)
- Public install/marketplace for community-built mini-apps
- Multi-tenant deployment with org-level access controls
- Performance: full-shell cold load < 2s; in-app switch < 200ms

## Value proposition by audience

| Audience | Pain | What Fluid offers |
|---|---|---|
| Power user / builder | Fragmented SaaS, vendor lock-in, no automation | One shell, agent-driven workflows, self-host, open data |
| Indie hacker / solo dev | Building a CRUD app every time = time loss | Scaffold a mini-app in 1 command, get auth + DB + UI baseline free |
| Small team / startup | $200/seat/month across 8 tools | Self-hosted super-app with the 8 tools they actually use |
| AI-first developer | LangChain agents don't see across apps | Native capability registry; agents see and act across the whole super-app |

## Out of scope (this branch)

- A public marketplace (planned for later)
- Enterprise SSO (SAML / Okta) — Google OAuth + email/password is enough for v1
- Multi-region deployment / replication
- Self-host packaging (Docker images, Helm charts) — repo currently optimises for local dev; productionisation comes later
- iOS / Android shell *implementations* — only the foundation contract is in scope (P8)

## Non-goals (deliberate)

- Competing feature-for-feature with the SaaS leaders in any single category. Mini-apps will be 60% as feature-rich as Notion / Linear / HubSpot at first. The value is composition + AI + identity, not feature parity.
- Locking developers into a proprietary mini-app format. Templates are plain TypeScript / React / Nitro. A mini-app could be detached from the super-app and run standalone with minor changes.
- Mandatory cloud / SaaS lock-in. Self-host first; managed offering later if there's demand.

## Risks

- **Single-server architecture limits scale.** Acceptable for v1 (single-tenant self-host); revisit when multi-tenant becomes a real ask.
- **Inter-app coupling can become a tangle.** The capability registry should be the only allowed coupling; this needs guards (linting that flags `import "<another-app>/..."` and forces calls through `ctx.call`).
- **AI provider lock-in.** Mitigated by the multi-provider abstraction. Bedrock joins Claude / OpenAI / Gemini / OpenRouter.
- **Architectural drift.** Multiple agents working in parallel on the same codebase can introduce inconsistencies. Mitigated by ADRs, this spec ecosystem, and explicit pivot triggers.
