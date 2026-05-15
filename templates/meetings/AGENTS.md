# Meetings — Agent Guide

Meetings is an agent-native meeting lifecycle app inspired by Granola. The agent and UI are equal partners: creating meetings, capturing transcripts, finalizing AI summaries — everything is something both the user and the agent can do via the same actions, against the same SQL database, synced in real time by the framework's polling layer. This guide is how you (the agent) operate inside this app. See the root `AGENTS.md` for the framework-wide rules.

**Naming:** always call this app **"Meetings"** in user-facing strings.

**Core philosophy.** A meeting has three stages: prep (notes typed before/during), live (transcript streaming in), and finalized (AI summary + bullets + action items, fanned out to Notes and Tasks). Meetings owns the orchestration; calendar owns the event, notes owns the published summary, tasks owns the per-attendee follow-ups.

## The Meeting Lifecycle

1. **Create** — `meetings.create` (optionally `calendarEventId` to seed from calendar.get-event).
2. **Start transcript** — `meetings.start-transcript`. Source priority: native > whisper > manual.
3. **Stop transcript** — `meetings.stop-transcript`. Flips back to `scheduled` so finalize is reachable.
4. **Finalize** — `meetings.finalize`. Delegates to the agent chat (NEVER inline an LLM call here). The agent produces `{ summary, bullets, actionItems[] }`; this action then:
   - Inserts 3 `meeting_summaries` rows (one per kind).
   - Calls `notes.create-note` once with the summary as the body. Stores returned id in `meeting.linkedNoteId`.
   - Inserts one `meeting_followups` row per action item.
   - Calls `tasks.create` once per action item. Stores returned task id in `meeting_followups.taskId`.
   - Flips `meeting.status = "done"`.

## Inter-app surface

| Call                  | When                                       |
| --------------------- | ------------------------------------------ |
| `calendar.list-events`| List page upcoming section                 |
| `calendar.get-event`  | `meetings.create` with `calendarEventId`   |
| `notes.create-note`   | `meetings.finalize` — one note per meeting |
| `tasks.create`        | `meetings.finalize` — one task per action item |
| `tasks.complete`      | Right-pane checkbox in Action Items table  |
| `tasks.list`          | `meetings.list-action-items` join          |

## Actions

| Action                       | Purpose                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| `create`                     | Create a meeting (ad-hoc or from a calendar event).                     |
| `list`                       | List meetings; filter by `upcoming`/`past`/`all`.                       |
| `get`                        | Single meeting + transcript + summaries + attendees + followups.        |
| `update`                     | Patch title / startsAt / endsAt / prepNotes.                            |
| `start-transcript`           | Begin live transcription (native > whisper > manual).                   |
| `stop-transcript`            | End transcription; flip status back to scheduled.                       |
| `finalize`                   | The heavy one — delegates to agent chat, then fans out to notes + tasks. |
| `list-action-items`          | Followups across all visible meetings, with task completion joined.     |
| `navigate`                   | Write a one-shot navigation command to app state.                       |
| `view-screen`                | Snapshot of what the user is looking at.                                |
| `refresh-list`               | Bump refresh-signal so the UI invalidates its caches.                   |

## Data model

5 tables (see `server/db/schema.ts`):

| Table                | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `meetings`           | The core ownable resource (uses `ownableColumns()`).             |
| `meeting_shares`     | Framework share grants.                                          |
| `meeting_transcripts`| Live transcript segments + full text + source/status.            |
| `meeting_attendees`  | Attendee roster (seeded from calendar.get-event when available). |
| `meeting_summaries`  | 3 rows per finalize (summary | bullets | action_items).          |
| `meeting_followups`  | 1 row per action item; nullable `task_id` links to tasks app.    |

Access is checked on the parent `meetings` row only. Child tables scope by `meetingId`.

## Rules

1. **All AI goes through the agent chat.** Never `import OpenAI` / `@anthropic-ai/sdk`. `meetings.finalize` writes a delegation request to `application_state` and returns; the agent then calls back with the result.
2. **`notes.create` and `tasks.create` are the only cross-app writes.** Never reach into another template's DB.
3. **Idempotent finalize.** Rerunning `meetings.finalize` replaces the prior `meeting_summaries` + `meeting_followups` rows and best-effort cleans up the old `tasks` rows. The new `taskIds` should all be new.
4. **Graceful degradation.** When `notes.create` / `tasks.create` fail (sister app not installed, transient error), surface the failure as a non-fatal warning in the response, NOT a thrown error. The meeting still flips to `done`.
5. **Additive migrations only.** No `DROP`, `RENAME`, or destructive `ALTER`.
