# <Name> — Agent Guide

This is an **agent-tool** template — the ADR-001 exception case for
"agentic service mini-apps." Backend-heavy with minimal UI; the value
lives in the capability surface other apps invoke via A2A / `ctx.call`.

## Capabilities

| Capability             | Role   | Description                                  |
| ---------------------- | ------ | -------------------------------------------- |
| `<name>.run-task`      | viewer | Run an agent-tool task; records the result.  |
| `<name>.list-tasks`    | viewer | List previously-run tasks for the user.      |

Sharing is auto-mounted by the framework — `share-resource`,
`unshare-resource`, `list-resource-shares`, `set-resource-visibility` all
accept `--resourceType <name>-item`.

## Data model

| Table                  | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `<name>_items`         | Recorded task — input, metadata, owner.  |
| `<name>_item_shares`   | Per-principal share grants.              |

## Rules

1. **All data lives in SQL.**
2. **All AI goes through the agent chat.**
3. **Migrations are additive only.**
4. **Use shadcn/ui + Tabler icons** for any UI work.
5. **TypeScript everywhere.**
