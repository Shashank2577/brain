---
"@agent-native/core": patch
"@agent-native/dispatch": patch
---

fix(p0): resolve mobile bearer JWT inside getSession before global 401

Move the mobile bearer-JWT resolver from the dispatch capability-registry
plugin into core's `getSession()` so the framework-global 401 guard accepts
mobile requests. The previous ordering ran the global guard before the
plugin's resolver, 401-ing every mobile request on all 13 templates. The
JWT lib moved from `packages/dispatch/src/server/lib/mobile-token` to
`packages/core/src/server/mobile-token`; dispatch keeps a re-export for
backward compatibility.
