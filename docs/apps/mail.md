# Mail

## Purpose

Gmail-backed email client with keyboard shortcuts, AI triage, compose drafts, queued drafts for teammate review, Gmail filters, open/click tracking, and Calendar A2A delegation.

## Data model

`templates/mail/server/db/schema.ts`:

- `scheduled_jobs` — snooze / send-later jobs with `runAt` timestamp.
- `contact_frequency` — per-recipient send/receive counters powering `find-contact`.
- `automation_rules` — natural-language conditional rules (Mail + Calendar domains).
- `email_tracking` — pixel-based open tracking per sent message.
- `email_link_tracking` — per-link click tracking, joined by `pixel_token`.
- `queued_email_drafts` — org-scoped drafts queued by one teammate for another to review/send.

Email contents themselves come from Gmail API; local fallback uses the framework settings store key `local-emails`.

## Capabilities

- `mail.view-screen` / `mail.view-composer` / `mail.navigate` / `mail.refresh-list`.
- `mail.list-emails` / `mail.search-emails` / `mail.get-email` / `mail.get-thread`.
- `mail.archive-email` / `mail.trash-email` / `mail.mark-read` / `mail.move-email` / `mail.star-email`.
- `mail.send-email` / `mail.cancel-scheduled-email` / `mail.send-scheduled-email-now`.
- `mail.bulk-archive` / `mail.export-emails`.
- `mail.get-mail-settings` / `mail.update-mail-settings` / `mail.import-gmail-signature`.
- `mail.manage-draft` (create/update/delete compose drafts).
- `mail.queue-email-draft` / `mail.list-queued-drafts` / `mail.update-queued-draft` / `mail.open-queued-draft` / `mail.send-queued-drafts`.
- `mail.list-org-members`.
- `mail.manage-gmail-filters` (list/create/replace/delete native Gmail filters).
- `mail.manage-automations` / `mail.trigger-automations` — natural-language rules.
- `mail.get-tracking` — open + click stats for a sent message.
- `mail.find-contact` — name → email from Contacts + history.
- `mail.get-hubspot-contact` — CRM enrichment for sender.
- `mail.respond-calendar-invite` — accept/decline embedded invites.
- `mail.bootstrap-watches` — Gmail push notification setup.
- `mail.request-code-change` — surface code-change requests through agent chat.

## UI routes

- `/` and `/:view` — inbox / starred / sent / trash (label-scoped lists).
- `/:view/:threadId` — open thread.
- `/draft-queue` and `/draft-queue/:id` — org draft review queue.
- `/email` — embeddable single-thread preview iframe.
- `/settings`, `/team`, `/extensions`.

## Inter-app dependencies

- **calendar** — `mail.AGENTS.md` documents using `call-agent --agent=calendar` for "did I miss the meeting?" style questions; `respond-calendar-invite` action handles embedded invite RSVPs.

## Inter-app consumers

- **dispatch** — Slack/Telegram intake calls `queue-email-draft` to ask a human teammate to send on someone else's behalf (documented in `mail.CLAUDE.md`).

## Status

Production-ready (core: true).

## Known gaps

`automation_rules` is shared across mail/calendar domains but the trigger surface only lives in mail. HubSpot integration is read-only and opt-in (`HUBSPOT_TOKEN`). Multi-account search is the default but `--account` scoping isn't surfaced in the UI.
