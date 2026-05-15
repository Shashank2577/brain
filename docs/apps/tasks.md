# Tasks

## Purpose

Tasks is a lightweight todo mini-app for the super-app shell. Its job is to be the simplest possible "capture a thing I need to do" surface — one-line entries, a checkbox, a date if you want one — and, more importantly, to demonstrate the inter-app linking pattern that makes the platform feel like one product instead of a folder full of apps. Any task can be promoted into a long-form note with one toggle (`alsoNote`), so a quick capture in tasks becomes a researchable note in the notes app without context-switching. Other apps (meetings, CRM, calendar) call `tasks.create` to surface their own action items in the same unified inbox, so the user has exactly one place to look for "what do I need to do."

## Data model

`templates/tasks/server/db/schema.ts`:

```ts
import {
  table,
  text,
  integer,
  ownableColumns,
  createSharesTable,
} from "@agent-native/core/db/schema";

export const tasks = table("tasks", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  // Nullable FK to a note in the notes app. Owned by the notes template;
  // we only store the id (no DB-level FK to avoid cross-template coupling).
  linkedNoteId: text("linked_note_id"),
  // ISO-8601 date or datetime. Stored as text for portability across SQLite /
  // Postgres / Turso. NULL means "no due date".
  dueDate: text("due_date"),
  // Coarse priority bucket. NULL means "unset / normal".
  priority: text("priority", { enum: ["low", "normal", "high", "urgent"] }),
  // ISO timestamp when completed; NULL while active. Drives the
  // active/completed filter and lets us record event timing without a
  // separate audit table.
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  ...ownableColumns(),
});

export const taskShares = createSharesTable("task_shares");
```

`ownableColumns()` adds `ownerEmail`, `ownerOrgId`, and `visibility` — every read goes through `accessFilter(schema.tasks, schema.taskShares)`, every write through `assertAccess("task", id, "editor" | "admin")`. No raw `db.select().from(tasks)` anywhere.

## Capabilities

All capabilities are `defineAction` exports under `templates/tasks/actions/`. Auto-mounted at `/_agent-native/actions/<name>` and registered as agent tools.

### `tasks.create`

Create a task. Preserves the `alsoNote` flag from the manifest — when true, calls `notes.create` (via the platform RPC, not direct import) with the task text as the note title and stores the returned `noteId` on the task row. Access role: any signed-in user (no `assertAccess`; user creates their own row).

```ts
input: z.object({
  text: z.string().min(1).max(500),
  alsoNote: z.boolean().default(false),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
}),
output: z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  linkedNoteId: z.string().nullable(),
  dueDate: z.string().nullable(),
  priority: z.string().nullable(),
}),
```

### `tasks.list`

List the caller's tasks. Access role: viewer (via `accessFilter`).

```ts
input: z.object({
  filter: z.enum(["active", "completed", "all"]).default("active"),
  limit: z.number().int().min(1).max(500).default(100),
}).optional(),
output: z.array(z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  completedAt: z.string().nullable(),
  linkedNoteId: z.string().nullable(),
  dueDate: z.string().nullable(),
  priority: z.string().nullable(),
})),
```

### `tasks.complete`

Mark a task done. Sets `completedAt = now()`. Idempotent (re-completing is a no-op). Access role: `editor`.

```ts
input: z.object({ id: z.string() }),
output: z.object({ id: z.string(), completed: z.literal(true), completedAt: z.string() }),
```

### `tasks.uncomplete`

Clear `completedAt`. Access role: `editor`.

```ts
input: z.object({ id: z.string() }),
output: z.object({ id: z.string(), completed: z.literal(false) }),
```

### `tasks.update`

Patch any of `text`, `dueDate`, `priority`, `linkedNoteId`. Access role: `editor`.

```ts
input: z.object({
  id: z.string(),
  text: z.string().min(1).max(500).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).nullable().optional(),
  linkedNoteId: z.string().nullable().optional(),
}),
output: z.object({ id: z.string(), updated: z.literal(true) }),
```

### `tasks.delete`

Hard delete. Access role: `admin`. Does not delete the linked note — that's user-explicit cleanup.

```ts
input: z.object({ id: z.string() }),
output: z.object({ id: z.string(), deleted: z.literal(true) }),
```

## UI surface

Route: `/tasks` (file-route `app/routes/tasks.tsx`). Single page, no nested routes.

- **Create bar (top):** single-line input pinned to the top. Enter submits. A small `link-2` icon toggle ("Also create a note") flips `alsoNote`. A calendar-date popover sets `dueDate`. A priority dropdown (low/normal/high/urgent) is collapsed behind a `…` button (progressive disclosure).
- **List:** rows grouped by date bucket (Overdue / Today / This week / Later / No date). Each row: shadcn `Checkbox` (inline complete/uncomplete with optimistic update), task text, due-date chip, priority dot, and a `link` icon when `linkedNoteId` is set that opens the linked note in the notes app via `navigate({ app: "notes", noteId })`.
- **Filter tabs:** shadcn `Tabs` for `active | completed | all`. Persisted to `application_state["tasks.filter"]`.
- **Row overflow menu:** shadcn `DropdownMenu` (`…`) for Edit, Delete, Open linked note. No custom popovers.
- **Agent sidebar:** the agent reads `navigation` (`{ view: "tasks", filter, selectedTaskId? }`) to know what the user is looking at. Selection lets the user say "complete this" / "link this to a note" / "due tomorrow" without naming the task.

## Inter-app dependencies

- **`notes.create`** — called when `alsoNote: true`. The platform RPC runs as the calling user, so the resulting note is owned by the user, not by tasks. Tasks stores the returned note id in `linkedNoteId`. If `notes.create` fails, the task is still created (the linking is best-effort) and the failure is returned in the response payload so the UI can toast it.
- **Future: `calendar.create-event`** — proposed capability. When a task has a `dueDate`, the user can promote it to a calendar event (`promoteToEvent` flag on `tasks.create`, or an explicit `tasks.scheduleReminder` capability). Not in v1.

## Inter-app consumers

- **Meetings** — `meetings.finalize-transcript` will call `tasks.create({ text, alsoNote: false })` for each extracted action item, tagging them with the meeting id via a future `sourceRef` column.
- **CRM** — activity entries (call follow-ups, send-quote reminders) surface as tasks. The CRM app calls `tasks.create` with the contact name embedded in the text.
- **Email** — "snooze to tasks" flow on a thread becomes `tasks.create({ text: subject, linkedNoteId: null })`.

These consumers all use the public capability surface — no shared DB access, no direct imports.

## Test plan

- [ ] **Unit — schema validation**: `tasks.create` rejects empty `text`, rejects `text` > 500 chars, rejects invalid `priority` strings, rejects malformed `dueDate`.
- [ ] **Unit — `tasks.create` with `alsoNote=true`**: stubs `notes.create` to return `{ id: "note_123" }`; asserts the task row's `linkedNoteId === "note_123"` and that `notes.create` was called with `{ title: input.text, body: "" }`.
- [ ] **Integration — `alsoNote=true` ownership**: runs against a real notes template with a known caller; after `tasks.create`, queries notes via `notes.get({ id: linkedNoteId })` and asserts the note's `ownerEmail === callingUser.email` (NOT the tasks app's identity) and the note title equals the task text.
- [ ] **Integration — `alsoNote=true` resilience**: makes `notes.create` throw; asserts the task is still created with `linkedNoteId: null` and the response carries a non-fatal warning.
- [ ] **Unit — `tasks.complete`**: asserts `completedAt` is set to a valid ISO string, an `analytics.track("task_completed", { id })` event is recorded, and a second call to `complete` is a no-op (same `completedAt`).
- [ ] **Unit — `tasks.uncomplete`**: asserts `completedAt` is `null` after the call.
- [ ] **Unit — `tasks.list` filter**: seeds 3 active + 2 completed tasks for user A; asserts `filter: "active"` returns 3, `filter: "completed"` returns 2, `filter: "all"` returns 5; asserts another user's tasks never leak (access filter test).
- [ ] **Unit — `tasks.update`**: patches `dueDate`, asserts only that column changes; patches `priority: null`, asserts the column is cleared.
- [ ] **Unit — `tasks.delete`**: asserts row is gone; asserts the linked note (if any) is NOT deleted.
- [ ] **Integration — access scoping**: user B cannot list, complete, update, or delete user A's tasks; assertions hit `ForbiddenError` for each verb.
- [ ] **E2E — create + complete flow**: Playwright opens `/tasks`, types "Buy milk", presses Enter, asserts the row appears optimistically before the network call resolves, clicks the checkbox, asserts the row moves to "Completed" and a database row has `completedAt` set.
- [ ] **E2E — `alsoNote` toggle**: toggles the link icon, creates a task, asserts a notes row exists with the same title and that clicking the link icon on the task row navigates to `/notes/<id>`.
- [ ] **E2E — agent flow**: agent runs `tasks.create({ text: "ship the spec", alsoNote: true, dueDate: "2026-05-20" })`; asserts both the task and note exist; agent then runs `tasks.complete({ id })`; the UI (polling) updates within 2s without a manual refresh.

## Migration from manifest

Delete `packages/fluid-os/examples/apps/tasks/manifest.ts`. The in-memory `Map<string, Task>` is discarded — no data migration needed; the manifest was demo state only.

Preserve from the manifest:

- The capability names (`tasks.create`, `tasks.list`, `tasks.complete`) and their public input/output contract — existing callers and the docs reference these names.
- The `alsoNote` flag semantics and the cross-app `ctx.call("notes.create", ...)` pattern — this is the load-bearing demo of inter-app composition.
- The `linkedNoteId` field name on the output shape.

Update `packages/fluid-os/examples/apps/index.ts` (if it imports `tasksApp`) to import from the new template's registered capability surface instead of the manifest. Add a redirect entry in the registry so any consumer still referencing `apps/tasks` resolves to `templates/tasks`.

---

⠀
🟢 Spec written to docs/apps/tasks.md
