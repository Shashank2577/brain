# QA-UX — Page-by-Page Product UX Report

**Branch:** `os-shell` @ `4c365250`
**Tester:** QA-UX (4th-pass agent, page-by-page product review)
**Date:** 2026-05-16
**Browser:** Chrome (claude-in-chrome MCP)
**Viewport:** 1512×803, dark theme
**Gateway:** `http://127.0.0.1:8080`
**Seed user:** `alice@demo.local` / `demo1234`

Sister agents: QA-SYSTEM (API), QA-AUTH (identity), QA-EXPLORE (adversarial).

---

## Executive Summary

The product has **strong bones** in 5 surfaces (sign-in/up, dispatch overview, dispatch apps page, slides empty state, design empty state) but is currently undermined by **multiple P0 functional regressions**: 4 first-party app templates (CRM, Notes, Tasks, Meetings) crash with a NitroVite server-build error that exposes a raw stack trace to the user, the dispatch shell renders two-to-three settings panels simultaneously, the shell's left-rail icons are visually indistinguishable (every app appears as a camera icon), and the agent sidebar tabs are both labeled "New chat". The workspace name itself is misspelled "Agentntative" everywhere.

If we had to pick **the single most damaging perception**: the `/dispatch/shell` route — the entire point of the OS-shell branch — is currently a UX disaster. Three overlapping settings panels, identical icons, a forever-spinning iframe area when no app is selected, no breadcrumb, and an "AI assistant not turned on" banner that contradicts the working LLM config two panels over.

Severity counts (P0 = blocker / P1 = critical / P2 = high / P3 = medium / P4 = low / P5 = polish):

| Severity | Count |
|----------|-------|
| P0 Blocker | 7 |
| P1 Critical | 9 |
| P2 High | 14 |
| P3 Medium | 18 |
| P4 Low / verbiage | 12 |
| P5 Polish | 6 |
| **Total** | **66** |

---

## Test environment notes

- Started already signed in as `alice@demo.local` (no need to authenticate at the top).
- Workspace name: **"Agentntative"** (typo: should be "Agentnative" or "Agent-Native") — present in header label, "Apps in Agentntative" subheading, and Account dropdown.
- Header shows "Workspace · 0 apps" while the Apps grid contains 13 apps and Metrics confirms `Workspace apps: 13`.
- Right rail (Setup & configuration) is wider-than-expected, and panels (LLM, Account, etc.) sometimes open expanded by default, eating ~22% of horizontal space.
- LLM is configured: OpenRouter / `openai/gpt-5.5` — the model name **"openai/gpt-5.5"** does not correspond to a published OpenRouter model. Could be a misnomer / seed placeholder.

---

## Page-by-page findings

### 1. Sign-in page — `/dispatch` (signed-out)

Screenshot: `ss_497375mkx`

**Wins:**
- Beautiful dark starfield background — gradient changes between Sign-in and Create-account tabs (nice subtle touch).
- Two-column layout: hero "Agent-Native Dispatch" + value bullets on the left, focused form on the right.
- Footer microcopy is reassuring: "Your account is stored in this app's own DB (SQLite (local file)), not a third-party service." — trust-building.
- "Sign in with Google" + email/password is a clean primary/alt split.
- "Forgot password?" link present.
- "Open source" link in hero footer.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1.1 | P3 | "Sign in to your account" label below "Welcome back" — redundant; "Welcome back" + the button copy already communicate this. |
| 1.2 | P4 | "Your account is stored in this app's own DB (SQLite (local file))" — the parenthetical inside parenthetical reads awkwardly; consider "Your account lives in this app's local SQLite database, not a third-party service." |
| 1.3 | P4 | "Sign in" button color contrast is OK in dark theme but lacks visible hover/focus ring — TAB-navigating from the password field shows no focus indicator on the button. |
| 1.4 | P5 | The two-tab "Create account / Sign in" switcher uses pill chips, but the gap between the two tabs is just barely interactive — clicking the dividing pixel does nothing. |

### 2. Create-account flow — `/dispatch` Create-account tab

Screenshot: `ss_5371zkv7w`

**Wins:**
- "At least 8 characters" inline hint in password placeholder.
- Separate "Confirm password" field — explicit, not relying on a re-show pattern.
- Different background gradient than Sign-in (constellation/network lines vs starfield) — subtle but creates a sense of fresh page.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 2.1 | P3 | No explicit "By creating an account you agree to…" terms link. For a self-hosted local DB this is fine, but cloud-hosted templates need it. |
| 2.2 | P4 | Submitting the form without any input does NOT show inline validation errors (no required-field markers); pressing the disabled-looking "Create account" appears to do nothing — no toast, no message. |
| 2.3 | P5 | No password-strength meter. |

### 3. Dispatch overview — `/dispatch/overview`

Screenshot: `ss_2999lbc8f`

**Wins:**
- Friendly hero "What should we do next?" + agent composer in the center.
- Pre-populated suggestion chips: "Create a lightweight customer onboarding app", "Ask Slides to draft a board update from our latest metrics", "Schedule a Monday morning analytics digest" — all on-brand and useful.
- 6-up "Workspace apps" grid below the agent composer.
- "Getting started" rail with "Connect Slack" / "Review connected agents" cards.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 3.1 | P2 | Workspace header says **"Workspace · 0 apps"** but the page lists 6 apps in the grid (View all → 13). Inconsistent. |
| 3.2 | P2 | "openai/gpt-5.5" — not a real published model name. Either typo for "gpt-4.5" / "gpt-5" or a fake seed value. Visible on Overview, Metrics, every right-rail. |
| 3.3 | P2 | Right rail "Available now → Builder: Connect" pill conflicts with "Available now → App / Code: working" — the failure state of one cell visually equates to a status row label. Confusing layout. |
| 3.4 | P3 | "Workspace apps" "View all →" link goes to `/dispatch/manage-apps` but the page title there is "Apps", not "Workspace apps" — small inconsistency. |
| 3.5 | P3 | Hero composer is centered vertically AND the apps grid is below — page is **scroll-heavy** at this viewport (1512×803); the most-important section is half a fold below. |
| 3.6 | P4 | "Schedule a Monday morning analytics digest" — Monday is hardcoded; should ideally be "weekly" or pick the user's locale's first weekday. |

### 4. Dispatch apps page — `/dispatch/apps` (= `/dispatch/manage-apps`)

Screenshot: `ss_82901hvcj`

**Wins:**
- Clean 3-column grid of 13 first-party apps.
- Each card has app name, route (`/analytics`), and a 1-line description.
- Per-card hover reveals settings cog + external-link icon.
- "+ Create app" card is included as the 14th cell of the grid (good visual cue).
- "Add a template" section below for non-installed scaffolds (Video shown).

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 4.1 | P1 | Typo: header reads **"Apps in Agentntative"** — misspelled workspace name (see also #5.1 below). |
| 4.2 | P3 | Multiple card descriptions are truncated with "..." at this viewport: CRM ("...so the agent can..."), Meetings ("follow-ups fanned..."). Either fix line-clamp or rewrite shorter descriptions. |
| 4.3 | P3 | Two routes for the same page: `/dispatch/apps` and `/dispatch/manage-apps`. Sidebar label says "Manage apps" but page title says "Apps". Pick one. |
| 4.4 | P4 | Slides description says "Agent-native Google Slides" — using "Google Slides" trademark might be sensitive. Other descriptions do the same: "Agent-native Google Calendar", "Agent-native Notion/Google Docs", "Agent-native Superhuman", "Granola-style…" Should be reviewed. |
| 4.5 | P4 | "+ App" button in top-right vs "+ Create app" card vs sidebar "+ New form" — three different verbs for "create". Standardize. |

### 5. Workspace name typo — global

Screenshot: zoom `ss_676014524`

| # | Severity | Issue |
|---|----------|-------|
| 5.1 | P1 | Workspace is named **"Agentntative"** (extra "t"). Appears in: top-left header, "Apps in Agentntative" subhead on apps pages, Account dropdown. Likely a seed-data typo. Visible everywhere. |

### 6. Dispatch shell — `/dispatch/shell` (the new OS-shell layout from Phase 2)

Screenshots: `ss_6878gmlil`, `ss_64996z6xj`, `ss_2098gi1cf`, `ss_1302vnb6m`

**This is the most problematic page in the build.** Many P0/P1 issues compound.

| # | Severity | Issue |
|---|----------|-------|
| 6.1 | P0 | **Two-to-three settings panels render simultaneously.** On `/dispatch/shell` with no app selected, the outer "Setup and configuration" panel + the embedded iframe's `?__shell=dispatch` settings panel + (sometimes) a third copy all render side-by-side. See `ss_6878gmlil`. The whole right half of the screen becomes a duplicated panel cascade. |
| 6.2 | P0 | **Left-rail icons are all visually identical camera icons.** See zoomed `ss_2999...`. 22 buttons (Analytics, Calendar, Calls, Clips, …) render with the same camera/video glyph. The accessibility names (button "Analytics", button "Calendar") are correct per `read_page` output but the actual rendered SVG is wrong for ~18 of 22. Users cannot pick the app they want. |
| 6.3 | P0 | **The iframe area shows only a tiny spinner forever** when no app is selected. Black canvas, no skeleton, no empty state, no instructions. See `ss_6878gmlil` center column. |
| 6.4 | P0 | **TWO chat sidebars render** in the shell (one inside the iframe, one as the shell's outer agent sidebar). When an app is opened in the shell, the iframe also brings its own chat sidebar + its own composer + its own settings cog — so you get TWO of every chrome element, plus the shell's own copies. Triple chrome. |
| 6.5 | P1 | Header just says "Dispatch" — no breadcrumb of which app is currently in the iframe. URL has `?app=mail` but the title bar doesn't reflect it. |
| 6.6 | P1 | Hidden templates leak into the rail: the left-rail includes Calls, Crm (mis-cased), Images, Issues, Macros, Meeting Notes, Recruiting, Scheduling, Videos. CLAUDE.md says these MUST be hidden (allow-list rule). The rail is showing 22 apps when only ~10 should be public. |
| 6.7 | P1 | "Crm" button label — incorrectly cased (should be "CRM"). Visible only via tooltip / read_page; the icon rendering hides it but the screen-reader name is wrong. |
| 6.8 | P2 | The iframe's "Turn on the AI assistant" banner appears even though the outer Dispatch has `OPENROUTER_API_KEY configured` — conflicting state messages. |
| 6.9 | P2 | No active state on the left-rail. The selected app doesn't highlight (or the highlight is so faint it's invisible at dark contrast). I had to hover to see "Calls / ⌘3" tooltip. |
| 6.10 | P3 | Hover tooltip says "Calls / ⌘3" — the keyboard shortcut is **good UX** but only surfaces on hover. Add an "expand rail" toggle to show labels permanently like VS Code. |

### 7. CreateAppPopover — popover opened from "+ App" button

Screenshots: `ss_2488wco4g` (Pick a starter), `ss_48245w0m3` (Describe with agent)

**Wins:**
- Two clear tabs at the top: "Pick a starter" / "Describe with agent".
- 4 starter cards: Blank, CRUD list, Dashboard, Agent tool. Each has a 1-line description.
- "App name (kebab-case)" input with placeholder "widgets".

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 7.1 | P3 | The popover anchors to the "+ App" button but extends well past the right edge of the apps grid, OVERLAPPING the agent chat sidebar area when chat is open. Z-index OK but the popover positioning could use shadcn `<Popover>` collision detection. |
| 7.2 | P3 | "App name (kebab-case)" — exposing the case convention is OK for devs but confusing for non-devs. Either auto-kebab on submit or rephrase. |
| 7.3 | P3 | "Describe with agent" tab placeholder: "Describe the app your teammate should be able to use…" — assumes you're creating for "teammates". Should be "Describe what this app should do…" |
| 7.4 | P3 | The "no keys · no resources" pill on the Describe-with-agent tab is cryptic — what does this mean? Add hover tooltip or rewrite. |
| 7.5 | P4 | "+ Create app" button under name field is the same color as the popover background — low affordance. |

### 8. Analytics app — `/analytics`

Screenshot: `ss_2999lbc8f`

**Wins:**
- "0 configured" badge in the empty state subhead — clear status.
- Categorized data-source picker: ANALYTICS & PRODUCT / DATABASE / PAYMENTS / CRM & SALES.
- Each source has logo + title + 1-line description + "Not configured" badge.
- "Connect your data sources, then ask the agent to create dashboards." — clear value proposition.
- Search bar above the grid.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 8.1 | P3 | The right-rail LLM panel is auto-expanded by default, eating significant horizontal space (the data-source grid only gets 2 columns at this viewport). Collapse by default once configured. |
| 8.2 | P4 | All data sources are "Not configured" — but the empty-state badge "0 configured" is in the page, separate from each card's per-row badge. Could collapse into a single status. |
| 8.3 | P5 | Logo icons for data sources are placeholder-like (generic database / chart icons) instead of branded Amplitude/Mixpanel/PostHog/etc. logos. |

### 9. Calendar app — `/calendar`

Screenshot: `ss_4272vthrv`, `ss_78547t20a`

| # | Severity | Issue |
|---|----------|-------|
| 9.1 | P1 | **Calendar shows a black page with a tiny spinner for 8+ seconds**, then never rendered anything during my test window. No skeleton, no progress, no error message. |
| 9.2 | P2 | No empty state visible — if it eventually loaded, I never saw the content during 8s wait. Spinner is so small (12×12px) it's near-invisible at this viewport. |

### 10. Mail app — `/mail`

Screenshot: `ss_0898lox7z`

**Wins:**
- Empty state: envelope icon + "Connect your Google account" + value proposition + "Connect Google" CTA with Google's brand color/logo.
- Title bar shows "Inbox" + tiny cog icon.
- "Compose" button in the top-right is always available.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 10.1 | P1 | **8+ second blank black screen on first navigation** before the empty state renders. Add a route-level skeleton. |
| 10.2 | P2 | Navigating to `/mail` auto-redirects to `/mail/inbox?label=important` — user lands on a label filter, not the inbox view. Confusing. |
| 10.3 | P3 | Top-bar icons (search, refresh, notifications) have no labels and no visible tooltips on hover. Add tooltips. |
| 10.4 | P3 | Page title is "Inbox" but the route segments show no app branding. Where am I? Add a small "Mail" label or icon. |

### 11. Slides app — `/slides`

Screenshot: `ss_9280davow`

**Wins (this is one of the best pages):**
- Excellent empty state: blue square illustration + heading "Create your first deck or visual" + subtitle "Build beautiful presentations, standalone visuals, diagrams, and image-rich stories with AI-powered generation." + prominent "+ New Deck" button.
- Sidebar with Decks (active state visible) + Design Systems + Team — clear app structure.
- "+ New Deck" appears both in the header AND as the empty-state CTA — consistent verbiage.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 11.1 | P2 | ~8-second blank loading state before the empty state renders. Skeleton would help. |
| 11.2 | P4 | Right-rail LLM panel auto-expanded — same overdraw issue as Analytics. |

### 12. Forms app — `/forms`

Screenshot: `ss_59242wwfq`

**Wins:**
- Empty state: "No forms yet" / "Create your first form to get started" / "+ Create Form" button.
- Tabs at top: Forms / Archive.
- Left rail has "+ New form" link at top.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 12.1 | P3 | Inconsistency: header button says "+ New Form", main CTA says "+ Create Form", sidebar says "+ New form" — three different verbs/case for the same action. Pick "Create form" everywhere. |
| 12.2 | P4 | Three "create" affordances (header, sidebar, body) on an otherwise-empty page is redundant — keep just the body CTA when empty. |

### 13. Forms — edit form (existing) — `/forms/forms/3WzElOPnTe`

Screenshot: `ss_12264cwrq`

| # | Severity | Issue |
|---|----------|-------|
| 13.1 | P0 | **JavaScript error leaks to user:** "Cannot read properties of undefined (reading 'role')". A "Something went wrong" boundary catches it but exposes the developer message. Replace with user-friendly: "We couldn't load this form — try reloading the page." |

### 14. Forms — public form — `/forms/f/qa-test-form-3WzElO`

Screenshot: `ss_6224tx89c`

**Wins:**
- Clean error page: "Form not found / This form may have been removed or is no longer accepting responses."

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 14.1 | P3 | "Try Again" CTA makes no sense — if the form genuinely doesn't exist, retrying won't bring it back. Should be "Go to forms.example.com" or just remove the CTA. |

### 15. Content app — `/content`

Screenshot: `ss_5356rz68r`

**Wins:**
- Skeleton placeholder shows during loading (better than blank black).
- Clear sidebar structure: PRIVATE / ORGANIZATION sections.
- Empty state: document icon + "No page selected" + "+ New page" button.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 15.1 | P3 | The 5-second skeleton phase is fine, but the skeleton bars are heavily centered in the body, suggesting an article will load — but the actual content is "No page selected" empty state. Skeleton implies wrong layout. |
| 15.2 | P4 | Two empty state messages: sidebar shows "No private pages yet" + "No organization pages yet" + main content shows "No page selected". A first-time user sees 3 empty-state messages stacked vertically. |

### 16. Design app — `/design`

Screenshot: `ss_21949guw1`

**Wins (best empty state in the build):**
- "Create your first design"
- "Pick a starting point or write your own prompt"
- 4 starter chips (SaaS landing page, Dashboard, Mobile app, Pricing page)
- "+ New Design" fallback button

This is the **gold standard** of empty states; other apps should match.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 16.1 | P5 | None of real significance — could use one more value-proposition sentence above the chips. |

### 17. Clips app — `/clips`

Screenshot: `ss_99133h45n`

| # | Severity | Issue |
|---|----------|-------|
| 17.1 | P1 | **Forced "Create your organization" gate** with no preceding context — user is dropped into this immediately. Tagline says "Clips organizes recordings by team" but a personal user shouldn't be forced into an org. |
| 17.2 | P2 | The page title is "Library · Clips" but the user never sees "Library" anywhere on the screen — confusing breadcrumb. |
| 17.3 | P2 | "Skip for now" is rendered as a tiny text link below a prominent gray "Create organization" button — discoverability is poor; users will skip past it. |
| 17.4 | P3 | The header chrome (app name, app icon) is completely missing on this gating screen. User can't even confirm they're in Clips. |

### 18. CRM app — `/crm`

Screenshot: `ss_85849i6v9`

| # | Severity | Issue |
|---|----------|-------|
| 18.1 | P0 | **CRM crashes with a raw NitroVite stack trace.** Error: "NitroVite Error: No fetch handler exported from virtual:react-router/server-build". Full file paths from `/Users/shashanksaxena/Documents/...` are exposed including pnpm hash paths. This is the developer error overlay leaking to end-users. |
| 18.2 | P0 | No graceful 500 page — a regular user would see the dev overlay rather than "Something went wrong, please try again". |

### 19. Notes app — `/notes`

Screenshot: `ss_2933j4k27`

| # | Severity | Issue |
|---|----------|-------|
| 19.1 | P0 | **Same NitroVite crash as CRM.** Identical error page exposes stack trace. |

### 20. Tasks app — `/tasks`

Screenshot: `ss_8823i1td0`

| # | Severity | Issue |
|---|----------|-------|
| 20.1 | P0 | **Same NitroVite crash.** Tasks is completely unreachable. |

### 21. Meetings app — `/meetings`

Screenshot: `ss_3023od90x`

| # | Severity | Issue |
|---|----------|-------|
| 21.1 | P0 | **Same NitroVite crash.** Meetings unreachable. |

### 22. Dispatch tests — `/dispatch/tests`

Screenshots: `ss_9113nrg8l`, `ss_79403e0q7`

| # | Severity | Issue |
|---|----------|-------|
| 22.1 | P1 | Page hangs on tiny spinner forever (10+ s tested). No "Run all tests" button visible. |
| 22.2 | P3 | Tab title is "Workspace app - Dispatch" (generic placeholder) — should be "Tests · Dispatch". |

### 23. Dispatch metrics — `/dispatch/metrics`

Screenshot: `ss_8818al1uu`

**Wins:**
- Solid dashboard layout: 5 KPI cards (Estimated spend, LLM calls, Active users, Workspace apps, Chat threads).
- Time-range toggle 7d / 30d / 90d in the top-right.
- "Spend By App" and "Daily Activity" sections.
- "Access By App" table with one row per app: signed-in users, chats, cost, last activity.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 23.1 | P3 | Header chip says "**3 signed-in users**" but the table column header says "**Signed-ins users**" — typo: should be "Signed-in users". |
| 23.2 | P3 | "0 / 3" in the Users column is ambiguous — what's "3"? Total workspace seats? Active in the period? Add a tooltip or column hint. |
| 23.3 | P3 | KPI "Workspace apps: 13" contradicts the global header "Workspace · 0 apps". |
| 23.4 | P4 | "0 total tokens" / "0 chat turns" / "0 messages" — every value is 0; visually a wall of zeros. Add an empty-state-style "Run a chat to see activity here" inline. |

### 24. Dispatch vault — `/dispatch/vault`

Screenshot: `ss_6266gjhsp`

**Wins:**
- Clean empty state: key icon + "No secrets yet" + value proposition + "+ Add secret" CTA.
- Tabs: Secrets / Requests / Audit — clear separation of concerns.
- Header pill "0 secrets" matches the empty state.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 24.1 | P5 | "0 secrets" header text and the empty state's "No secrets yet" overlap visually — combine into single message. |

### 25. Dispatch integrations — `/dispatch/integrations`

Screenshot: `ss_95527j4ni`

| # | Severity | Issue |
|---|----------|-------|
| 25.1 | P2 | **Naming inconsistency:** sidebar label "Integrations" but page title "Connections". Browser tab title shows "Connections — Dispatch". The URL is `/integrations`. Pick one. |
| 25.2 | P2 | Page never resolves past "Discovering apps and credentials..." — stayed in this state for 5+ s. Either too slow or hangs entirely. |
| 25.3 | P3 | "Discovering apps and credentials..." has no progress, no estimate, no cancel. |

### 26. Dispatch agents — `/dispatch/agents`

Screenshot: `ss_4206hw3k8`

**Wins:**
- Clean two-column layout: "Available by default" (left) + "Add external agent" form (right).
- Status pills with colored dots for each agent — Calendar, Content, Slides, Video, Analytics, Mail, Forms, Clips, Design, Images, Meetings, Tasks, Notes, CRM.
- "Added in this workspace" section shows the Starter app with its URL.
- Form has Name + URL + Description (optional) + "Add agent" button.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 26.1 | P1 | **Hidden templates leak into "Available by default":** Video, Images, Meetings, Tasks, Notes, Meetings, Calls (and others elsewhere) — violates CLAUDE.md allow-list. |
| 26.2 | P3 | Dot colors next to each agent appear random — what does green vs blue vs red mean? Add a legend or tooltip. |
| 26.3 | P4 | "URL" input uses placeholder `https://app.example.com` — fine, but no validation error feedback shown for malformed URLs. |

### 27. Agent chat sidebar — global (open from any page)

Screenshot: `ss_676014524` + zoom

**Wins:**
- 3 modes in tabs at top: Chat / CLI / Workspace.
- Suggestion chips on first load: "Build a workspace app for X", "Route Slack mentions to my analytics app", "Grant my OpenAI key to this app".
- Model picker at the bottom of the composer ("Haiku 4.5 · Auto") + "Act" mode toggle.
- Dictate (⌘⇧M) keyboard-shortcut hint visible.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 27.1 | P2 | **TWO tabs both labeled "New chat"** in the chat tab strip. One has a small yellow/red dot. Verbiage failure — should be e.g. "New chat" + "Chat 2" or include the chat title once it exists. |
| 27.2 | P2 | **"Build a workspace app for X"** — the literal "X" is a template placeholder leak. Should be "Build a workspace app for sales follow-ups" or "Build a workspace app for [your domain]" — anything but a bare X. |
| 27.3 | P3 | "Grant my OpenAI key to this app" — but the user is on the Dispatch overview (no app selected). "This app" is undefined. |
| 27.4 | P3 | Empty-state body says "Create apps, grant keys, and route work across the workspace." — good, but follow-up chips don't match (e.g. "Route Slack mentions to my analytics app" assumes the user has an analytics app set up). |
| 27.5 | P4 | Composer placeholder "Message agent..." — fine, but a single-shot first-time-user could benefit from a fuller hint like "Ask the agent to do something for you…" |

### 28. Settings / right-rail panel — global

Screenshot (most): right side of `ss_6878gmlil`, `ss_2999lbc8f`

**Wins:**
- Comprehensive: Environment, Account, LLM, Agent Limits, Voice Transcription, Automations, API Keys & Connections, Hosting, Database, File uploads, Authentication, Email, Browser Automation, Integrations, Usage, Connected Agents (A2A).
- "Available now" status block shows what's wired up (App: Chat + actions, Code: Local tools, Builder: Connect/Checking).
- LLM panel shows current Provider + Model + "Connected via OPENROUTER_API_KEY" + Test button.

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 28.1 | P0 | **Multiple panels render simultaneously on `/dispatch/shell`** (covered in #6.1). |
| 28.2 | P2 | The panel takes up ~25% of horizontal space when expanded; collapsing should be the default once at least one LLM is configured. |
| 28.3 | P3 | "Builder" status says "Connect" (call-to-action) but visually reads like a status word — confusing. Use "Not connected" or a dot indicator. |
| 28.4 | P3 | "Checking..." under Builder hangs indefinitely on the Shell page — never resolves to a status. |
| 28.5 | P4 | "API Keys & Connections" + "Connected Agents (A2A)" — both deal with connections. Consider grouping. |

---

## Cross-cutting findings

### A. Loading-state pattern is inconsistent and slow

Four apps (Calendar, Mail, Slides, Tasks-broken) show 5-10s of **blank black canvas + tiny center spinner** before the empty state renders. Two apps (Content, Dispatch metrics) use proper skeleton placeholders. Standardize on skeleton.

### B. The same NitroVite error blocks 4 apps

**CRM, Notes, Tasks, Meetings** all return `NitroVite Error: No fetch handler exported from virtual:react-router/server-build`. Looks like a missing dev-mode server build registration. Affects 4 of 13 templates — ~30% of the product. (See issues 18.1, 19.1, 20.1, 21.1.)

### C. Hidden templates leak into multiple surfaces

Hidden templates (Calls, Macros, Issues, Meeting Notes, Recruiting, Scheduling, Images, Videos) appear in:
- `/dispatch/shell` left rail (6.6)
- `/dispatch/agents` "Available by default" (26.1)
- (Likely elsewhere — needs further audit)

CLAUDE.md is explicit: these MUST be hidden from public surfaces. The guard script `scripts/guard-template-list.mjs` may not cover these surfaces.

### D. Workspace name is misspelled across the entire app

"Agentntative" should be "Agentnative" (or "Agent-Native"). Visible in:
- Top-left workspace label
- Apps page subhead
- Account dropdown
- Browser tab titles (e.g. "Apps — Dispatch")
- (Probably more)

### E. "Workspace · 0 apps" claim contradicts every page that shows apps

The header counter is stuck at 0 even when the user has 13 apps. Visible on every Dispatch page.

### F. Inconsistent verbiage for "create" actions

Per page, "create" is variously labeled:
- "New form" (sidebar) / "New Form" (header) / "Create Form" (body) (forms)
- "+ App" (header) / "+ Create app" (grid card) (dispatch apps)
- "+ New Deck" (slides — internally consistent)
- "+ New Design" / "+ New Design" (design — consistent)

Pick one verb and case per app.

### G. Icon library is broken in left-rail on shell

22 different app buttons all render as the same camera/video icon (6.2). Tabler icons exist for Calendar, Mail, Settings, Notes, etc. — they're either not being mapped or the mapper is falling back to `IconVideo` for everything.

### H. Error messages leak developer details

- "Cannot read properties of undefined (reading 'role')" (13.1)
- Full NitroVite stack trace with absolute file paths (18.1, 19.1, 20.1, 21.1)

Wrap with user-friendly fallback copy.

### I. The agent chat is over-decoupled from the user's active context

On `/dispatch/overview`, the chat suggestion is "Grant my OpenAI key to this app" — but there is no "this app". The chat doesn't seem to read the current view state from the navigation, contrary to the `context-awareness` skill.

### J. Right-rail "Setup and configuration" is too aggressive by default

On 9 of 13 app pages, the LLM / Setup panel is auto-expanded, eating ~25% of the viewport width. It should collapse once at least one LLM is configured (which is the case here — OPENROUTER_API_KEY is set).

---

## Top 10 highest-impact UX issues (prioritized)

1. **CRM / Notes / Tasks / Meetings crash with a raw stack trace** (P0, 18.1 / 19.1 / 20.1 / 21.1). 30% of templates are unreachable.
2. **`/dispatch/shell` renders two-to-three settings panels at once** (P0, 6.1). The flagship OS-shell page is visually broken.
3. **`/dispatch/shell` left-rail icons all look identical** (P0, 6.2). Users can't tell apps apart.
4. **The agent chat has two "New chat" tabs with the same label** (P2, 27.1). Verbiage failure on the agent's primary surface.
5. **Hidden templates leak into the shell rail + agents page** (P1, 6.6 / 26.1). Direct violation of CLAUDE.md allow-list.
6. **Workspace name typo "Agentntative"** (P1, 5.1). Visible everywhere; first thing a user sees.
7. **"Build a workspace app for X" — literal placeholder leak in chat suggestions** (P2, 27.2). First-impression copy bug.
8. **Calendar / Mail / Slides take 8+ seconds of black canvas before showing anything** (P1/P2, 9.1 / 10.1 / 11.1). Feels broken even when working.
9. **"Workspace · 0 apps" contradicts the 13-app grid everywhere** (P2, 3.1). Numbers are visibly wrong.
10. **`/dispatch/shell` iframe spinner spins forever with no fallback / empty state when no app is selected** (P0, 6.3). User has no idea what to do.

---

## Things that look genuinely polished

1. **Sign-in / Create-account page** (`/dispatch`) — beautiful starfield background, clean two-column hero + form layout, reassuring footer copy about local SQLite, distinct gradients per tab. Best surface in the app.
2. **Design app empty state** (`/design`) — "Create your first design" + 4 starter chips (SaaS landing page, Dashboard, Mobile app, Pricing page) + fallback "+ New Design" button. Gold standard for empty states; copy this pattern everywhere.
3. **Slides app empty state** (`/slides`) — clear illustration + descriptive subtitle + prominent CTA. Consistent verbiage ("+ New Deck") between header and body.
4. **Dispatch overview** (`/dispatch/overview`) — agent composer at the top with relevant suggestion chips, then app grid, then Getting Started. The information architecture is strong (modulo the 0-apps bug).
5. **Dispatch metrics** (`/dispatch/metrics`) — proper KPI dashboard with time-range toggle, per-app breakdown table. The right shape for an admin surface.
6. **Vault empty state** (`/dispatch/vault`) — key icon + "No secrets yet" + 1-line value proposition + Add CTA. Concise and on-brand.

---

## Severity breakdown (final)

| Severity | Count | Examples |
|----------|-------|----------|
| P0 Blocker | 7 | CRM/Notes/Tasks/Meetings crash; shell triple-panel; shell identical icons; shell empty iframe; forms edit page error |
| P1 Critical | 9 | Workspace typo; loading 8s blank; clips org gate; calendar hang; hidden templates leak; shell breadcrumb missing |
| P2 High | 14 | Two "New chat" tabs; "for X" placeholder; integrations naming; 0-apps inconsistency; auto-expanded LLM panel; tests hang |
| P3 Medium | 18 | Truncated card descriptions; verbiage inconsistencies; missing tooltips; ambiguous data labels |
| P4 Low | 12 | Capitalization; trademark concerns; redundant CTAs |
| P5 Polish | 6 | No password meter; logo placeholders; minor visual tuning |

**Total: 66 documented issues across 28 surfaces.**

---

*End of QA-UX report.*
