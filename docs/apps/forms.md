# Forms

## Purpose

Form builder with split-pane live preview, custom fields, public submission pages at `/f/:slug`, optional Cloudflare Turnstile captcha, and per-form response storage.

## Data model

`templates/forms/server/db/schema.ts`:

- `forms` — ownable, shareable form definition: title, description, slug, fields JSON, settings JSON, `status` enum (`draft` / `published` / `closed`), `deletedAt` (soft delete).
- `responses` — submission rows keyed by `formId`, with JSON `data` (`fieldId → value`), submitter email, IP.
- `form_shares` — per-user/org share grants.

## Capabilities

- `forms.view-screen` / `forms.navigate` / `forms.refresh-list`.
- `forms.list-forms` / `forms.get-form` / `forms.create-form` / `forms.update-form` / `forms.delete-form` / `forms.restore-form`.
- `forms.list-responses` / `forms.export-responses`.

## UI routes

- `/` and `/forms` — form list.
- `/forms/:id` — builder (split-pane preview + properties panel).
- `/forms/:id/responses` — response viewer.
- `/f/*` — public submission page (per slug; no auth).
- `/form-preview` — embedded preview iframe.
- `/team`, `/extensions`.

## Inter-app dependencies

None inside the template (no `appAction()` or `ctx.call()` invocations).

## Inter-app consumers

- **analytics** — `query-inbound-forms` action reads form response data for inbound-form dashboards.

## Status

Production-ready (core: true).

## Known gaps

Field types and validation are stored as opaque JSON; no shared schema definition is published outside the form-building skill. Soft-delete restore exists but the Archive view in `_app.forms._index.tsx` is the only way to reach archived forms. No webhook fan-out on submission yet.
