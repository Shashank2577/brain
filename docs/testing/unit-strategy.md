# Unit Test Strategy

Unit tests cover **one module in isolation**, run in milliseconds, and never touch the network, real disk, or a real database. We use **Vitest** everywhere — both packages and templates ship a `vitest.config.ts` and a `"test": "vitest --run"` script. Every PR that adds an action, a schema, or a non-trivial pure function must add or extend a unit test alongside it.

## Layers under test

| Layer                          | What we assert                                                            | Mocking style                                   |
| ------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------- |
| Drizzle schema / Zod input     | Column shapes, defaults, enum coercion, `safeParse` for action inputs     | None — pure                                     |
| Pure libs (`shared/*`, `lib/*`) | Behavior of helpers (URL builders, markdown, signature, aspect ratios)    | None — pure                                     |
| Action handlers (`actions/*`)   | Validation, access checks, DB calls, returned payload                     | `vi.mock` for DB + sharing + app-state          |
| React components                | Rendering, key interactions, accessibility hooks                          | `@testing-library/react` + jsdom env            |

## Schema validation

Each action defines a Zod `schema` and a static `tool.parameters`. Pin the **contract** so renames or accidental requireds break the build, not the wire protocol.

```ts
// templates/clips/actions/create-recording.test.ts
it("does not require spaceIds for recorder clients", () => {
  const parsed = createRecording.schema.safeParse({
    title: "Screen recording - 12 May 2026",
    titleSource: "context",
    visibility: "public",
    hasCamera: true,
    hasAudio: true,
  });
  expect(parsed.success).toBe(true);
  expect(createRecording.tool.parameters.required ?? []).not.toContain("spaceIds");
});
```

Drizzle tables that ship `ownableColumns()` get a small fixture-style test asserting `owner_email`, `org_id`, and `visibility` are present with the right defaults — these columns are load-bearing for the sharing guards.

## Pure function tests

Co-located with the source. Use these as documentation:

```ts
// templates/slides/shared/aspect-ratios.test.ts
it("16:9 keeps the historical 960x540 / LAYOUT_WIDE inches", () => {
  expect(ASPECT_RATIOS["16:9"].width).toBe(960);
  expect(ASPECT_RATIOS["16:9"].pptxInches).toEqual({ w: 13.33, h: 7.5 });
});
```

Anything in `templates/*/shared/` and `packages/core/src/*/` that doesn't import a route, a DB connection, or React is fair game: `notion-markdown`, `og-description`, `markdown`, `signature`, `aspect-ratios`, `dispatch-css`, `catch-all-target`, `overview-chat`.

## Action handler tests (mocked DB)

Every action gets at least one test. The proven pattern hoists fake Drizzle chain functions and mocks `getDb`, `assertAccess`, `writeAppState`, and any handler the action calls.

```ts
// templates/slides/actions/list-decks.test.ts
const orderByFn = vi.fn(async () => deckRows);
const whereFn = vi.fn(() => ({ orderBy: orderByFn }));
const fromFn = vi.fn(() => ({ where: whereFn }));
const selectFn = vi.fn(() => ({ from: fromFn }));
const mockDb = { select: selectFn };

vi.mock("../server/db/index.js", () => ({
  getDb: () => mockDb,
  schema: { decks: { updatedAt: "updated_at_col" }, deckShares: {} },
}));
vi.mock("@agent-native/core/sharing", () => ({ accessFilter: () => ({ allowed: true }) }));

import action from "./list-decks";

it("returns canonical deck URLs for A2A artifact verification", async () => {
  vi.stubEnv("APP_URL", "https://slides.agent.test");
  const result = await action.run({});
  expect(result.decks[0]).toMatchObject({
    id: "deck_123",
    url: "https://slides.agent.test/deck/deck_123",
  });
});
```

Rules:

- **No real DB** at the unit layer — that's the integration tier.
- **Always mock `@agent-native/core/sharing`** so the unit test focuses on the action's own logic. Coverage of `accessFilter` / `assertAccess` lives in `packages/core/src/sharing/access.spec.ts`.
- Use `vi.stubEnv("APP_URL", ...)` for any test that touches URL builders (`list-decks`, `share-resource`, `_app-url`).
- One file per action: `actions/<name>.test.ts` — co-located.

## Component tests

Use `@testing-library/react` with jsdom. Keep the surface narrow: render → fire one interaction → assert. The framework's theme provider needs a tiny shim (see `packages/core/src/client/theme.spec.ts` — known flaky around `localStorage.clear`; setting `vi.stubGlobal("localStorage", { clear: vi.fn(), ... })` in `beforeEach` makes it deterministic).

Targets worth covering today:

- `app/components/ui/dropdown-menu.tsx` consumers — confirm we use shadcn primitives, not custom positioning.
- Editor surfaces with imperative APIs (slide editor selection, dispatch composer).
- Empty states and error boundaries.

## Coverage target & conventions

- **80%** statement coverage on `actions/`, `shared/`, `lib/`, and `server/lib/` in every template. **90%** on `packages/core/src/sharing/`.
- **No coverage gate on `app/routes/`** — those run in the e2e tier.
- File naming: `*.test.ts` is the default; `*.spec.ts` is also accepted (Vitest config includes both).
- Co-located, **not** centralized — `templates/slides/actions/get-deck.test.ts` lives next to `get-deck.ts`. Cross-cutting framework tests live under `packages/core/src/<area>/*.spec.ts`.
- Reach for **`describe` per surface**, **`it` per behavior** — match the existing slides / clips / core tests so the verifier hook can grep for new test names by feature.

Run the whole tier from the root: `pnpm test` (already wired to `core`, `docs`, and `dispatch`); per-template: `pnpm --filter slides test`.
