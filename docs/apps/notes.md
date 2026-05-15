# Notes

## Purpose

Notes is the canonical text-snippet store inside the fluid-os super-app. It is the lowest-friction surface for capturing free-form text — a thought, a meeting jot, a follow-up reminder — and it is also the shared write target that other apps lean on whenever they need to persist a body of text owned by the calling user. Tasks already calls `notes.create` when `alsoNote: true`; calendar will call it for meeting notes; CRM will call `notes.list` to pull contact-scoped notes. Notes therefore behaves both as a first-class end-user app (list, search, edit) and as a horizontal capability the rest of the OS composes against.

## Data model

Drizzle schema, single table plus shares. Follows the standard `ownableColumns()` + `createSharesTable()` pattern used by every other template. File: `templates/notes/server/db/schema.ts`.

```ts
import {
  table,
  text,
  integer,
  now,
  ownableColumns,
  createSharesTable,
} from "@agent-native/core/db/schema";

export const notes = table("notes", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Untitled"),
  body: text("body").notNull().default(""),
  // Optional context pointers other apps can use to scope notes back to a
  // source record without forcing a separate join table. `null` for free notes.
  sourceApp: text("source_app"), // e.g. "tasks", "calendar", "crm"
  sourceType: text("source_type"), // e.g. "task", "event", "contact"
  sourceId: text("source_id"),
  pinned: integer("pinned").notNull().default(0),
  archivedAt: text("archived_at"),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
  ...ownableColumns(),
});

export const noteShares = createSharesTable("note_shares");
```

`ownableColumns()` supplies `ownerEmail`, `orgId`, `visibility`, `deletedAt`. Every read goes through `accessFilter(schema.notes, schema.noteShares)`; every write goes through `assertAccess("note", id, "editor" | "admin")`.

## Capabilities

FQIDs are `notes.<verb>`. All handlers run inside `runWithRequestContext({ userEmail, orgId }, ...)`; the caller's identity is `ctx.user`, never the calling app's id (the OS invariant verified in PLAN.md). All schemas live alongside the action under `templates/notes/actions/`.

### `notes.create` — viewer

Creates a new note for the calling user. Preserved from the manifest; extended with optional source pointers + tags.

```ts
input: z.object({
  title: z.string().min(1),
  body: z.string().default(""),
  sourceApp: z.string().optional(),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  pinned: z.boolean().optional(),
});
output: z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  sourceApp: z.string().nullable(),
  sourceType: z.string().nullable(),
  sourceId: z.string().nullable(),
  pinned: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  ownerEmail: z.string(),
});
```

### `notes.list` — viewer

Lists notes the current user can see (own + shared + org/public per visibility). Preserved from the manifest; extended with filters.

```ts
input: z.object({
  sourceApp: z.string().optional(),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().default(false),
  limit: z.number().int().positive().max(200).default(50),
}).partial();
output: z.array(/* same shape as create output, minus body for list view */);
```

### `notes.search` — viewer

Case-insensitive substring search across title and body. Preserved from the manifest; extended to also scan body and return snippets.

```ts
input: z.object({ q: z.string().min(1), limit: z.number().int().positive().max(50).default(20) });
output: z.array(z.object({ id: z.string(), title: z.string(), snippet: z.string() }));
```

### `notes.get` — viewer

Read a single note by id. Resolves access via `resolveAccess("note", id)`; 404 if not visible, 403 if explicitly forbidden.

```ts
input: z.object({ id: z.string() });
output: /* full note shape, including body */;
```

### `notes.update` — editor

Partial update of title, body, pinned, or source pointers. Gated by `assertAccess("note", id, "editor")`.

```ts
input: z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  pinned: z.boolean().optional(),
});
output: /* full updated note */;
```

### `notes.delete` — admin

Soft-delete (sets `archivedAt`). `--purge` flag hard-deletes. Gated by `assertAccess("note", id, "admin")`.

```ts
input: z.object({ id: z.string(), purge: z.boolean().default(false) });
output: z.object({ id: z.string(), deleted: z.literal(true) });
```

## UI surface

React Router routes inside `templates/notes/app/routes/`:

- `/notes` — list view. Two-column shadcn layout: left rail with note cards (title, snippet, timestamp, pinned indicator), right pane with selected note. Empty state shows one CTA: "New note".
- `/notes/new` — opens the editor with a fresh draft (client-side id, optimistic insert).
- `/notes/:id` — editor pane. Markdown body via the same Yjs-backed editor primitive used by content. Title is an inline text field. Pin/archive/share live in a `⋯` `DropdownMenu`. Save is debounced and optimistic.
- `/notes/search?q=...` — search results route, fed by `notes.search`. Drives the global `Cmd+K` lookup the shell exposes.

Key components: `NoteList`, `NoteCard`, `NoteEditor`, `NoteEditorToolbar`, `NoteSearchResults`. All standard surfaces use shadcn primitives (`DropdownMenu`, `Popover`, `Dialog`, `AlertDialog` for delete confirm) and Tabler icons. The agent sidebar uses `view-screen` to surface the current `noteId` plus selection; agent edits flow through `notes.update` and stream via the Yjs CRDT so the user sees the changes live.

## Inter-app dependencies

None today. Notes is a leaf capability — it does not call into other apps. Flag for future: if we add `notes.attach-from-clipboard` and the clipboard contains a URL preview, we may want `previews.fetch` (does not exist yet); do not add the dependency until that app exists.

## Inter-app consumers

- **tasks** — `tasks.create` with `alsoNote: true` invokes `notes.create` via `ctx.call("notes.create", { title, body, sourceApp: "tasks", sourceType: "task", sourceId })`. Returns `linkedNoteId`. Identity propagation invariant: the resulting `notes` row must have `ownerEmail == caller.user.email`, never the tasks app's id.
- **calendar** — `calendar.create-event` will optionally call `notes.create` for meeting prep notes when `withNotes: true`, tagging `sourceApp: "calendar"`, `sourceType: "event"`, `sourceId: <eventId>`.
- **crm** — `crm.list-contacts` and the contact detail view will call `notes.list({ sourceApp: "crm", sourceType: "contact", sourceId })` to surface contact-scoped notes inline.
- **mail** — will call `notes.create` when the user clicks "Save as note" on a thread, tagging `sourceApp: "mail"`, `sourceType: "thread"`.

All consumers must use `ctx.call(...)` so identity propagates; none may bypass the capability layer with raw SQL into the `notes` table.

## Test plan

Unit (Vitest, per-handler):

- [ ] `notes.create` returns a row with `ownerEmail == ctx.user.email` and `id` generated server-side (not client-supplied).
- [ ] `notes.create` rejects when `title` is empty.
- [ ] `notes.list` excludes archived rows by default; includes them when `archived: true`.
- [ ] `notes.list` filters by `sourceApp / sourceType / sourceId` exact match.
- [ ] `notes.search` matches case-insensitive substring on both title and body; returns snippet.
- [ ] `notes.get` 404s on a note owned by another user with no share grant.
- [ ] `notes.get` 200s on a note shared to the caller with role `viewer`.
- [ ] `notes.update` rejects a `viewer` share and accepts an `editor` share.
- [ ] `notes.delete` (soft) sets `archivedAt`; `notes.delete --purge` requires `admin` and removes the row.

Integration (boots the fluid-os host + notes app):

- [ ] **Identity propagation**: `tasks.create` with `alsoNote: true` triggers `notes.create`; assert the created note's `ownerEmail` equals the caller's user, **not** `app:tasks`. (This is the OS invariant — failing this test blocks ship.)
- [ ] **Cross-user isolation**: user A creates a note; user B's `notes.list` does not return it; user B's `notes.get` 404s.
- [ ] **Cross-app source filter**: `crm.contact.notes` (which calls `notes.list({ sourceApp: "crm", sourceType: "contact", sourceId })`) returns only notes tagged for that contact.
- [ ] **Sharing round-trip**: user A shares a note with user B as `editor`; B can `update`; A revokes; B's `update` then 403s.
- [ ] **Visibility=public**: a public note is reachable by `notes.get` for any signed-in user but does not appear in their `notes.list` (matches `accessFilter` default).
- [ ] **Persistence**: restart the host between `notes.create` and `notes.list` — the note survives. (Replaces the in-memory Map of the manifest.)

E2E (Playwright in the shell at 4100):

- [ ] Sign in, create a note via `/notes/new`, verify it renders in the list pane.
- [ ] Edit body, navigate away, return — body is persisted.
- [ ] Search from `Cmd+K` finds the note by body substring.
- [ ] Archive → note vanishes from default list, appears under `Archived` filter.
- [ ] Agent sidebar: ask "create a note about X"; assert a new note appears optimistically and the agent confirms with the created id.

## Migration from manifest

1. Scaffold `templates/notes/` from the `starter` template via the existing CLI (`pnpm --filter @agent-native/core create-app notes`). This produces `server/db/schema.ts`, `actions/`, `app/routes/`, `wrangler-notes.toml`, `.env.local`, and the React Router root.
2. Replace the scaffolded schema with the Drizzle definition above. Register `notes` and `noteShares` via `registerShareableResource({ type: "note", resourceTable: notes, sharesTable: noteShares, allowPublic: true })`.
3. Port each manifest capability to a `defineAction` file: `actions/create-note.ts`, `actions/list-notes.ts`, `actions/search-notes.ts`. Add `actions/get-note.ts`, `actions/update-note.ts`, `actions/delete-note.ts`. Each reads/writes through `getDb()` with `accessFilter` / `assertAccess`. Preserve the public capability ids (`notes.create`, `notes.list`, `notes.search`) by mapping action filenames in `templates/notes/app/manifest.ts` (the per-template manifest the fluid-os registry derives from).
4. Run migrations on app install via the template's `server/plugins/db.ts` `runMigrations` (additive SQL only — no `drizzle-kit push` against prod; per CLAUDE.md).
5. Add `templates/notes/CLAUDE.md` modeled on the content/forms guides (resources, application state keys, action table, common tasks).
6. Register `wrangler-notes.toml` in the workspace and add `notes` to the public template allow-list (`packages/shared-app-config/templates.ts` and `packages/core/src/cli/templates-meta.ts`) only if we intend to ship it as a public template; otherwise leave `hidden: true`.
7. Delete `packages/fluid-os/examples/apps/notes/manifest.ts` and remove its registration from `packages/fluid-os/examples/apps/index.ts`. Add the new `templates/notes/` to the fluid-os app loader so its derived capability registry lists `notes.create`, `notes.list`, `notes.search`, `notes.get`, `notes.update`, `notes.delete`.
8. Re-run the inter-app scenarios in PLAN.md Phase 2 (`tasks.create alsoNote=true`, multi-hop chains) and confirm all green before closing.

---

⠀
🟢 Implemented the requested change
