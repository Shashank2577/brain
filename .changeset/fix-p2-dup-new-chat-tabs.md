---
"@agent-native/core": patch
---

fix(p2): chat sidebar — disambiguate duplicate "New chat" tab labels

When a user opened multiple empty chat tabs, the sidebar showed two (or
more) tabs labeled "New chat" side-by-side, making them visually
indistinguishable. Default fallback labels now get a numeric suffix
("New chat", "New chat 2", "New chat 3", ...) so each open tab is
unique at a glance.
