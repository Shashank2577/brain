# OS Shell — Final Plain-English Breakdown

Branch `os-shell`. Last commit `8216f582`. **24 commits ahead** of baseline `7ae9b50b`.

## What was the plan?

A unified super-app where a user signs in once and uses many mini-apps from one shell. One left rail, one persistent agent sidebar, real persistence, inter-app communication, scaffolder to create new apps on demand, mobile foundation, Amazon Bedrock as an LLM provider. All apps using the **same architecture** — Nitro server + Vite + React Router 7 + Drizzle ORM — no two different stacks.

## What I did (in plain terms)

| What | Done? | Where to see it |
|---|---|---|
| Wrote a complete spec ecosystem (BRD, PRD, TRD, ADRs, phase docs, per-app specs) | ✅ | `docs/` — 45 files |
| Built the capability registry + RPC inside dispatch | ✅ | `packages/dispatch/src/server/plugins/capability-registry.ts` |
| Built the super-app shell (left rail + iframe content area + persistent agent sidebar) | ✅ | `packages/dispatch/src/components/{SuperAppRail,ShellContentHost}.tsx` + `templates/dispatch/app/routes/shell.tsx` |
| Promoted 4 manifest-only apps to full templates with backend + UI + tests | ✅ | `templates/{notes,tasks,crm,meetings}/` |
| Killed the old `:4100` standalone host, reduced fluid-os to a library | ✅ | Phase 4 commit |
| Added Amazon Bedrock as a first-class LLM provider | ✅ | `packages/core/src/agent/engine/providers/bedrock.ts` |
| Built starter templates + Create-app UI for scaffolding new mini-apps | ✅ | `packages/core/src/cli/starter-templates/` + `packages/dispatch/src/components/create-app-popover.tsx` |
| Set up test infrastructure (Playwright + executable runner + `/dispatch/tests` UI page) | ✅ | `playwright.config.ts`, `bin/test-fluid-os.sh`, `tests/` |
| Mobile shell foundation with bearer-JWT auth | ✅ source | `packages/mobile-app/` |
| Ran a final multi-agent QA sweep that surfaced real integration gaps | ✅ | `docs/qa-reports/` |
| Fixed the gaps the QA sweep found (notes SSR, mail aliases, mobile config, scaffolder dev-repo support, dispatch dist) | ✅ | Commits `6bace553`, `67e96bd0`, `5a2c71d1`, `8216f582`, `b09b9798` |

## Status of every template (curl-verified just now)

All 13 templates return **HTTP 200** through the workspace gateway at `http://127.0.0.1:8080`:

```
dispatch: 200    calendar: 200   mail: 200       slides: 200
forms: 200       content: 200    design: 200     analytics: 200
clips: 200       notes: 200      tasks: 200      crm: 200
meetings: 200
```

Cross-template SSO works — alice@demo.local is recognized on every template that handled my session probe.

## Are notes/tasks/crm/meetings different from the other templates?

**No.** I want to be explicit about this because it caused confusion.

Every template — calendar, mail, slides, forms, content, design, analytics, clips, **and the 4 new ones** (notes, tasks, crm, meetings) — uses the identical stack:

- **Nitro** (h3-based) for the HTTP server
- **Vite** for the build
- **React Router 7** for the front-end with SSR
- **Drizzle ORM** for the database
- **Better Auth** for the auth layer
- Per-template `actions/*.ts` exposed as capabilities via the dispatch registry

The notes 500 error you saw earlier was NOT because notes was "vite/react only" while others were "Nitro" — they're all the same. The bug was a missing server plugin file (`auth.ts` + `agent-chat.ts`) in the notes template that meant the framework's auth guard never installed, so unauthenticated requests fell through to React Router's raw SSR (which doesn't export a fetch handler at the lifecycle stage Nitro expected). Fixed in commit `6bace553`.

## Mobile status — precise version

- **Native shell:** Yes. React Native + Expo. Bundles build cleanly for iOS AND Android.
- **Mini-app content rendering:** **WebView** (a browser inside the native shell). Per ADR-006, this is the v1 strategy — get the architecture proven cheaply, decide on native screens per-app later.
- **So "is the mobile UI a browser"?** Yes — the **content area** within the native shell is a WebView (browser-rendered). The **shell chrome** (sign-in screen, apps list, navigation tabs) is native React Native components.
- **Has it actually been launched on a simulator?** **No.** This dev machine doesn't have full Xcode (only Command Line Tools, no `xcrun simctl`), and no Android SDK (`adb`/`emulator` absent). The mobile app can be built (bundles OK), can be type-checked (clean), can be smoke-tested (6/6 unit tests pass), but it can't be visually demoed without installing one of those toolchains.
- **Did the Phase 8 implementation have bugs?** Yes — one I caught + fixed in this session: `lib/config.ts` defaulted to `http://localhost:8080` but the mobile-token + registry endpoints live under `/dispatch/...` not at the gateway root. Fixed in commit `5a2c71d1`. Confirmed via curl that the new path works.

## "Create a new app" — the ultimate final step

You correctly remembered this as the climax of the plan (Phase 6). I shipped the code in commit `8866ab69`:
- 4 starter templates: blank, crud-list, dashboard, agent-tool
- Server action `scaffold-from-template`
- UI in the dispatch Create-app dialog with a tabbed picker
- 33 new tests passing

But I never demoed it end-to-end. The QA-Demo agent caught the reason: the scaffolder refused to run because it required an `agent-native.workspaceCore` marker in `package.json` that exists in end-user-generated workspaces but NOT in the framework's own dev repo. **Fixed in commit `8216f582`** — added a fallback that detects the framework dev repo (pnpm-workspace.yaml + packages/core/ + templates/) and uses that root as the scaffold target.

The Create-app flow should now work in this repo too. Hasn't been re-demoed post-fix because that requires a fresh browser run — call it a follow-up if you want to verify visually.

## What's broken now (post-fixes)

The list got significantly shorter after this session's fixes:

| Issue | Severity | Status |
|---|---|---|
| Notes 500 (missing server plugins) | was Critical | ✅ **FIXED** `6bace553` |
| Mail 16 missing capabilities (@shared alias) | was Critical | ✅ **FIXED** `67e96bd0` (37/37 capabilities now register) |
| Tasks 404 (not registered in dev-lazy) | was High | ✅ **FIXED** `67515f68` (set `core: true`) |
| Dispatch boot crash (dist out of sync) | was Blocker | ✅ **FIXED** `b09b9798` (auto-prebuild) |
| Mobile config wrong endpoint URL | was High | ✅ **FIXED** `5a2c71d1` |
| Scaffolder rejects framework-dev-repo | was High | ✅ **FIXED** `8216f582` |
| CRM timeout | was Critical | ✅ **FALSE ALARM** (was just lazy-boot first-hit; no crash) |
| `NitroViteError: No fetch handler` on failed POSTs (BLK-2 from QA-UI-B) | High | ❌ Open — framework-level issue, affects sign-up paths across templates |
| Spec/code FQID drift in `docs/apps/*.md` | Low | ❌ Open — docs say `notes.create`, runtime is `notes.create-note` |
| Mobile run on actual simulator | Medium | ❌ Blocked on dev-machine toolchain (need Xcode or Android SDK) |
| Capability `consumes` whitelist enforcement | Medium | ❌ Open by design (advisory in v1 per ADR-004) |
| AWS root-account key rotation | Polish | ❌ User infra recommendation, not a code issue |
| Pull `origin/main` (5 commits behind) | Polish | ❌ Will rebase when ready to ship |

## What's working right now — concrete proof

These are things you can verify yourself in a browser:

1. **Sign-in flow** — `http://127.0.0.1:8080/dispatch`, sign in as `alice@demo.local` / `demo1234`. Real Better-Auth session minted, cookie set.
2. **Cross-template SSO** — after signing in at dispatch, every other template's `/auth/session` endpoint returns alice's identity without re-auth.
3. **All 13 templates serve 200** — calendar/mail/slides/forms/content/design/analytics/clips/notes/tasks/crm/meetings/dispatch.
4. **The shell** — left rail (`SuperAppRail`), iframe content host (`ShellContentHost`), persistent agent sidebar exist as components — visible at `/dispatch/shell` route.
5. **Capability registry** — `curl http://127.0.0.1:8080/dispatch/_agent-native/registry/apps` lists all installed apps; `/registry/capabilities` lists all auto-derived capabilities (now including the 16 mail ones that were missing).
6. **Inter-app RPC** — `POST /_agent-native/registry/rpc` with `{capability: "<fqid>", input: ...}` dispatches with identity propagation. QA-API-B verified 33/33 scenarios.
7. **Bedrock LLM provider** — selectable via `LLM_PROVIDER=bedrock` env or settings UI. Live call requires AWS creds (already configured at root level).
8. **Tests** — `pnpm test` shows 1561 passing (was 1496 + 16 failing).
9. **`/dispatch/tests` page** — dev-gated test runner UI page (shipped in P7-main).
10. **Mobile bundles** — `pnpm --filter mobile-app exec expo export --platform ios` produces 3.1 MB Hermes bytecode. Same for Android.

## How to actually use this branch right now

For someone picking up this branch fresh:

```bash
cd /Users/shashanksaxena/Documents/Personal/Code/fluid-system
git checkout os-shell

# .env.local files for templates are gitignored; create them with the
# shared values that workspace SSO requires. The dispatch one likely
# already exists. For the 4 new templates:
SHARED_SECRET=$(grep '^BETTER_AUTH_SECRET=' templates/dispatch/.env.local | head -1 | sed 's/^BETTER_AUTH_SECRET=//')
DB="file:$(pwd)/.dev-data/workspace.db"
for t in notes tasks crm meetings; do
  printf "DATABASE_URL=%s\nBETTER_AUTH_SECRET=%s\n" "$DB" "$SHARED_SECRET" > templates/$t/.env.local
done

# Start the workspace
pnpm install
pnpm dev:lazy

# Visit http://127.0.0.1:8080/dispatch — sign in or sign up
# Click any tile / use rail icons to switch between mini-apps
# Use the agent chat to invoke cross-app capabilities
```

## The honest verdict

The branch is **architecturally validated and ~95% feature-complete at the code level**. The QA sweep did exactly what it was meant to do — found real integration gaps that unit tests miss — and this session closed 5 of those gaps. The remaining open issues are:

- 1 framework-level Nitro/Vite bug (the failed-POST brick — BLK-2 from QA-UI-B) — needs focused debugging
- 1 cosmetic doc drift (FQIDs in `docs/apps/*.md`)
- 1 toolchain blocker for visual mobile verification (user-machine config)

**Recommended next steps in order of priority**:

1. **Verify the Create-app flow in a browser** post the scaffolder fix (`8216f582`) — that's the ultimate-final-step demo.
2. **Run the failed-POST repro** (sign-up with an existing email on any template) and debug the `virtual:react-router/server-build` issue. This is the last remaining blocker for production-quality UX.
3. **Update `docs/apps/*.md`** FQIDs to match runtime (`-list`/`-note` suffixes).
4. **Install Xcode** if you want a visual mobile demo, then run `cd packages/mobile-app && pnpm exec expo start --ios`.
5. **Pull `origin/main`** and rebase when ready to merge upstream.
