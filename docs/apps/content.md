# Content

## Purpose

Notion-like document editor with a nested document tree, version history, threaded comments, public share routes, and bidirectional Notion page sync.

## Data model

`templates/content/server/db/schema.ts`:

- `documents` — ownable, shareable doc with `parentId` (nesting), title, content (markdown), icon, `position`, `isFavorite`.
- `document_versions` — pre-edit snapshots for restore.
- `document_comments` — threaded comments with quoted text, resolution, optional `notionCommentId` mirror.
- `document_sync_links` — Notion sync state per doc: provider, remote page id, last pull/push timestamps, conflict flag, error log.
- `document_shares` — per-user/org share grants.

## Capabilities

- `content.view-screen` / `content.navigate` / `content.refresh-list`.
- `content.list-documents` / `content.search-documents` / `content.get-document` / `content.create-document` / `content.update-document` / `content.edit-document` / `content.delete-document` / `content.move-document`.
- `content.list-comments` / `content.add-comment`.
- `content.connect-notion-status` — check Notion OAuth.
- `content.list-notion-links` / `content.link-notion-page` / `content.pull-notion-page` / `content.push-notion-page` / `content.sync-notion-comments`.

## UI routes

- `/` — document tree home.
- `/page` and `/page/:id` — document editor (private, app shell).
- `/:id` — direct doc deep link.
- `/p/:id` — public-share read-only view.
- `/team`, `/extensions`.

## Inter-app dependencies

None inside the template (no `appAction()` or `ctx.call()` invocations). Externally consumes Notion API for the sync layer.

## Inter-app consumers

- **dispatch** — A2A target for "draft a doc about X" prompts; the agent guide explicitly instructs replying with `/page/<id>` (private) or `/p/<id>` (public) URLs.

## Status

Production-ready (core: true).

## Known gaps

Notion sync conflicts are surfaced via `hasConflict` flag but no UI resolution helper exists yet. The `documentVersions` table has no automatic GC. Real-time collaborative editing via Yjs is documented in the `real-time-collab` framework skill but not wired into the editor here.
