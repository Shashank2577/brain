# Design

## Purpose

Interactive design/prototyping tool that generates complete self-contained Alpine.js + Tailwind HTML prototypes rendered in a sandboxed iframe. Each design is a multi-file project with version snapshots and design-system tokens.

## Data model

`templates/design/server/db/schema.ts`:

- `designs` — ownable, shareable design project: title, description, JSON `data` blob, `projectType`, optional `designSystemId`.
- `design_shares` — per-user/org share grants.
- `design_systems` — ownable design system (colors, typography, assets, custom instructions). Shares structure with the Slides DS table but is a separate row set.
- `design_system_shares` — DS share grants.
- `design_files` — multiple files per design (HTML/CSS/JS), keyed by `designId`.
- `design_versions` — labeled snapshots of design state.

## Capabilities

- `design.view-screen` / `design.navigate`.
- `design.list-designs` / `design.get-design` / `design.create-design` / `design.update-design` / `design.duplicate-design` / `design.delete-design`.
- `design.generate-design` — AI generation flow.
- `design.list-files` / `design.create-file` / `design.update-file` / `design.delete-file`.
- `design.list-design-systems` / `design.get-design-system` / `design.create-design-system` / `design.update-design-system` / `design.set-default-design-system` / `design.delete-design-system`.
- `design.analyze-brand-assets` — gather brand data (website / company name / notes).
- `design.import-code` / `design.import-design-project` / `design.import-document` / `design.import-figma` / `design.import-from-url` / `design.import-github`.
- `design.export-html` / `design.export-pdf` / `design.export-zip` / `design.export-coding-handoff`.

## UI routes

- `/` — design list.
- `/design/:id` — editor.
- `/design-systems` and `/design-systems/setup` — DS list + onboarding.
- `/examples` — example gallery.
- `/present/:id` — present mode.
- `/observability` — local agent traces.
- `/settings`, `/team`, `/extensions`.

## Inter-app dependencies

- **images** (hidden A2A agent) — `design.AGENTS.md` instructs delegating real raster imagery generation via `call-agent --agent=images`; placeholders use solid colors / SVG patterns only.

## Inter-app consumers

None observed in the current templates.

## Status

Production-ready (core: true).

## Known gaps

Figma import (`import-figma.ts`) and GitHub import (`import-github.ts`) require external credentials. The design-system schema duplicates Slides' — no shared package yet. Export-coding-handoff produces a static bundle; no React/Vue codegen.
