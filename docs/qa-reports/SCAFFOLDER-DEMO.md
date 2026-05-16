# Phase 6 Scaffolder — Browser QA Demo

**Date:** 2026-05-16
**Branch:** `os-shell`
**Workspace gateway:** `http://127.0.0.1:8080` (pnpm dev:lazy)
**Tester:** Claude (QA-Demo agent)
**Verdict:** **FAIL — Blocked at server-side runtime guard.** UI works end-to-end through the picker, but the `scaffold-from-template` action returns HTTP 500 in the local fluid-system dev environment because the gateway's `process.cwd()` is the agent-native monorepo, not an end-user workspace.

---

## Step-by-step result

### Step 1 — Open `/dispatch`
- Navigated to `http://127.0.0.1:8080/dispatch`.
- Session was already authenticated as the seeded user; no login form shown.
- Dispatch shell rendered with the left rail (Overview / Manage apps / Metrics / Vault / Integrations / Agents) and the app icon column.
- **Result: PASS.** Shell loads.

### Step 2 — Find the "Create app" button
- Left rail "Manage apps" link navigates to `/dispatch/apps`.
- Apps page renders a grid of installed templates plus two "Create app" entry points:
  - A small `+ App` button in the page header.
  - A larger `+ Create app` card inside the grid.
- The `CreateAppPopover` component is wired on `dispatch/src/routes/pages/apps.tsx` (used twice — both `+ App` and `+ Create app` triggers).
- **Result: PASS.** Entry points are present.

### Step 3 — Pick `crud-list`, name `widgets`, click Create
- Clicked the `+ Create app` card → popover opens with **two tabs**:
  - **Pick a starter** (active) — 4 cards: **Blank, CRUD list, Dashboard, Agent tool**.
  - **Describe with agent** — alternate flow.
- Clicked **CRUD list** card → highlighted with primary border (active state).
- Description copy renders correctly: "The most common pattern: a list of things the user creates, opens, edits, and deletes."
- App name input: typed `widgets`. Placeholder was `widgets` but input was empty until typed.
- `Create app` button enabled.
- **Result: PASS.** Picker UI works end-to-end and matches the Phase 6 design.

### Step 4 — Wait for scaffold
- Clicked `Create app`.
- After ~1s, the popover displays a red error banner: **"No agent-native workspace detected for scaffolding."**
- Popover does NOT close. Form state preserved.
- **Result: FAIL.** Scaffold action errored on the server.

### Step 5 — Verify new app appears in left rail
- N/A — scaffold failed.
- `templates/widgets/` does NOT exist on disk (verified with `ls`).
- **Result: BLOCKED.**

### Step 6 — Click widgets icon → iframe loads `/widgets`
- N/A — no widgets app created.
- **Result: BLOCKED.**

### Step 7 — Create an item & verify persistence
- N/A — no widgets app exists.
- **Result: BLOCKED.**

### Step 8 — Registry endpoint check
- `GET /dispatch/_agent-native/registry/apps` (via browser session cookie) returns the list of installed apps.
- `widgets` is NOT present in the list.
- `widgets.list-items` (or any `widgets.*`) is NOT present in `/registry/capabilities`.
- `GET /dispatch/_agent-native/actions/list-starter-templates` works (HTTP 200) and returns all 4 starter templates correctly.
- **Result: PASS for `list-starter-templates`; FAIL for `widgets` registration** (because the app was never scaffolded).

---

## Final state

- **Did the new template appear in the rail?** No.
- **Did it serve its UI?** No.
- **Pass / Fail / Partial verdict:** **FAIL** — scaffold step never executes.

---

## Bugs found

### BUG-1 (BLOCKER): Scaffolder bails in the fluid-system dev environment because there is no workspace marker in the gateway's cwd

**File:** `packages/dispatch/src/server/lib/app-creation-store.ts`

**Behaviour observed:**
- `POST /dispatch/_agent-native/actions/scaffold-from-template` with body `{template:"crud-list", name:"widgets"}` returns:
  - HTTP **500**
  - Body: `{"error":"No agent-native workspace detected for scaffolding."}`

**Root cause:**
`scaffoldWorkspaceAppFromTemplate()` (line 885) calls `findWorkspaceRoot()` (line 118) which walks up from `process.cwd()` looking for a `package.json` whose `agent-native.workspaceCore` field is a string. That field exists ONLY in `packages/core/src/templates/workspace-root/package.json` — i.e., the bootstrap template for newly-created end-user workspaces. The fluid-system repo's root `package.json` does not carry this marker (verified with grep), and neither does any `templates/*/package.json`. So when the dev:lazy gateway runs from `/Users/shashanksaxena/Documents/Personal/Code/fluid-system`, `findWorkspaceRoot()` returns `null` and the action throws at line 907.

**Why this matters:**
The user-facing acceptance test for Phase 6 ("create a new mini-app on demand in dispatch") cannot succeed in the developer's local environment. The action is only callable from inside an `agent-native create`-bootstrapped workspace — never from the agent-native monorepo itself, even though that's where the gateway runs during development.

**Suggested fixes (don't apply in this agent — flagging only):**
- **Option A:** Have `dev:lazy` set an env var like `AGENT_NATIVE_WORKSPACE_ROOT` so `findWorkspaceRoot` can use it as an explicit override and fall back to the marker-walk only when unset.
- **Option B:** Treat the fluid-system monorepo as its own workspace root for dev — detect the `templates/` and `packages/core/src/cli/starter-templates/` layout directly, and target `templates/<name>/` instead of `apps/<name>/`. The current code writes to `apps/<appId>/` which the gateway is not configured to mount in dev:lazy either.
- **Option C:** Add a small dev-only flag to the gateway's startup that injects a stub `agent-native.workspaceCore` key into the in-memory package.json view.

**Verification cmd:**
```
curl -X POST -b <session> -H 'content-type: application/json' \
  http://127.0.0.1:8080/dispatch/_agent-native/actions/scaffold-from-template \
  -d '{"template":"crud-list","name":"widgets"}'
# → 500 {"error":"No agent-native workspace detected for scaffolding."}
```

This matches the earlier observation #28627 ("Workspace scaffolding fails when findWorkspaceRoot returns null").

### BUG-2 (minor): Popover error message states the symptom, not the recovery

When `findWorkspaceRoot()` returns null in local dev, the popover shows the raw server error string. For a new developer running `pnpm dev:lazy` and trying this feature for the first time, "No agent-native workspace detected for scaffolding" is opaque — they don't know that the feature is intentionally local-workspace-only or what to do next. Suggest replacing with: "Scaffold-from-template only works inside an `agent-native create`-generated workspace. Run `agent-native create my-app` and try again from that workspace's `/dispatch`."

### BUG-3 (minor): Placeholder vs value confusion

The `App name (kebab-case)` field initially shows "widgets" as a placeholder, but the input is empty (the Create app button is disabled until you actually type into it). Suggest dropping the placeholder once the user has selected a starter — or auto-populating the input with the starter's default slug so single-click "use defaults" works.

---

## Evidence

Screenshots returned inline by the browser tool during this run (not persisted to disk because the chrome MCP harness in this session did not write `save_to_disk` files to a discoverable path):

- **Step 1:** Dispatch shell — left rail, app icons rendered. Tab title: "Dispatch — Workspace".
- **Step 2:** `/dispatch/apps` apps grid with the `+ Create app` card and the `+ App` button.
- **Step 3:** Popover open. CRUD list highlighted. `widgets` typed in the name field. `Create app` button active.
- **Step 4:** Popover after clicking Create app — red error banner `"No agent-native workspace detected for scaffolding."` directly below the Create app button. Popover did not close.

API evidence (captured via `fetch` inside the page context):

```
GET  /dispatch/_agent-native/actions/list-starter-templates     → 200, returns all 4 starter templates
POST /dispatch/_agent-native/actions/scaffold-from-template     → 500, {"error":"No agent-native workspace detected for scaffolding."}
GET  /dispatch/_agent-native/registry/apps                       → 200, widgets NOT in apps[]
```

Filesystem evidence:

```
$ ls templates/widgets/
ls: templates/widgets/: No such file or directory
```

---

## Constraints honored

- Dev server left running.
- No source code changes.
- No branch switching, stash, or destructive git ops.
- No `templates/widgets/` artifacts left behind (it was never created).
- Tab `654414992` left open at `/dispatch/apps` with the error visible for the next agent or the user.
