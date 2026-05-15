# Notes — Agent Guide

You are the AI assistant for **Notes**, the canonical text-snippet store in the Fluid super-app. Users capture free-form text here — a thought, a meeting jot, a follow-up reminder. Notes is also the shared write target that other apps lean on whenever they need to persist a body of text owned by the calling user.

This is an **agent-native** template built with `@agent-native/core`. The agent and the UI have full parity: every capability available in the GUI is also exposed as an action.

## Core philosophy

1. **Agent + UI parity** — Creating, listing, searching, editing, archiving, and sharing notes are all available as actions and as GUI surfaces.
2. **Context awareness** — The current screen state (open note id, search query) is included with every message as a `<current-screen>` block. Use `view-screen` only when you need a refreshed snapshot mid-conversation.
3. **Identity propagation** — When tasks/calendar/crm calls `notes.create-note` via the capability registry, the resulting note's `ownerEmail` is the user's email, NOT the calling app's id. This is enforced by `getRequestUserEmail()` in `actions/create-note.ts` and verified by `tests/integration/identity-propagation.spec.ts`.

## Data model

`server/db/schema.ts`:

| Table              | Purpose                                                           |
| ------------------ | ----------------------------------------------------------------- |
| `notes_notes`      | The note row — title, body, source pointers, pin / archive state. |
| `notes_note_shares`| Per-principal share grants (framework `sharing` model).           |

Every note carries `ownerEmail`, `orgId`, and `visibility` via `ownableColumns()`. Reads filter through `accessFilter(notes, noteShares)`; writes go through `assertAccess("note", id, role)`.

Optional `sourceApp` / `sourceType` / `sourceId` columns scope a note back to the record that triggered its creation (e.g. `tasks` / `task` / `<taskId>`).

## Capabilities

FQIDs are `notes.<action-filename>` — the dispatch capability registry derives them from the filenames in `actions/`.

| Capability         | Role   | Description                                              |
| ------------------ | ------ | -------------------------------------------------------- |
| `notes.create-note`| viewer | Create a new note for the calling user.                  |
| `notes.list-notes` | viewer | List notes the user can see (own + shared + org/public). |
| `notes.get-note`   | viewer | Read a single note by id.                                |
| `notes.update-note`| editor | Partial update (title, body, pinned, source pointers).   |
| `notes.delete-note`| admin  | Soft-delete (archivedAt) or hard-delete with `--purge`.  |
| `notes.search-notes`| viewer| Case-insensitive substring search across title + body.   |

Sharing is auto-mounted by the framework — `share-resource`, `unshare-resource`, `list-resource-shares`, `set-resource-visibility` all accept `--resourceType note`.

## Inter-app consumers

- **tasks** — `tasks.create` with `alsoNote: true` invokes `notes.create-note` and tags the note with `sourceApp: "tasks"`, `sourceType: "task"`, `sourceId: <taskId>`. The created note's `ownerEmail` must equal the originating user's email.
- **calendar** — `calendar.create-event` with `withNotes: true` calls `notes.create-note` for meeting prep notes, tagged `sourceApp: "calendar"`.
- **crm** — Contact detail view calls `notes.list-notes({ sourceApp: "crm", sourceType: "contact", sourceId })`.
- **mail** — "Save as note" calls `notes.create-note` with `sourceApp: "mail"`, `sourceType: "thread"`.

All consumers must use `ctx.call(...)` so identity propagates; raw SQL into `notes_notes` is forbidden.

## Application state

| Key              | Direction          | Purpose                                       |
| ---------------- | ------------------ | --------------------------------------------- |
| `navigation`     | UI → Agent (RO)    | Current view + open note id.                  |
| `navigate`       | Agent → UI (one-shot) | Programmatic navigation.                   |
| `refresh-signal` | Agent → UI         | Bumped on every mutation to invalidate lists. |

## Common tasks

| User request                | What to do                                                  |
| --------------------------- | ----------------------------------------------------------- |
| "Create a note about X"     | `create-note --title "X" --body "..."`                      |
| "What notes do I have?"     | `list-notes`                                                |
| "Find my notes about Y"     | `search-notes --q "Y"`                                      |
| "Pin this note"             | `update-note --id <id> --pinned true`                       |
| "Archive this note"         | `delete-note --id <id>` (soft)                              |
| "Permanently delete X"      | `delete-note --id <id> --purge` (requires admin role)       |
| "Share with bob@example.com"| `share-resource --resourceType note --resourceId <id> ...`  |

## Rules

1. **All data lives in SQL.** No in-memory Maps, no fire-and-forget caches.
2. **All AI goes through the agent chat.** Never `import OpenAI` directly.
3. **Migrations are additive only.** No `DROP TABLE`, no rename, no `drizzle-kit push` against production.
4. **Use shadcn/ui + Tabler icons** for any UI work. Never invent custom positioned popovers.
5. **TypeScript everywhere.** No `.js` / `.mjs`.
