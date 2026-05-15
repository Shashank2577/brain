# <Name> — Agent Guide

This is a **dashboard** agent-native template — a grid of metric cards
backed by a single read-only `list-metrics` action.

## Capabilities

| Capability             | Role   | Description                                  |
| ---------------------- | ------ | -------------------------------------------- |
| `<name>.list-metrics`  | viewer | List metric cards on the dashboard.          |

Sharing is auto-mounted by the framework — `share-resource`,
`unshare-resource`, `list-resource-shares`, `set-resource-visibility` all
accept `--resourceType <name>-item`.

## Data model

| Table                  | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `<name>_items`         | Each row is one metric card.             |
| `<name>_item_shares`   | Per-principal share grants.              |

Wire your real data sources by writing rows into `<name>_items` or by
adding new actions that read from other apps via `ctx.call(...)`.

## Rules

1. **All data lives in SQL.**
2. **All AI goes through the agent chat.**
3. **Migrations are additive only.**
4. **Use shadcn/ui + Tabler icons** for any UI work.
5. **TypeScript everywhere.**
