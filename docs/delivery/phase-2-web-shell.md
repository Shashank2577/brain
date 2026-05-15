# Phase 2 — Web Shell (Left Rail + Iframe + Persistent Agent Sidebar)

**Goal:** Replace dispatch's current tile-based `/dispatch/apps` page with a true super-app shell — persistent left rail listing every installed mini-app, central iframe content area, persistent agent sidebar that stays mounted across app switches.

## Deliverables

- [ ] **Left rail component** in `packages/dispatch/src/components/SuperAppRail.tsx` — vertical icon strip on the far left, one icon per installed mini-app (from `/_agent-native/registry/apps`)
- [ ] **Shell layout** in `templates/dispatch/app/routes/_shell.tsx` (new pathless layout) — renders rail + content iframe + agent sidebar in a three-column flex
- [ ] **Iframe content host** in `packages/dispatch/src/components/ShellContentHost.tsx` — manages the active iframe, deep-link URL reflection (`?app=calendar&path=...`), iframe-load handling, postMessage bridge for parent ↔ child
- [ ] **Embedded-mode detection** in templates — use `packages/core/src/client/frame.ts` to detect when running inside the dispatch shell; hide each template's own agent sidebar in that case
- [ ] **postMessage bridge** in `packages/core/src/client/frame.ts` — child mini-app posts `{ kind: "url-change", path: "/booking/abc" }` to parent on internal navigation; parent reflects in URL
- [ ] **Keyboard shortcuts** — `Cmd+1` through `Cmd+9` switch to the first 9 rail icons; `Cmd+K` opens command menu (existing)
- [ ] **URL parsing** — `dispatch.example.com/?app=calendar&path=/booking/abc` parses on load and opens the iframe to the right state

## Tasks

| ID | Task | Owner | Depends |
|---|---|---|---|
| T-P2-01 | Audit existing `/dispatch/apps` tile page; identify what gets replaced vs preserved | UX Engineer | — |
| T-P2-02 | Design rail icons + active state + tooltip; verify accessibility (keyboard nav, screen reader) | UX Engineer | T-P2-01 |
| T-P2-03 | Implement SuperAppRail component, fetching from `/_agent-native/registry/apps` | Product Engineer | Phase 1 done |
| T-P2-04 | Implement ShellContentHost iframe management + URL reflection | Product Engineer | T-P2-03 |
| T-P2-05 | Implement postMessage bridge in `core/client/frame.ts` | Product Engineer | T-P2-04 |
| T-P2-06 | Wire embedded-mode detection in every existing template's `root.tsx` to hide own sidebar | Product Engineer | T-P2-05 |
| T-P2-07 | Implement keyboard shortcuts (Cmd+1..9) | Product Engineer | T-P2-03 |
| T-P2-08 | Move existing `/dispatch/apps` content to a "Manage apps" subpage (settings-like); the rail is the new primary UX | UX Engineer | T-P2-04 |
| T-P2-09 | E2E test: open shell, click 3 rail icons, verify state preservation | Product Engineer | T-P2-04 |

## Acceptance criteria

- [ ] Dispatch shell at `/dispatch` renders left rail with ≥ 10 icons (one per installed mini-app)
- [ ] Clicking an icon switches the central iframe to that mini-app within < 400 ms (no parent reload)
- [ ] Browser URL updates to `/dispatch?app=<id>&path=<iframe-path>` reflecting active app + deep link
- [ ] Reloading the parent page restores the iframe to its previous deep link
- [ ] Agent sidebar stays mounted across app switches (no remount, scroll position preserved)
- [ ] Each iframed mini-app's own agent sidebar is hidden (one source of truth)
- [ ] `Cmd+1` through `Cmd+9` switch apps with no mouse
- [ ] All 10 existing templates work inside the shell without console errors
- [ ] Standalone mode still works for each template (visit `/calendar` directly, see calendar's own sidebar)

## QA plan

- Component: SuperAppRail + ShellContentHost unit tests (mocked registry)
- E2E: Playwright suite that walks the rail, asserts iframe load, asserts URL reflection, asserts agent sidebar persistence
- Manual: cross-browser smoke (Chrome, Firefox, Safari)

## Pivot triggers

- **If postMessage proves flaky / async timing issues:** use `BroadcastChannel` API for same-origin communication (works in all modern browsers, simpler API).
- **If iframe boot is too slow per switch (> 1 s):** pre-render iframes for the most-recently-used apps and hide them with `display: none` instead of unmounting. Trade-off: memory cost.
- **If a template's UI breaks inside an iframe (e.g. fixed-position elements):** add per-template `appShellMode` CSS variables to adapt layout, applied via the embedded-mode detection.

## Risks

- Some templates may rely on `window.parent` checks that need updating. Phase 2 audit (T-P2-01) catches this.
- The persistent agent sidebar needs to know "what's the user looking at" across all iframed apps. The postMessage bridge handles this, but `application_state` polling in each iframed app must continue to work (it does — same origin, shared DB).

## Out of scope

- Mobile shell — that's Phase 8
- Drag-to-reorder rail icons — v1 alphabetical; user customisation later
- Multi-window / picture-in-picture mini-apps — v2

## Estimated effort

1.5 dev-days (Product Engineer) + 0.5 day UX (UX Engineer) + 0.5 day review (Architect) = 2.5 days.
