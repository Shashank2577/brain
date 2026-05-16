---
"@agent-native/dispatch": patch
---

fix(integrations): show error state instead of indefinite "Discovering apps and credentials…" when the catalog action fails. The page now renders an inline error with the underlying message and a "Try again" button when `list-integrations-catalog` errors after retries, so a backend hiccup no longer looks like a forever-loading page.
