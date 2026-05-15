# Slides

## Purpose

AI-driven presentation editor — generate, import, edit, comment on, and export decks. Slides are HTML rendered into a fixed 960×540 canvas; decks attach to a design system for tokens.

## Data model

`templates/slides/server/db/schema.ts`:

- `decks` — ownable, shareable deck with title + JSON `data` blob (slides[], aspect ratio).
- `deck_shares` — per-user/org share grants.
- `deck_versions` — automatic + manual deck snapshots for restore.
- `design_systems` — ownable, shareable design system (colors/fonts/spacing JSON, custom instructions).
- `design_system_shares` — share grants for design systems.
- `deck_share_links` — anonymous public share-link snapshots (token → slides JSON).
- `slide_comments` — per-slide threaded comments with quoted text + resolution.

## Capabilities

- `slides.view-screen` / `slides.navigate`.
- `slides.list-decks` / `slides.get-deck` / `slides.create-deck` / `slides.duplicate-deck`.
- `slides.add-slide` / `slides.update-slide` / `slides.update-deck-aspect-ratio`.
- `slides.list-deck-versions` / `slides.get-deck-version` / `slides.restore-deck-version`.
- `slides.list-slide-comments` / `slides.add-slide-comment`.
- `slides.generate-slides-ai` — full-deck AI generation.
- `slides.generate-image` / `slides.generate-image-api` / `slides.edit-image` / `slides.image-gen-status` / `slides.check-image-gen`.
- `slides.image-search` / `slides.search-images` / `slides.fetch-logos` / `slides.logo-lookup` / `slides.search-logos` / `slides.logo-config`.
- `slides.analyze-brand-assets` / `slides.create-design-system` / `slides.update-design-system` / `slides.get-design-system` / `slides.list-design-systems` / `slides.set-default-design-system` / `slides.apply-design-system`.
- `slides.import-file` / `slides.import-pptx` / `slides.import-docx` / `slides.import-document` / `slides.import-google-doc` / `slides.import-code` / `slides.import-github` / `slides.import-from-url` / `slides.import-design-project` / `slides.extract-pdf`.
- `slides.export-pptx` / `slides.export-google-slides` / `slides.export-html`.

## UI routes

- `/` — deck list.
- `/deck/:id` — editor.
- `/deck/:id/present` — presentation mode.
- `/design-systems` — DS list/editor.
- `/p/:id` — public deck view.
- `/share/:token` — anonymous share link view.
- `/slide` — embeddable single-slide preview.
- `/team`, `/extensions`.

## Inter-app dependencies

- **images** (hidden A2A agent) — `generate-image` delegates to `callAgent(IMAGES_A2A_URL, ...)` when configured, before falling back to direct Gemini/OpenAI.

## Inter-app consumers

- **dispatch** — A2A target for "create a deck about X" prompts from Slack/Telegram, replies with fully-qualified deck URL.
- **design** — shares the `design_systems` / `design_system_shares` table shape (independent rows).

## Status

Production-ready (core: true).

## Known gaps

Live multi-user collab via Yjs + TipTap is wired but per-deck channel naming is per-template. Aspect-ratio support beyond 16:9 / 1:1 / 9:16 / 4:5 is not enumerated. `analyze-brand-assets` requires web fetching credentials.
