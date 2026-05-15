# <Name> — Agent Guide

This is a **CRUD list** agent-native template — list view + detail page,
five baseline CRUD actions, one ownable table. The standard pattern for
"a list of things the user creates and edits."

## Capabilities

| Capability             | Role   | Description                                  |
| ---------------------- | ------ | -------------------------------------------- |
| `<name>.list-items`    | viewer | List items the current user can see.         |
| `<name>.get-item`      | viewer | Get a single item by id (full body).         |
| `<name>.create-item`   | viewer | Create a new item.                           |
| `<name>.update-item`   | editor | Update an item's title or body.              |
| `<name>.delete-item`   | admin  | Hard-delete the item and its share grants.   |

Sharing is auto-mounted by the framework — `share-resource`,
`unshare-resource`, `list-resource-shares`, `set-resource-visibility` all
accept `--resourceType <name>-item`.

## Data model

| Table                  | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `<name>_items`         | The item row — title, body, timestamps.  |
| `<name>_item_shares`   | Per-principal share grants.              |

Every item carries `ownerEmail`, `orgId`, `visibility` via
`ownableColumns()`. Reads filter through `accessFilter` and writes go
through `assertAccess`.

## Common tasks

| User request                | What to do                                                  |
| --------------------------- | ----------------------------------------------------------- |
| "Show me my items"          | `list-items`                                                |
| "Create an item titled X"   | `create-item --title "X"`                                   |
| "Open item X"               | `get-item --id <id>` then `navigate --path /<id>`            |
| "Rename to Y"               | `update-item --id <id> --title "Y"`                         |
| "Delete X"                  | `delete-item --id <id>`                                     |

## Rules

1. **All data lives in SQL.** No in-memory state.
2. **All AI goes through the agent chat.**
3. **Migrations are additive only.**
4. **Use shadcn/ui + Tabler icons** for any UI work.
5. **TypeScript everywhere.**
