# Clips

## Purpose

Screen-recording / meeting-notes / dictation app — captures recordings via MediaRecorder, transcribes them, and runs AI passes for titles / summaries / chapters / filler removal. Includes calendar-backed live meetings (Granola-style) and press-and-hold dictation history.

## Data model

`templates/clips/server/db/schema.ts`:

- `organization_settings` — Clips-specific sidecar to framework `organizations` (brand color, logo, default visibility).
- Legacy: `workspaces`, `workspace_members`, `invites` — kept only for backfill into the framework org primitive.
- `spaces` / `space_members` — topic spaces inside an org.
- `folders` — library folders (nestable, space-scoped or personal).
- `recordings` — ownable, shareable core resource: title, video URL/format/size, duration, edits/chapters JSON, password, expiry, viewer flags.
- `recording_shares` — share grants.
- `recording_tags` / `recording_transcripts` / `recording_ctas`.
- `recording_comments` (timestamped + threaded) / `recording_reactions` (timestamped emoji).
- `recording_viewers` / `recording_events` — granular per-viewer analytics.
- `clips_meetings` — calendar-backed or ad-hoc meeting (linked to recording + calendar event).
- `meeting_shares` / `meeting_participants` / `meeting_action_items`.
- `calendar_accounts` / `calendar_account_shares` / `calendar_events` — OAuth-connected calendar overlay (Google / iCloud / Microsoft); tokens stored in `app_secrets`.
- `clips_dictations` — press-and-hold dictation sessions.
- `dictation_shares` / `clips_vocabulary` / `vocabulary_shares` — per-user vocabulary corrections.

## Capabilities

- `clips.view-screen` / `clips.navigate` / `clips.refresh-list` / `clips.hello`.
- Recording CRUD: `clips.create-recording` / `clips.update-recording` / `clips.move-recording` / `clips.archive-recording` / `clips.trash-recording` / `clips.restore-recording` / `clips.delete-recording-permanent` / `clips.list-recordings` / `clips.search-recordings` / `clips.tag-recording` / `clips.add-recording-to-space` / `clips.set-thumbnail` / `clips.get-recording-player-data`.
- Editing: `clips.trim-recording` / `clips.split-recording` / `clips.stitch-recordings` / `clips.set-chapters` / `clips.clear-edits` / `clips.undo-edit` / `clips.remove-filler-words` / `clips.remove-silences`.
- Finalize / AI: `clips.finalize-recording` / `clips.regenerate-title` / `clips.regenerate-summary` / `clips.regenerate-chapters` / `clips.request-transcript` / `clips.save-browser-transcript` / `clips.cleanup-transcript` / `clips.generate-workflow`.
- CTAs: `clips.create-cta` / `clips.update-cta` / `clips.delete-cta`.
- Comments / reactions: `clips.add-comment` / `clips.reply-to-comment` / `clips.react-to-comment` / `clips.react-to-recording` / `clips.resolve-comment` / `clips.delete-comment` / `clips.list-comments`.
- Orgs / spaces / folders / invites: `clips.create-organization` / `clips.invite-member` / `clips.accept-invite` / `clips.decline-invite` / `clips.get-invite` / `clips.remove-member` / `clips.update-member-role` / `clips.set-organization-branding` / `clips.create-space` / `clips.rename-space` / `clips.delete-space` / `clips.add-space-member` / `clips.remove-space-member` / `clips.create-folder` / `clips.rename-folder` / `clips.delete-folder` / `clips.list-organization-state` / `clips.list-notifications`.
- Insights: `clips.get-recording-insights` / `clips.list-viewers` / `clips.get-organization-insights` / `clips.export-insights-csv`.
- Meetings: `clips.create-meeting` / `clips.update-meeting` / `clips.get-meeting` / `clips.delete-meeting` / `clips.list-meetings` / `clips.start-meeting-recording` / `clips.stop-meeting-recording` / `clips.finalize-meeting`.
- Calendar: `clips.connect-calendar` / `clips.disconnect-calendar` / `clips.list-calendar-accounts` / `clips.sync-calendars`.
- Dictate: `clips.create-dictation` / `clips.update-dictation` / `clips.list-dictations` / `clips.cleanup-dictation` / `clips.add-vocabulary-term` / `clips.list-vocabulary`.

## UI routes

- `/` and `/library`, `/library/folder/:folderId` — library.
- `/spaces`, `/spaces/:spaceId`, `/spaces/:spaceId/folder/:folderId`.
- `/meetings` and `/meetings/:meetingId`.
- `/dictate` / `/wispr` — dictation tab.
- `/insights` / `/notifications` / `/archive` / `/trash`.
- `/r/:recordingId` — player.
- `/share/:shareId` and `/embed/:shareId` — public share + embed.
- `/record` — recording entry.
- `/invite/:token` — accept invite.
- `/download` — desktop app downloader.
- `/settings`, `/settings/organization`, `/extensions`.

## Inter-app dependencies

None inside the template (no `appAction()` or `ctx.call()` invocations).

## Inter-app consumers

None observed in the current templates.

## Status

Production-ready (core: true).

## Known gaps

Calendar overlay duplicates the calendar app's domain (separate `calendar_accounts` + `calendar_events` tables); no shared package. Workspace migration leaves the legacy `workspaces` table around for backfill. Desktop app integration for native dictation and audio capture is template-internal — no API surface for third parties.
