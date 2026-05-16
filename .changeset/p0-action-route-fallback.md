---
"@agent-native/core": patch
---

fix(p0): mount fallback handler at `/_agent-native/actions` so unmatched POSTs return clean JSON instead of crashing the React Router SSR catch-all with `NitroViteError: No fetch handler exported from virtual:react-router/server-build`. Actions declared `http: false` now return 403 `agent_only`; unknown action names return 404 `unknown_action`. Eliminates the 79-endpoint server crash reported in `docs/qa-reports/HTTP-API-COVERAGE.md` (2026-05-16).
