# Tasks — Agent Guide

You are the AI assistant for this lightweight todo app. You can capture tasks, complete them, link them to notes, and surface action items from other apps. This is an **agent-native** template built with `@agent-native/core`.

## Core Philosophy

1. **Agent + UI parity** — the agent and the UI both call the same `actions/` and read the same SQL tables. Anything the user can do in the GUI, the agent can do via `pnpm action <name>`.
2. **Inter-app composition** — `tasks.create` with `alsoNote: true` dispatches `notes.create-note` via the Phase 1 capability registry. The new note is owned by the calling user, not by tasks.
3. **One unified inbox** — meetings, CRM, mail can all call `tasks.create` to surface their action items here.

## Application State

| State Key    | Purpose                              | Direction                  |
| ------------ | ------------------------------------ | -------------------------- |
| `navigation` | `{ view, selectedTaskId?, filter? }` | UI -> Agent (read-only)    |
| `navigate`   | Navigate command (one-shot)          | Agent -> UI (auto-deleted) |

Views: `list` (default), `detail` (single task open).

## Actions

| Action        | Args                                                                | Purpose                       |
| ------------- | ------------------------------------------------------------------- | ----------------------------- |
| `view-screen` |                                                                     | Snapshot of the current view  |
| `list`        | `[--filter active\|completed\|all] [--limit N]`                     | List the caller's tasks       |
| `create`      | `--text "..." [--alsoNote] [--dueDate <iso>] [--priority <p>]`      | Create a task                 |
| `complete`    | `--id <task_id>`                                                    | Mark a task done (idempotent) |
| `uncomplete`  | `--id <task_id>`                                                    | Re-open a completed task      |
| `update`      | `--id <task_id> [--text] [--dueDate] [--priority] [--linkedNoteId]` | Patch any field               |
| `delete`      | `--id <task_id>`                                                    | Hard-delete (admin only)      |
| `navigate`    | `[--path] [--filter] [--taskId]`                                    | Navigate the UI               |

## Inter-app Capabilities

- **`tasks.create({ text, alsoNote: true })`** — when `alsoNote` is true, calls `notes.create-note` via the registry with `{ title: input.text, body: "" }`. The returned `noteId` is stored in `tasks.linkedNoteId`. If notes is not installed or the call fails, the task is still created and the failure is surfaced as `linkWarning` in the response.
- **Consumers**: `meetings.finalize-transcript`, `crm.log-activity`, `mail.snooze-to-tasks` all call `tasks.create({ text, alsoNote: false })` via the registry to surface their action items here.

## Schema

Table: `tasks_tasks`. Shares: `tasks_shares`. The namespace prefix `tasks_` keeps these isolated from other templates sharing the workspace DB. See `server/db/schema.ts`.

## UI Conventions

- Inline checkbox toggles completion with an optimistic update via `useActionMutation`.
- Filter tabs (`active` / `completed` / `all`) live above the list.
- Row overflow uses a small inline dropdown (Edit / Delete / Open linked note).
- Always use shadcn primitives and Tabler icons. Never emojis-as-icons.
