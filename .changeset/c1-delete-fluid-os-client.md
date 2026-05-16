---
"@agent-native/core": patch
"@agent-native/dispatch": patch
---

Item C1: delete the deprecated `templates/crm/server/lib/fluid-os-client.ts` HTTP shim and migrate CRM cross-app calls (`log-outreach`, `schedule-meeting`) to `callCapability` from `@agent-native/core/server`. Dispatch now flips `FLUID_IS_DISPATCH=1` inside the capability-registry plugin so the in-process fast path engages, and the workspace dev runner injects `DISPATCH_URL` into every non-dispatch template worker so the HTTP path knows where to POST. A new `guard-no-fluid-os-client.mjs` guard prevents the legacy shim or `FLUID_OS_TOKEN` env var from coming back.
