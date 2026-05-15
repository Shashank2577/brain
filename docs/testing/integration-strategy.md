# Integration Test Strategy

Integration tests prove that **two or more real layers** cooperate correctly. We swap the mocks for a real SQLite database, real Drizzle migrations, real Better Auth session resolution, and a real `runWithRequestContext` boundary. Everything else (third-party HTTP, OpenAI, Builder.io, Whisper) stays mocked.

We use Vitest as the runner — the same `pnpm --filter <pkg> test` invocation picks up `*.spec.ts` files that opt into integration mode. Integration tests are slower (50–500 ms each) but still complete in under a minute per template.

## Ephemeral SQLite per test file

Drizzle is dialect-agnostic — production runs on Neon Postgres, but for integration we use `better-sqlite3` in `:memory:` or `file:` mode. The proven setup lives in `packages/core/src/sharing/access.spec.ts`.

```ts
// packages/core/src/sharing/access.spec.ts
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

beforeEach(() => {
  sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE qa_docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      owner_email TEXT NOT NULL,
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'private'
    );
    /* ... */
  `);
  db = drizzle(sqlite);
  registerShareableResource({
    type: "qa-doc",
    resourceTable: docs,
    sharesTable: docShares,
    displayName: "QA Doc",
    titleColumn: "title",
    getDb: () => db,
  });
});

afterEach(() => sqlite.close());
```

For per-template integration suites, use a **temp-dir file DB** so multiple workers don't collide and so a debugger can inspect the file post-mortem:

```ts
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "an-int-"));
const dbPath = path.join(tmp, "test.sqlite");
process.env.DATABASE_URL = `file:${dbPath}`;

// Re-run the real plugin migrations so the schema matches production.
await runMigrations(getDb()); // from server/plugins/db.ts
```

Never call `drizzle-kit push` here — same rule as production. The CI guard `pnpm guard:no-drizzle-push` will catch attempts.

## Per-template: actions against a real DB

For every template, mount the action registry the same way the Nitro server does and call actions through `runWithRequestContext`:

```ts
// templates/slides/actions/list-decks.int.spec.ts
import { runWithRequestContext } from "@agent-native/core/server/request-context";
import listDecks from "./list-decks";
import createDeck from "./create-deck";

const ownerCtx = { userEmail: "owner@example.com", orgId: "org-acme" };
const stranger = { userEmail: "outsider@example.com", orgId: "org-acme" };

it("scopes list-decks to the caller", async () => {
  await runWithRequestContext(ownerCtx, () =>
    createDeck.run({ title: "Roadmap", slides: "[]" }),
  );
  const mineAsOwner = await runWithRequestContext(ownerCtx, () => listDecks.run({}));
  const mineAsStranger = await runWithRequestContext(stranger, () => listDecks.run({}));

  expect(mineAsOwner.decks).toHaveLength(1);
  expect(mineAsStranger.decks).toHaveLength(0);
});
```

Cover the load-bearing flows per template:

- **slides** — `create-deck` → `add-slide` → `update-slide` → `get-deck` → `list-decks` ownership
- **clips** — `create-recording` → `finalize-recording` → `update-recording` → `list-recordings` ownership
- **mail** — draft → enqueue → send (mock SMTP), with org-scoping
- **forms** — `create-form` → `submit-response` → `list-responses` access matrix
- **calendar** — `create-event` → `list-events` → `update-event` recurrence handling
- **dispatch / content / design / analytics** — at least one happy-path round trip per app

## Cross-template: capability RPC end-to-end

The super-app's inter-app RPC layer lets template A call a capability registered by template B. Integration here boots both Nitro instances (or stubs B's handler in-process) and asserts ownership transfers correctly across the boundary.

```ts
// packages/core/src/a2a/cross-app.int.spec.ts
it("forwards caller identity when slides calls images.generate", async () => {
  await runWithRequestContext({ userEmail: "alice@example.com" }, async () => {
    const result = await callCapability("images:generate", { prompt: "hero" });
    expect(result.ownerEmail).toBe("alice@example.com"); // not the server's service account
  });
});
```

The pattern mirrors `scripts/qa-public-share-smoke.ts`, which already spawns multiple template servers on dedicated ports with isolated SQLite files. We promote that script's bones into a reusable test helper (`startTemplate(app, { dbPath })`) and consume it from these specs.

## Auth: workspace SSO cookie roundtrip

Better Auth is configured with shared cookies across template subdomains. The integration test confirms a session minted by app A is readable by app B:

```ts
const session = await issueSessionCookie({ email: "alice@example.com" });
const res = await fetch(`${slidesUrl}/_agent-native/actions/list-decks`, {
  headers: { cookie: session.cookieHeader },
});
expect(res.status).toBe(200);

const res2 = await fetch(`${mailUrl}/_agent-native/actions/list-emails`, {
  headers: { cookie: session.cookieHeader },
});
expect(res2.status).toBe(200);
```

Also assert `getRequestUserEmail()` inside an action sees the same `userEmail` — that's what every access check depends on.

## Sharing matrix per role

The framework's sharing model has eight access lanes (owner, private, org-visibility, public-visibility, user-share viewer / editor / admin, org-share). `packages/core/src/sharing/access.spec.ts` already pins the **list** filter and the **resolve / assert** matrix. Mirror that pattern in any template that registers its own `registerShareableResource` (slides decks, clips recordings, forms forms, content docs, design design-systems, etc.):

```ts
await runWithRequestContext({ userEmail: viewer, orgId }, async () => {
  await expect(assertAccess("deck", deckId, "viewer")).resolves.toMatchObject({ role: "viewer" });
  await expect(assertAccess("deck", deckId, "editor")).rejects.toBeInstanceOf(ForbiddenError);
});
```

Each role transition (`viewer → editor → admin`, `private → org → public`) gets one explicit assertion. Negative cases (cross-org user, anonymous viewer, deleted share) are mandatory.

## What integration tests must NOT do

- No real OpenAI / Gemini / Whisper calls — mock the provider at the SDK boundary.
- No real Builder.io / file-upload provider — use `registerFileUploadProvider` with an in-memory stub.
- No `drizzle-kit push`. Only `runMigrations(db)` from each template's `server/plugins/db.ts`.
- No shared state across files — every `beforeEach` builds a fresh DB.

Run with `pnpm --filter <template> test -- --testPathPattern int`. CI runs them after unit tests but before e2e.
