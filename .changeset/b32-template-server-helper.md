---
"@agent-native/core": minor
---

Lift template SSR wiring into a shared `createTemplateServer({ templateId, getBuild })` helper exported from `@agent-native/core/server/template-server`. Templates' `server/routes/[...page].get.ts` collapses to a one-liner; the helper owns the React Router request handler shape so per-template drift (the "NitroViteError: No fetch handler exported from virtual:react-router/server-build" outage that took out notes/tasks/crm/meetings) becomes structurally impossible. `createH3SSRHandler` is also hardened to normalize the resolved server build module so the same input always produces the same handler shape. New `guard:template-ssr-route` + `smoke-template-ssr.mjs` keep future templates correct by default.
