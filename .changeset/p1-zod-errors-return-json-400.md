---
"@agent-native/core": patch
---

fix(p1): zod errors return JSON 400 instead of HTML 500

The action HTTP wrapper now catches raw `ZodError` (and any Standard
Schema validation failure) thrown from an action and returns a structured
JSON `400 { error: "validation", message, issues: [...] }` response. The
pre-formatted `"Invalid action parameters …"` message produced by
`defineAction`'s schema wrapper is also normalized to the same `{ error:
"validation", message }` shape. An outer try/catch around the whole
event handler guarantees that uncaught failures from auth resolution or
h3 setup also return JSON (with the original `statusCode` when present,
otherwise 500) instead of falling through to Nitro's default HTML error
page — which broke fetch callers and polluted Sentry as opaque 500s.
