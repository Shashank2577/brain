# Calendar

## Purpose

Google Calendar–backed event manager with public booking links, Zoom/Meet conferencing, availability rules, and a public per-slug booking page.

## Data model

`templates/calendar/server/db/schema.ts`:

- `bookings` — confirmed bookings from public booking pages (name, email, time range, slug, status).
- `booking_links` — ownable, shareable booking link definitions (duration, custom fields, conferencing config, color).
- `booking_slug_redirects` — old-slug → new-slug map for rename safety.
- `booking_usernames` — per-user username for `/book/:username/:slug` URLs.
- `booking_username_changes` — audit trail of username changes.
- `booking_link_shares` — per-user/org share grants for booking links.

Events are **not** stored — they are fetched from Google Calendar on every read.

## Capabilities

- `calendar.list-events` — query Google Calendar events in a date range.
- `calendar.search-events` — broad search across titles, attendees, locations, descriptions.
- `calendar.get-event` — fetch one event by id.
- `calendar.create-event` — create event (supports OOO/focus blocks, Zoom/Meet, attendees, recurrence).
- `calendar.update-event` — update an event or recurrence.
- `calendar.delete-event` — delete an event.
- `calendar.rsvp-event` — accept/decline/tentative on a meeting invite.
- `calendar.sync-google-calendar` — pull range into local cache.
- `calendar.search-people` — resolve attendees from Google Contacts/Directory.
- `calendar.get-zoom-status` — check Zoom OAuth connection.
- `calendar.get-availability` / `calendar.update-availability` — booking rules.
- `calendar.check-availability` — list free slots on a date.
- `calendar.list-booking-links` / `calendar.create-booking-link` / `calendar.duplicate-booking-link`.
- `calendar.list-bookings` — bookings made against this user's links.
- `calendar.add-external-calendar` / `calendar.list-external-calendars` / `calendar.remove-external-calendar` / `calendar.update-external-calendars` — overlay calendars.
- `calendar.get-overlay-people` / `calendar.update-overlay-people` — team overlay people.
- `calendar.get-settings` / `calendar.update-settings`.
- `calendar.update-calendar-visual-preferences` — local color mode, hide weekends.
- `calendar.navigate` / `calendar.view-screen`.

## UI routes

- `/` — main calendar (day/week/month).
- `/availability` — availability rules.
- `/booking-links` and `/booking-links/:id` — manage booking links.
- `/bookings` — list of received bookings.
- `/settings`, `/team`, `/extensions`.
- `/book/:slug`, `/book/:username/:slug`, `/meet/:username/:slug` — public booking pages.
- `/booking/manage/:token` — cancel/reschedule by token.
- `/event` — embeddable single-event card.

## Inter-app dependencies

None inside the template (no `appAction()` or `ctx.call()` invocations). Externally consumes Google Calendar, Google Contacts/Directory, and the Zoom API via `server/lib/zoom.ts`.

## Inter-app consumers

- **mail** — uses `call-agent --agent=calendar` for schedule context inside email triage.

## Status

Production-ready (visible in `packages/shared-app-config/templates.ts`, core: true).

## Known gaps

Bookings table is not yet wired into the framework's `ownable + shares` pattern (`booking_links` is; `bookings` is plain owner-keyed). `addGoogleMeet` / `addZoom` flags are documented but Zoom OAuth requires manual env setup.
