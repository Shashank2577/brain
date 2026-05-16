---
"@agent-native/core": minor
"@agent-native/dispatch": minor
---

Cross-app capability calls now route through a typed dispatch broker (`callCapability` + `POST /_agent-native/rpc/dispatch`) with short-TTL signed identity headers (HS256 over `BETTER_AUTH_SECRET`); dispatch keeps the in-process fast path for locally-owned FQIDs.
