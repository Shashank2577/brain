import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runWithRequestContext } from "@agent-native/core/server/request-context";
import { setupTestDb, getActiveTestDb, type TestDb } from "../setup-db";
import * as schema from "../../server/db/schema";

// Redirect the action's `getDb()` import to the per-test SQLite instance.
vi.mock("../../server/db/index.js", () => ({
  getDb: () => getActiveTestDb(),
  schema,
}));

// `application-state` writes go through a framework helper that touches the
// live DB. We stub it because there's no `application_state` table in the
// minimal test fixture and the action doesn't depend on the write succeeding.
vi.mock("@agent-native/core/application-state", () => ({
  writeAppState: vi.fn(async () => {}),
}));

let fixture: TestDb;

beforeEach(() => {
  fixture = setupTestDb();
});

afterEach(() => {
  fixture.close();
  vi.clearAllMocks();
});

describe("notes.create-note", () => {
  it("creates a row owned by the current user", async () => {
    const { default: createNote } = await import("../../actions/create-note");

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com", orgId: "org-acme" },
      () =>
        createNote.run({
          title: "Quick thought",
          body: "Something to remember.",
        }),
    );

    expect(result.title).toBe("Quick thought");
    expect(result.body).toBe("Something to remember.");
    expect(result.ownerEmail).toBe("alice@example.com");
    expect(result.id).toMatch(/^[A-Za-z0-9]{12}$/);
    expect(result.urlPath).toBe(`/notes/${result.id}`);

    const rows = await fixture.db.select().from(schema.notes);
    expect(rows).toHaveLength(1);
    expect(rows[0].ownerEmail).toBe("alice@example.com");
    expect(rows[0].orgId).toBe("org-acme");
  });

  it("rejects an empty title via the zod schema", async () => {
    const { default: createNote } = await import("../../actions/create-note");

    // The schema is the validation boundary — but `defineAction.run` is the
    // raw handler. Validate via the Standard Schema bridge to mirror what the
    // capability registry does when invoked via RPC.
    const std = (createNote.schema as any)["~standard"];
    const parsed = await std.validate({ title: "" });
    expect(parsed.issues).toBeTruthy();
  });

  it("throws when there is no authenticated user", async () => {
    const { default: createNote } = await import("../../actions/create-note");

    await expect(
      runWithRequestContext({ userEmail: undefined }, () =>
        createNote.run({ title: "Anonymous" }),
      ),
    ).rejects.toThrow(/Unauthenticated/);
  });

  it("preserves source pointer columns from inter-app callers", async () => {
    const { default: createNote } = await import("../../actions/create-note");

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () =>
        createNote.run({
          title: "Notes for task T-1",
          sourceApp: "tasks",
          sourceType: "task",
          sourceId: "task-123",
        }),
    );

    expect(result.sourceApp).toBe("tasks");
    expect(result.sourceType).toBe("task");
    expect(result.sourceId).toBe("task-123");

    const [row] = await fixture.db.select().from(schema.notes);
    expect(row.sourceApp).toBe("tasks");
    expect(row.sourceId).toBe("task-123");
  });

  it("uses the caller-supplied id for optimistic UI flows", async () => {
    const { default: createNote } = await import("../../actions/create-note");

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => createNote.run({ id: "note-pre-gen", title: "Optimistic" }),
    );

    expect(result.id).toBe("note-pre-gen");
  });
});
