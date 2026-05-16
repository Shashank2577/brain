# QA-API-A — Capability Registry Exhaustive HTTP Coverage

**Agent:** QA-API-A
**Branch:** `os-shell`
**Date:** 2026-05-16
**Time window:** ~06:00 - 06:35 IST
**Scope:** Capability registry exhaustive HTTP coverage at `/_agent-native/registry/{apps,capabilities,rpc}`

---

## Executive summary

**Result: BLOCKER. Dispatch is hard-down at boot.** Every request to dispatch (port 8092, and via the workspace gateway at 127.0.0.1:8080 under `/dispatch`) returns HTTP 500 with `TypeError: plugin is not a function`. The registry endpoints (`/apps`, `/capabilities`, `/rpc`) cannot be exercised — they all return 500 before any handler is reached. **0 of 343 statically-declared capabilities can be tested over HTTP in this branch state.**

Root cause is mechanical and identifiable from the dist/source comparison: the most recent commit (`c2526661 [P7]`) added `dispatchTestsRunnerPlugin` to source files in `packages/dispatch/src/server/`, but `packages/dispatch/dist/server/` was not rebuilt. The `templates/dispatch/server/plugins/tests-runner.ts` re-export resolves to `undefined`, and Nitro then calls `undefined(app)` during `initNitroPlugins`. Same problem exists for `dispatchMobileAuthPlugin` (P8) and the mobile-token helpers.

**This blocks 100% of the QA-API-A scope.** Edge cases, identity propagation, mobile bearer tests, valid/invalid input matrix — all gated on dispatch responding 200 to the registry endpoints.

---

## Test environment

| Item | Value |
| --- | --- |
| Workspace gateway | `http://127.0.0.1:8080` (dev-lazy script, PID 52027) |
| Dispatch dev server | `http://127.0.0.1:8092` (vite dev, PID 52913, age ~7m at first probe) |
| Branch | `os-shell` |
| HEAD | `c2526661` ("[P7] unit + integration + e2e test scaffold; fix 16 happy-dom failures") — landed ~7 minutes before QA window opened |
| Cookie jar | `/tmp/qa-api-a-jar.txt` |
| Test user | `alice@demo.local` / `demo1234` (login succeeded via calendar template — see auth section) |
| User agent | `curl/8.x` |

### Authentication probes

**Login succeeded against a non-dispatch template** (`/calendar/_agent-native/auth/login`):

```
$ curl -sS -X POST http://127.0.0.1:8080/calendar/_agent-native/auth/login \
    -H 'content-type: application/json' \
    -d '{"email":"alice@demo.local","password":"demo1234"}' \
    -c /tmp/qa-api-a-jar.txt
{"ok":true}

$ cat /tmp/qa-api-a-jar.txt
#HttpOnly_127.0.0.1  FALSE  /  FALSE  1781483427  an_session_workspace  xwwhvjKiqGwup0hi7x7dhH6PuLwErIhF
```

Session is valid (`/calendar/_agent-native/auth/session` returns the user). The cookie SHOULD propagate to `/dispatch/...` per the workspace-cookie design — but dispatch itself never reaches a handler.

**Mobile-token endpoint also failing** (P8 dispatch route): `POST /_agent-native/auth/mobile-token` returns HTML 500 with the same `plugin is not a function` error — same root cause as the registry crash.

---

## Inventory (static, from source — registry HTTP listing is unreachable)

The `/_agent-native/registry/apps` and `/_agent-native/registry/capabilities` endpoints return 500. The inventory below was derived statically by scanning `templates/<app>/actions/*.ts` for files that contain `defineAction` (the only files the registry registers — `SKIP_ACTION_FILES` + `_*.ts` are skipped in `packages/dispatch/src/server/plugins/capability-registry.ts:145`).

| Mini-app | Declared capabilities (defineAction count) |
| --- | --- |
| analytics | 55 |
| calendar | 28 |
| clips | 82 |
| content | 19 |
| crm | 13 |
| design | 30 |
| dispatch | 2 |
| forms | 11 |
| mail | 37 |
| meetings | 11 |
| notes | 6 |
| slides | 41 |
| tasks | 8 |
| **Total** | **343** |

Reproduce the inventory with:

```bash
for tpl in analytics calendar clips content crm design dispatch forms mail meetings notes slides tasks; do
  dir=templates/$tpl/actions
  if [ -d "$dir" ]; then
    grep -l "defineAction" "$dir"/*.ts 2>/dev/null | xargs -I{} basename {} .ts \
      | grep -v '^_' | grep -vE '^(helpers|run|db-connect|db-status|db-health|registry)$' | wc -l
  fi
done
```

Sample capabilities per template (alphabetical, first 5 each — full list dumps would balloon this report and the test matrix is moot until dispatch boots):

- **analytics**: `amplitude-events`, `apollo-search`, `archive-dashboard`, `bigquery`, `bigquery-table-info`
- **calendar**: `add-external-calendar`, `check-availability`, `create-booking-link`, `create-event`, `delete-event`
- **clips**: `accept-invite`, `add-comment`, `add-recording-to-space`, `add-space-member`, `add-vocabulary-term`
- **content**: `add-comment`, `connect-notion-status`, `create-document`, `delete-document`, `edit-document`
- **crm**: `create-contact`, `create-deal`, `delete-contact`, `get-contact`, `list-activities`
- **design**: `analyze-brand-assets`, `create-design`, `create-design-system`, `create-file`, `delete-design`
- **dispatch**: `list-dispatch-usage-metrics`, `view-screen`
- **forms**: `create-form`, `delete-form`, `export-responses`, `get-form`, `list-forms`
- **mail**: `archive-email`, `bootstrap-watches`, `bulk-archive`, `cancel-scheduled-email`, `export-emails`
- **meetings**: `create`, `finalize`, `get`, `list`, `list-action-items`
- **notes**: `create-note`, `delete-note`, `get-note`, `list-notes`, `search-notes`
- **slides**: `add-slide`, `add-slide-comment`, `analyze-brand-assets`, `apply-design-system`, `check-image-gen`
- **tasks**: `complete`, `create`, `delete`, `list`, `navigate`

(Full per-template listings retrievable via the inventory snippet above, but I omit them here because the HTTP test matrix can't be exercised — they'd just be noise.)

---

## HTTP probe matrix — all 500s

Every probe below returned **HTTP 500** with `TypeError: plugin is not a function`. The handler chain never executes because Nitro fails in `initNitroPlugins` during request handling (vite dev re-evaluates plugins per request, see stack trace below).

| # | Probe | Endpoint | Method | Auth | Result |
| --- | --- | --- | --- | --- | --- |
| 1 | List apps | `http://127.0.0.1:8092/_agent-native/registry/apps` | GET | none | 500 plugin-not-a-function |
| 2 | List apps (via gateway) | `http://127.0.0.1:8080/dispatch/_agent-native/registry/apps` | GET | none | 500 same |
| 3 | List capabilities | `http://127.0.0.1:8092/_agent-native/registry/capabilities` | GET | cookie | 500 same |
| 4 | RPC valid | `POST /_agent-native/registry/rpc` `{"capability":"notes.create-note","input":{"title":"hi"}}` | POST | cookie | 500 same |
| 5 | RPC unknown capability | `POST /_agent-native/registry/rpc` `{"capability":"nonexistent.fake","input":{}}` | POST | cookie | 500 same — never reaches the `unknown_capability` branch in `capability-registry.ts:520` |
| 6 | RPC malformed body | `POST /_agent-native/registry/rpc` (no body) | POST | none | 500 same — never reaches the `invalid_body` / `missing_capability` branches at `capability-registry.ts:790-800` |
| 7 | RPC missing auth | `POST /_agent-native/registry/rpc` `{"capability":"notes.create-note","input":{"title":"hi"}}` | POST | none | 500 same — `unauthenticated` 401 branch at `capability-registry.ts:803-811` is unreachable |
| 8 | Mobile bearer mint | `POST /_agent-native/auth/mobile-token` | POST | cookie | 500 same — mobile-auth plugin is itself the undefined symbol |
| 9 | Healthz | `GET /healthz`, `GET /_agent-native/healthz` | GET | none | 500 same |
| 10 | Dispatch root | `GET /` | GET | none | 500 same |

**Per-capability matrix could not be run.** Every one of the 343 declared capabilities (and per-template subset breakdowns) would return the same 500, so individual columns are omitted as redundant.

### Edge cases attempted

| Edge case | Outcome |
| --- | --- |
| Unknown capability (`nonexistent.fake`) | NOT REACHED — dispatch returns 500 before handler runs; could not confirm `unknown_capability` error envelope |
| Self-call / cycle detection | NOT REACHED — could not invoke any capability |
| Missing auth (no cookie) | NOT REACHED — could not confirm 401 envelope |
| Mobile bearer JWT (`Authorization: Bearer <jwt>`) | NOT REACHED — mobile-token mint endpoint is itself broken (same root cause) |
| Wrong-type input | NOT REACHED |
| Missing required field | NOT REACHED |
| Extra unknown field (Zod passthrough vs strict) | NOT REACHED |

### Reproducible commands

```bash
# Probe 1
curl -sS -i http://127.0.0.1:8092/_agent-native/registry/apps | head -3
# HTTP/1.1 500 ...

# Probe 4 — valid RPC, cookie attached
curl -sS -X POST http://127.0.0.1:8092/_agent-native/registry/rpc \
  -H 'content-type: application/json' \
  -d '{"capability":"notes.create-note","input":{"title":"hi"}}' \
  -b /tmp/qa-api-a-jar.txt -o /dev/null -w "%{http_code}\n"
# 500

# Probe 5 — unknown capability
curl -sS -X POST http://127.0.0.1:8092/_agent-native/registry/rpc \
  -H 'content-type: application/json' \
  -d '{"capability":"nonexistent.fake","input":{}}' -o /dev/null -w "%{http_code}\n"
# 500

# Probe 8 — mobile token mint
curl -sS -X POST http://127.0.0.1:8092/_agent-native/auth/mobile-token \
  -H 'content-type: application/json' \
  -b /tmp/qa-api-a-jar.txt -d '{}' -o /dev/null -w "%{http_code}\n"
# 500
```

---

## Critical finding (root cause analysis)

### Finding F-API-A-1 — Dispatch dist/ is stale; all registry endpoints fail at boot

**Severity:** Blocker
**Affected branch:** `os-shell`
**Affected commit:** `c2526661 [P7]` (introduced the test runner plugin) and `f224e377 [P8]` (introduced mobile auth) — neither rebuilt `packages/dispatch/dist/`.
**Symptom:** Every HTTP request to dispatch returns 500 with `TypeError: plugin is not a function`. Full stack trace:

```
TypeError: plugin is not a function
  at initNitroPlugins (.../nitro@3.0.260415-beta.../runtime/internal/app.mjs:121:4)
  at useNitroApp (.../nitro.../runtime/internal/app.mjs:19:3)
  at (.../nitro.../runtime/internal/vite/dev-entry.mjs:8:29)
  at ESModulesEvaluator.runInlinedModule (.../vite@8.0.3.../node/module-runner.js:992:3)
  at ModuleRunner.directRequest (.../vite.../node/module-runner.js:1247:59)
  at ViteEnvRunner.reload (.../nitro.../runtime/internal/vite/dev-worker.mjs:58:20)
```

**Root cause:**
The dispatch package consumes the `dist/` build (per `packages/dispatch/package.json` `"./server": "./dist/server/index.js"`). The latest commit added new source modules without rebuilding:

1. **Source files added in P7/P8** (present, with current code):
   - `packages/dispatch/src/server/plugins/tests-runner.ts` — defines and exports `dispatchTestsRunnerPlugin`
   - `packages/dispatch/src/server/plugins/mobile-auth.ts` — defines and exports `dispatchMobileAuthPlugin`, `buildMobileTokenHandler`
   - `packages/dispatch/src/server/lib/mobile-token.ts` — exports `signMobileToken`, `verifyMobileToken`, `extractBearerToken`
2. **Same files in `dist/`** (built earlier — last commit before these existed):
   - `packages/dispatch/dist/server/plugins/tests-runner.js` — **MISSING**
   - `packages/dispatch/dist/server/plugins/mobile-auth.js` — **MISSING**
   - `packages/dispatch/dist/server/lib/mobile-token.js` — **MISSING**
3. **Stale dist `index.js` re-exports** only the older plugins. `dispatchTestsRunnerPlugin`, `dispatchMobileAuthPlugin`, and the mobile-token helpers are absent — see the tail of `packages/dispatch/dist/server/index.js`:

   ```js
   export { default as dispatchCapabilityRegistryPlugin, createCapabilityRegistryPlugin, buildRegistry, dispatchCapability, actionToCapability, discoverTemplatesDir, scanTemplatesForCapabilities, getCapabilityRegistry, } from "./plugins/capability-registry.js";
   //# sourceMappingURL=index.js.map
   ```

   No `dispatchTestsRunnerPlugin` or `dispatchMobileAuthPlugin` line.
4. **Template plugin files trying to re-export the missing symbols**:
   - `templates/dispatch/server/plugins/tests-runner.ts`:
     `export { dispatchTestsRunnerPlugin as default } from "@agent-native/dispatch/server";`
   - `templates/dispatch/server/plugins/mobile-auth.ts`:
     `export { dispatchMobileAuthPlugin as default } from "@agent-native/dispatch/server";`
5. Because the import resolves to `undefined`, the default export is `undefined`. Nitro discovers the plugin file at boot, then in `initNitroPlugins` calls `plugin(app)` — but `plugin` is `undefined` → TypeError.

**Confirmation steps (read-only):**

```bash
# Source has the export
grep dispatchTestsRunnerPlugin packages/dispatch/src/server/index.ts
# export { default as dispatchTestsRunnerPlugin } from "./plugins/tests-runner.js";

# Dist does NOT
grep dispatchTestsRunnerPlugin packages/dispatch/dist/server/index.js
# (no output)

# Same for mobile auth
grep dispatchMobileAuthPlugin packages/dispatch/dist/server/index.js
# (no output)

# Dist plugin file is missing
ls packages/dispatch/dist/server/plugins/ | grep -E "tests-runner|mobile-auth"
# (no output)
```

**Why dev-lazy can't recover:** the dev-lazy gateway auto-restarts crashed child processes, but the dispatch process is *not* crashing — it boots vite, and vite then 500s on every request via dev-entry. Vite's HMR doesn't pick up the missing dist export.

**Recommended fix (do not implement here — for the maintainer / advisory):**
Run `pnpm --filter @agent-native/dispatch build` (or whatever the workspace bootstrap script is) so `dist/server/plugins/tests-runner.js`, `dist/server/plugins/mobile-auth.js`, and `dist/server/lib/mobile-token.js` exist and `dist/server/index.js` re-exports them. The source code is correct; only the build artifact is missing.

**Blast radius:** Every dispatch-hosted feature is offline:
- Capability registry (`/_agent-native/registry/{apps,capabilities,rpc}`) — the QA-API-A target
- Agent chat plugin endpoints (depend on dispatch boot)
- Auth (`/_agent-native/auth/*` on dispatch)
- Mobile bearer mint
- Integration webhooks (Slack/Telegram/email queue + processor)
- Dispatch core routes (`list-workspace-apps`, vault, destinations, etc.)
- Tests runner UI
- The agent sidebar's view of dispatch

QA-API-A, QA-API-B (identity propagation matrix — uses RPC), and any QA-UI agent that loads dispatch will all fail at first probe in this state.

---

## Coverage matrix (per mini-app)

| Mini-app | Capabilities declared | Tested | Passing | Failing | Blocker reason |
| --- | --- | --- | --- | --- | --- |
| analytics | 55 | 0 | 0 | 0 | F-API-A-1 — dispatch 500 |
| calendar | 28 | 0 | 0 | 0 | F-API-A-1 |
| clips | 82 | 0 | 0 | 0 | F-API-A-1 |
| content | 19 | 0 | 0 | 0 | F-API-A-1 |
| crm | 13 | 0 | 0 | 0 | F-API-A-1 |
| design | 30 | 0 | 0 | 0 | F-API-A-1 |
| dispatch | 2 | 0 | 0 | 0 | F-API-A-1 |
| forms | 11 | 0 | 0 | 0 | F-API-A-1 |
| mail | 37 | 0 | 0 | 0 | F-API-A-1 |
| meetings | 11 | 0 | 0 | 0 | F-API-A-1 |
| notes | 6 | 0 | 0 | 0 | F-API-A-1 |
| slides | 41 | 0 | 0 | 0 | F-API-A-1 |
| tasks | 8 | 0 | 0 | 0 | F-API-A-1 |
| **Total** | **343** | **0** | **0** | **0** | |

**Coverage: 0% (0/343).** No capabilities testable until F-API-A-1 is fixed.

Sample failure body (any RPC probe — all identical):

```html
<title>An error has occurred</title>
...
<h4 id="error-name">TypeError</h4>
<span>plugin is not a function</span>
```

---

## What was not testable, and why

| Scope item | Status | Reason |
| --- | --- | --- |
| Inventory via `GET /registry/apps` | NOT TESTED | Endpoint 500. Static count substituted. |
| Inventory via `GET /registry/capabilities` (including JSON Schema dump) | NOT TESTED | Endpoint 500. Could not extract JSON Schemas at runtime to build minimal-valid inputs for each capability. |
| Per-capability valid-input call | NOT TESTED | All 343 would hit the same 500. |
| Per-capability invalid-input call (wrong type / missing required / extra unknown) | NOT TESTED | Same. |
| `unknown_capability` error envelope (404 + `{ok:false,error:{code:"unknown_capability"}}`) | NOT TESTED | Dispatch's response status path is unreachable. |
| `invalid_input` error envelope (400 + Zod message) | NOT TESTED | Same. |
| `cycle_detected` error envelope | NOT TESTED | Same; also no obvious self-calling capability in the declared set. |
| `unauthenticated` error (401 when no cookie) | NOT TESTED | Same — couldn't confirm the 401 status from `capability-registry.ts:803-811`. |
| Mobile bearer-token RPC parity | NOT TESTED | Mobile-token mint endpoint itself 500s (same root cause). |
| Agent tool-list vs registry parity | NOT TESTED | Agent chat plugin is also down. |

---

## Recommendations

1. **Unblock:** Rebuild `packages/dispatch` so `dist/` matches source — explicitly include the new `plugins/tests-runner.js`, `plugins/mobile-auth.js`, `lib/mobile-token.js`, and updated `index.js` re-exports. After the rebuild, dispatch should boot and the registry endpoints become reachable.
2. **Add a CI guard:** A pre-commit / CI step that fails when `packages/*/dist/` is out of sync with `packages/*/src/`. The current failure mode (silently consume a stale dist) is brittle for a workspace where many agents land independent phases. A `pnpm prep` step that runs `pnpm -r build` and checks `dist/` is dirty would catch it.
3. **Make the failure louder:** Nitro's "plugin is not a function" message doesn't name which plugin. Consider wrapping the plugin loader (or upstream-suggesting Nitro's loader) to log the file path of the offending plugin so future regressions surface in 30 seconds rather than 30 minutes.
4. **Re-run QA-API-A after fix:** Once dispatch is back, the full per-capability test matrix should run. With 343 capabilities and ~4 probes each (valid / wrong-type / missing-required / extra-field), that's ~1,400 calls — script-able in ~10 minutes if `/registry/capabilities` returns proper JSON Schemas. Without the runtime JSON Schema dump, the per-capability matrix would need to hand-derive inputs from each `defineAction.schema` Zod definition.

---

## Summary

| Metric | Value |
| --- | --- |
| Dispatch boot health | FAIL (500 on every endpoint) |
| Capabilities discoverable via HTTP | 0 |
| Capabilities discoverable via static source scan | 343 across 13 apps |
| Valid-input pass rate | 0% (untested) |
| Invalid-input pass rate | 0% (untested) |
| Edge-case pass rate | 0% (untested) |
| Mobile-bearer path | FAIL (same root cause) |
| Critical findings | 1 (F-API-A-1, Blocker) |
| Ship decision (QA-API-A scope) | **Hard NO — fix the dist before re-running** |

**Completion gate input from QA-API-A:** the registry layer cannot be evaluated until the dispatch dist is rebuilt. After that, expect a re-run to be cheap (most failures will likely cluster on a small set of cross-cutting issues — input-schema strictness, identity propagation in handler context — which a single fresh run will surface quickly).
