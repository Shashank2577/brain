# <Name> — Agent Guide

This is a **blank** agent-native template — the minimal scaffold to get a
new mini-app on the rail. Built on `@agent-native/core`, so the agent and
the UI share state through the SQL database with polling for sync.

## Starting capabilities

| Capability             | Role   | Description                                        |
| ---------------------- | ------ | -------------------------------------------------- |
| `<name>.list-items`    | viewer | List items the current user can see (paginated).   |

Sharing is auto-mounted by the framework — `share-resource`,
`unshare-resource`, `list-resource-shares`, `set-resource-visibility` all
accept `--resourceType <name>-item`.

## Data model

`server/db/schema.ts`:

| Table                  | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `<name>_items`         | The item row — title, body, timestamps.  |
| `<name>_item_shares`   | Per-principal share grants.              |

Every item carries `ownerEmail`, `orgId`, and `visibility` via
`ownableColumns()`. Reads filter through `accessFilter` and writes go
through `assertAccess`.

## Adding more capabilities

The blank starter only ships a list action. To add create / get / update
/ delete actions, copy the templates from `templates/notes/actions/*.ts`
and adapt them.

## Rules

1. **All data lives in SQL.** No in-memory state.
2. **All AI goes through the agent chat.** Never call OpenAI directly.
3. **Migrations are additive only.** No `DROP TABLE`, no rename.
4. **Use shadcn/ui + Tabler icons** for any UI work.
5. **TypeScript everywhere.**
