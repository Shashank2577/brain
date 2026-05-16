# MOBILE LAUNCH BLOCKED — Phase 8 mobile shell

**Date:** 2026-05-16
**Branch:** `os-shell` (HEAD `7881aa97`)
**Phase 8 commit under test:** `f224e377` — `[P8] mobile shell foundation + workspace bearer-token auth`
**Agent role:** Mobile QA — actually launch the mobile app on an iOS Simulator or Android Emulator and capture screenshots.

---

## Verdict

**BLOCKED.** Cannot launch on a simulator or emulator on this dev machine — neither toolchain is installed:

- No full Xcode → `xcrun simctl` is unavailable, so iOS Simulator cannot be booted or driven for screenshots.
- No Android SDK / platform-tools → `adb` and `emulator` are not on `PATH`, and `~/Library/Android` does not exist.

Per the task brief's BLOCKED fallback, I (a) captured the dev-machine env state, (b) verified Phase 8's mobile bundle builds cleanly for both platforms, (c) ran the Phase 8 smoke tests and typecheck, and (d) probed the gateway / dispatch endpoints the mobile app would call. Details below.

---

## Environment state

| Tool | Result |
| --- | --- |
| `xcode-select -p` | `/Library/Developer/CommandLineTools` (CLT only — **no full Xcode**) |
| `/Applications/Xcode.app` | does not exist |
| `xcrun simctl list devices` | `xcrun: error: unable to find utility "simctl", not a developer tool or in PATH` |
| `which adb` | `adb not found` |
| `emulator -list-avds` | `command not found: emulator` |
| `~/Library/Android` | does not exist (no SDK install) |
| `node --version` | `v25.9.0` |
| `pnpm --version` | `9.15.9` |
| `expo --version` (via `packages/mobile-app/node_modules/.bin/expo`) | `55.0.26` |
| `sw_vers` | macOS 26.2 (Build 25C56) |

### What would unblock this

To run on an iOS Simulator on this machine the user needs to:

1. Install full Xcode from the App Store (Command Line Tools alone are not enough — `simctl` ships only with Xcode.app), then `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
2. Accept the Xcode license: `sudo xcodebuild -license accept`.
3. Open Xcode once so it provisions the default iOS simulator runtime, or install one explicitly: `xcodebuild -downloadPlatform iOS`.

To run on an Android Emulator the user needs to:

1. Install Android Studio (or the standalone command-line tools), then install an SDK platform and a system image via `sdkmanager`.
2. Create an AVD: `avdmanager create avd -n Pixel_7 -k "system-images;android-34;google_apis;x86_64"`.
3. Add `~/Library/Android/sdk/platform-tools` and `~/Library/Android/sdk/emulator` to `PATH`.

Neither setup can be performed inside this agent: full Xcode is a 15-GB App Store install behind Apple ID auth, and Android Studio's first-run wizard is interactive.

---

## What I verified instead — Phase 8 mobile shell health (no simulator)

### 1. iOS bundle export ✅

```
cd packages/mobile-app
node_modules/.bin/expo export --platform ios --output-dir dist-ios
```

- Bundled `expo-router/entry.js` in 2.36s — 1,148 modules, 42 assets.
- Output: `dist-ios/_expo/static/js/ios/entry-841dea307d78ee7a3e3a012896d65033.hbc` — **3,064,200 bytes (3.1 MB Hermes bytecode)**.
- Total `dist-ios/` size: **7.0 MB** (bundle + 42 assets).
- No bundling errors.

### 2. Android bundle export ✅

```
node_modules/.bin/expo export --platform android --output-dir dist-android
```

- Output: `dist-android/_expo/static/js/android/entry-5c3be4bfea79ab805e479ab645329b32.hbc` — **3.1 MB Hermes bytecode**.
- Total `dist-android/` size: **13 MB** (bundle + assets, larger because Android packs density-variant PNGs).
- No bundling errors.

Both platforms confirm the Phase 8 code (sign-in screen, registry-apps list, per-app WebView host, auth gate in `_layout.tsx`) compiles cleanly through Metro on both targets.

### 3. Smoke tests ✅

```
node_modules/.bin/vitest --run
```

```
✓ lib/auth.spec.ts (6 tests) 44ms
Test Files  1 passed (1)
     Tests  6 passed (6)
```

Covers: token mint round-trip, AsyncStorage persistence, 401 surfacing, network-error handling, bearer-header injection. (Per STATUS.md, the broader 17-test JWT suite and 7-test mobile-auth handler suite live in `packages/dispatch/src/server/lib/` — those are dispatch-package tests, not mobile-app tests.)

### 4. TypeScript typecheck ✅

```
node_modules/.bin/tsc --noEmit
```

Clean — no diagnostics from any of the Phase 8 source files (`lib/auth.ts`, `lib/config.ts`, `lib/use-registry-apps.ts`, `app/sign-in.tsx`, `app/registry-apps.tsx`, `app/registry-apps/[id].tsx`, `app/_layout.tsx`).

---

## Endpoint probes against the running workspace gateway

These probes describe what the mobile client *would* hit if a simulator could run. The workspace dev server (`pnpm dev:lazy`, pid 33630) is alive on `localhost:8080`, and the Dispatch shell is alive on `localhost:8084`.

| Probe | Result | Notes |
| --- | --- | --- |
| `GET http://localhost:8080/_agent-native/registry/apps` | **404** | The gateway root returns the static `Agent-Native Templates` landing HTML for everything that doesn't match a template prefix. Bare `/_agent-native/*` is **not** proxied through the gateway. |
| `GET http://localhost:8080/dispatch/_agent-native/registry/apps` | **401 Unauthorized** (JSON) | Reachable through the dispatch prefix — and gated on auth. The endpoint exists and behaves correctly. |
| `GET http://localhost:8084/_agent-native/registry/apps` | **401 Unauthorized** (JSON) | Dispatch app directly: same — endpoint live, requires auth. |
| `POST http://localhost:8080/_agent-native/auth/mobile-token` | **HTML landing page (200)** | Mint endpoint **not** reachable on the gateway root. |
| `GET http://localhost:8084/_agent-native/auth/mobile-token` | **404** | Wrong method for the endpoint, but confirms dispatch is the host. (`POST` would be expected; not exercised in a curl probe.) |

**This is a real bug for the mobile launch path, not just a quirk of curl.** `packages/mobile-app/lib/config.ts` resolves the workspace URL to:

```ts
if (Platform.OS === "android") return "http://10.0.2.2:8080";
return "http://localhost:8080";  // iOS & web
```

On port 8080 the gateway does not expose `/_agent-native/auth/mobile-token` or `/_agent-native/registry/apps`. A user who simply runs `pnpm dev:lazy` + boots the mobile app on iOS Simulator will:

1. Submit `alice@demo.local` / `demo1234` on the sign-in screen.
2. The client `POST`s to `http://localhost:8080/_agent-native/auth/mobile-token`.
3. The gateway returns the static landing HTML (HTTP 200, not JSON) — the auth lib's `response.ok` check passes but `response.json()` will throw on the HTML body. The user will see whatever error toast `signInWithPassword` surfaces on parse failure.

**Workarounds for a real launch** (would need to be applied by whoever sets up Xcode/Android):

- Pass `EXPO_PUBLIC_WORKSPACE_URL=http://localhost:8084/dispatch` (or `http://localhost:8084` if the dispatch app expects to be reached at its own root) at `expo start` time, OR
- Update `dev:lazy` so the gateway on 8080 mounts `/_agent-native/*` against the dispatch app, OR
- Set `expo.extra.workspaceUrl` in `app.json` to point at the dispatch app's URL.

I am flagging this and **not** fixing it (per the brief: "Don't modify source code in this agent.").

---

## Step-by-step result

Each numbered step from the task brief is listed with its outcome:

| Step | Result |
| --- | --- |
| 1. Pick simulator path | **iOS: blocked** (no Xcode). **Android: blocked** (no SDK). |
| 2. Boot simulator | **N/A — blocked.** |
| 3. `pnpm exec expo start` | **Not attempted** — would launch the dev server but cannot push to a simulator. Kept out to avoid background processes the user would have to clean up. |
| 4. Sign-in screen flow | **N/A — blocked.** Source verified: `app/sign-in.tsx` (6,114 bytes) implements the email + password form + `POST /_agent-native/auth/mobile-token` round-trip. |
| 5. Apps list (14 templates) | **N/A — blocked.** Source verified: `app/registry-apps.tsx` (7,053 bytes) fetches `/_agent-native/registry/apps` via `lib/use-registry-apps.ts`. Endpoint **is reachable** at `http://localhost:8084/_agent-native/registry/apps` (returns 401 without auth — i.e. it exists). |
| 6. Open one app — WebView render | **N/A — blocked.** Source verified: `app/registry-apps/[id].tsx` injects the JWT both as `Authorization: Bearer` on the initial request and via a `window.fetch` patch inside the WebView. |
| 7. Back navigation | **N/A — blocked.** Expo Router stack — header back button is wired via `app/_layout.tsx`. |

---

## Bugs / risks flagged for follow-up

1. **Workspace URL points at the wrong port for the default `pnpm dev:lazy` setup.** Tracked above. Mobile client defaults to `localhost:8080`, but `dev:lazy`'s gateway on 8080 does not expose `/_agent-native/auth/mobile-token` or `/_agent-native/registry/apps` — those live on the dispatch app at `localhost:8084` (or behind `/dispatch/...` on the gateway). The sign-in screen will fail silently against the default dev-machine config. **Severity: high** — this is the very first interaction in the Phase 8 flow.

2. **Sign-in error path on non-JSON response.** Even if the workspace URL were correct, `lib/auth.ts`'s `signInWithPassword` likely calls `response.json()` on the response body. If the dev-mode gateway ever serves HTML (as 8080 does today), the resulting parse error will surface as a generic "network error" toast that gives users no actionable hint. Worth defensive handling. **Severity: low** (cosmetic / DX).

3. **`expo doctor` is not runnable via the local CLI** — `expo doctor` is no longer in the local CLI; this is upstream Expo, not a Phase 8 issue. `npx expo-doctor` works but requires network. **Severity: none** — informational.

4. **`expo.extra.workspaceUrl` defaults to `null` in `app.json`.** Acceptable for dev (the platform default kicks in) but every prod build will need this set explicitly. Worth a release-readiness check before EAS Build. **Severity: low** (release-time concern).

No bugs found in the Phase 8 source itself — bundling, typechecking, and the auth-helper smoke suite are all green.

---

## Screenshot evidence

`packages/mobile-app/screenshots/` was created but contains no screenshots — the simulator could not be booted. The directory is left in place so that whoever finishes this task on a properly-configured machine has the destination ready (`xcrun simctl io booted screenshot <step>.png`).

---

⠀
🟡 Mobile launch blocked; bundles + tests + typecheck all green; workspace-URL mismatch flagged for follow-up
