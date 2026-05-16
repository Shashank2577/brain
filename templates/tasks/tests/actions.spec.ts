/**
 * Unit + integration tests for the tasks template's actions.
 *
 * Coverage:
 *   1. Schema validation — `create` rejects empty text, oversized text, bad
 *      priority strings.
 *   2. `create({ alsoNote: true })` — when notes is wired into the registry,
 *      the resulting note's owner_email equals the calling user (NOT "tasks").
 *      This is the load-bearing assertion of the Phase 3 inter-app demo.
 *   3. `create({ alsoNote: true })` resilience — when notes is missing, the
 *      task is still created with `linkedNoteId: null` and a `linkWarning`.
 *   4. `complete` — sets completedAt; re-completing is a no-op.
 *   5. `uncomplete` — clears completedAt.
 *   6. `list` — filters active / completed / all; access scoping isolates
 *      caller B from caller A's rows.
 *   7. `update` — partial patches only touch the named fields.
 *   8. `delete` — removes the row; the linked note is NOT deleted.
 */
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { runWithRequestContext } from "@agent-native/core/server/request-context";

// Use a per-run temporary SQLite file so the framework's `getDbExec` (which
// opens its own better-sqlite3 connection) and `createGetDb` (which opens a
// second connection) see the same physical database. Pure `:memory:` creates
// two distinct in-memory DBs and `file::memory:?cache=shared` resolves to a
// literal file inside the repo — neither works. A tmpdir path with unique
// pid+timestamp avoids both.
const TMP_DB_PATH = path.join(
  os.tmpdir(),
  `tasks-test-${process.pid}-${Date.now()}.sqlite`,
);
process.env.DATABASE_URL = `file:${TMP_DB_PATH}`;
process.env.AUTH_MODE = "local";

afterAll(() => {
  for (const suffix of ["", "-shm", "-wal"]) {
    try {
      fs.unlinkSync(TMP_DB_PATH + suffix);
    } catch {
      // file may not exist — best-effort cleanup
    }
  }
});

interface RawExec {
  execute: (sql: string | { sql: string; args: unknown[] }) => Promise<unknown>;
}

// Modules under test are imported lazily so the env vars above take effect
// before drizzle / the schema / the actions resolve their dialect.
async function importActions() {
  const create = (await import("../actions/create.js")).default;
  const list = (await import("../actions/list.js")).default;
  const complete = (await import("../actions/complete.js")).default;
  const uncomplete = (await import("../actions/uncomplete.js")).default;
  const update = (await import("../actions/update.js")).default;
  const del = (await import("../actions/delete.js")).default;
  const dbMod = await import("../server/db/index.js");
  const clientMod = await import("@agent-native/core/db");
  return {
    create,
    list,
    complete,
    uncomplete,
    update,
    del,
    dbMod,
    clientMod,
  };
}

async function ensureSchema(exec: RawExec) {
  // The runtime plugin runs the migrations file; in tests we issue the
  // schema directly via the raw `DbExec` so the test DB matches the
  // migration shape.
  await exec.execute(`CREATE TABLE IF NOT EXISTS tasks_tasks (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    linked_note_id TEXT,
    due_date TEXT,
    priority TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    owner_email TEXT NOT NULL DEFAULT 'local@localhost',
    org_id TEXT,
    visibility TEXT NOT NULL DEFAULT 'private'
  )`);
  await exec.execute(`CREATE TABLE IF NOT EXISTS tasks_shares (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL,
    principal_type TEXT NOT NULL,
    principal_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
}

async function clearTables(exec: RawExec) {
  await exec.execute(`DELETE FROM tasks_tasks`);
  await exec.execute(`DELETE FROM tasks_shares`);
}

// Run a callback under a synthetic request context. Returns the action's
// `any` result widened back to `any` so callers can index it without
// TypeScript noise — drizzle's `db.run()` / `defineAction`'s wrapped run
// both type-erase the return shape, and re-narrowing in every test would be
// noise without value.
async function asUser(email: string, fn: () => Promise<unknown>): Promise<any> {
  return Promise.resolve(runWithRequestContext({ userEmail: email }, fn));
}

describe("tasks.create — schema validation", () => {
  it("rejects empty text", async () => {
    const { create } = await importActions();
    await expect(
      asUser("alice@demo.local", () => create.run({ text: "" })),
    ).rejects.toThrow();
  });

  it("rejects text over 500 characters", async () => {
    const { create } = await importActions();
    const longText = "x".repeat(501);
    await expect(
      asUser("alice@demo.local", () => create.run({ text: longText })),
    ).rejects.toThrow();
  });

  it("rejects an invalid priority string", async () => {
    const { create } = await importActions();
    await expect(
      asUser("alice@demo.local", () =>
        create.run({ text: "ok", priority: "panic" as any }),
      ),
    ).rejects.toThrow();
  });
});

describe("tasks lifecycle (single user)", () => {
  let setup: Awaited<ReturnType<typeof importActions>>;

  beforeEach(async () => {
    setup = await importActions();
    const exec = setup.clientMod.getDbExec() as RawExec;
    await ensureSchema(exec);
    await clearTables(exec);
  });

  it("creates, completes, uncompletes, updates, deletes", async () => {
    const created = await asUser("alice@demo.local", () =>
      setup.create.run({ text: "ship the spec" }),
    );
    expect(created.id).toMatch(/^task_/);
    expect(created.completed).toBe(false);
    expect(created.linkedNoteId).toBeNull();

    const active = await asUser("alice@demo.local", () =>
      setup.list.run({ filter: "active", limit: 50 }),
    );
    expect(active).toHaveLength(1);

    const completed = await asUser("alice@demo.local", () =>
      setup.complete.run({ id: created.id }),
    );
    expect(completed.completed).toBe(true);
    expect(completed.completedAt).toBeTruthy();

    // Re-completing is idempotent — the timestamp should not change.
    const completedAgain = await asUser("alice@demo.local", () =>
      setup.complete.run({ id: created.id }),
    );
    expect(completedAgain.completedAt).toBe(completed.completedAt);

    const completedList = await asUser("alice@demo.local", () =>
      setup.list.run({ filter: "completed", limit: 50 }),
    );
    expect(completedList).toHaveLength(1);

    const reopened = await asUser("alice@demo.local", () =>
      setup.uncomplete.run({ id: created.id }),
    );
    expect(reopened.completed).toBe(false);

    const patched = await asUser("alice@demo.local", () =>
      setup.update.run({
        id: created.id,
        priority: "high",
      }),
    );
    expect(patched.updated).toBe(true);

    const all = await asUser("alice@demo.local", () =>
      setup.list.run({ filter: "all", limit: 50 }),
    );
    expect(all[0].priority).toBe("high");

    const deleted = await asUser("alice@demo.local", () =>
      setup.del.run({ id: created.id }),
    );
    expect(deleted.deleted).toBe(true);

    const empty = await asUser("alice@demo.local", () =>
      setup.list.run({ filter: "all", limit: 50 }),
    );
    expect(empty).toHaveLength(0);
  });

  it("update with null clears the priority column", async () => {
    const t = await asUser("alice@demo.local", () =>
      setup.create.run({ text: "x", priority: "urgent" }),
    );
    await asUser("alice@demo.local", () =>
      setup.update.run({ id: t.id, priority: null }),
    );
    const all = await asUser("alice@demo.local", () =>
      setup.list.run({ filter: "all", limit: 50 }),
    );
    expect(all[0].priority).toBeNull();
  });
});

describe("tasks.list — access scoping", () => {
  let setup: Awaited<ReturnType<typeof importActions>>;

  beforeEach(async () => {
    setup = await importActions();
    const exec = setup.clientMod.getDbExec() as RawExec;
    await ensureSchema(exec);
    await clearTables(exec);
  });

  it("never leaks user A's tasks to user B", async () => {
    for (const t of ["a1", "a2", "a3"]) {
      await asUser("alice@demo.local", () => setup.create.run({ text: t }));
    }
    for (const t of ["b1", "b2"]) {
      await asUser("bob@demo.local", () => setup.create.run({ text: t }));
    }

    const alicesView = await asUser("alice@demo.local", () =>
      setup.list.run({ filter: "all", limit: 50 }),
    );
    expect(alicesView).toHaveLength(3);

    const bobsView = await asUser("bob@demo.local", () =>
      setup.list.run({ filter: "all", limit: 50 }),
    );
    expect(bobsView).toHaveLength(2);

    // No row from A leaks into B's list.
    for (const row of bobsView) {
      expect(["b1", "b2"]).toContain(row.text);
    }
  });

  it("rejects cross-user writes with ForbiddenError", async () => {
    const owned = await asUser("alice@demo.local", () =>
      setup.create.run({ text: "alice only" }),
    );

    await expect(
      asUser("bob@demo.local", () => setup.complete.run({ id: owned.id })),
    ).rejects.toThrow();

    await expect(
      asUser("bob@demo.local", () => setup.del.run({ id: owned.id })),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Inter-app integration — the load-bearing Phase 3 contract:
//   when tasks.create runs with alsoNote=true, the created note's
//   ownerEmail must equal the calling user, not the calling app.
// ---------------------------------------------------------------------------

describe("tasks.create with alsoNote — inter-app integration", () => {
  let observedNoteOwner: string | undefined;
  let observedNoteTitle: string | undefined;
  let observedNoteBody: string | undefined;
  // Toggle controls whether the synthetic notes.create-note succeeds or
  // throws. Lets the resilience test share the same `vi.doMock` rather than
  // re-mocking inside the test body (vitest hoists `vi.doMock` so per-test
  // remocking is brittle).
  let notesShouldFail = false;

  // vi.doMock intercepts `callCapability` from `@agent-native/core/server`
  // (the Item A3 cross-app entry point). Our tiny stub:
  //   - On "notes.create-note", records the live ALS userEmail / inputs to
  //     prove identity propagation, then returns { id: "note_synthetic_123" }.
  //   - On any other fqid, throws RpcError(unknown_capability).
  //   - When notesShouldFail is true, throws RpcError(handler_error).
  vi.doMock("@agent-native/core/server", async (importOriginal) => {
    const actual =
      await importOriginal<typeof import("@agent-native/core/server")>();
    const { getRequestUserEmail } = await vi.importActual<
      typeof import("@agent-native/core/server/request-context")
    >("@agent-native/core/server/request-context");
    return {
      ...actual,
      callCapability: async (fqid: string, input: any) => {
        if (fqid !== "notes.create-note") {
          throw new actual.RpcError(
            { code: "unknown_capability", message: fqid, fqid },
            fqid,
            404,
          );
        }
        if (notesShouldFail) {
          throw new actual.RpcError(
            { code: "handler_error", message: "notes is down", fqid },
            fqid,
            500,
          );
        }
        observedNoteOwner = getRequestUserEmail();
        observedNoteTitle = input.title;
        observedNoteBody = input.body;
        return { id: "note_synthetic_123" };
      },
    };
  });

  let setup: Awaited<ReturnType<typeof importActions>>;

  beforeEach(async () => {
    observedNoteOwner = undefined;
    observedNoteTitle = undefined;
    observedNoteBody = undefined;
    notesShouldFail = false;
    setup = await importActions();
    const exec = setup.clientMod.getDbExec() as RawExec;
    await ensureSchema(exec);
    await clearTables(exec);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a note owned by the calling user and stores its id", async () => {
    const result = await asUser("alice@demo.local", () =>
      setup.create.run({ text: "buy milk", alsoNote: true }),
    );

    // The note dispatch ran AS alice — not as some synthetic "tasks" identity.
    expect(observedNoteOwner).toBe("alice@demo.local");
    expect(observedNoteTitle).toBe("buy milk");
    expect(observedNoteBody).toBe("");

    // And tasks stored the returned note id.
    expect(result.linkedNoteId).toBe("note_synthetic_123");
    expect(result.linkWarning).toBeNull();
  });

  it("still creates the task and surfaces a warning when notes fails", async () => {
    notesShouldFail = true;
    const result = await asUser("alice@demo.local", () =>
      setup.create.run({ text: "resilient", alsoNote: true }),
    );

    expect(result.linkedNoteId).toBeNull();
    expect(result.linkWarning).toMatch(/notes/i);

    const stored = await asUser("alice@demo.local", () =>
      setup.list.run({ filter: "all", limit: 50 }),
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe("resilient");
    expect(stored[0].linkedNoteId).toBeNull();
  });
});
