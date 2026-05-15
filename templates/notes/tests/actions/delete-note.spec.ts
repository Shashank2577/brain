import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { runWithRequestContext } from "@agent-native/core/server/request-context";
import { ForbiddenError } from "@agent-native/core/sharing";
import { setupTestDb, getActiveTestDb, type TestDb } from "../setup-db";
import * as schema from "../../server/db/schema";

vi.mock("../../server/db/index.js", () => ({
  getDb: () => getActiveTestDb(),
  schema,
}));

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

async function insertNote() {
  await fixture.db.insert(schema.notes).values({
    id: "note-1",
    title: "Doomed",
    body: "to be deleted",
    pinned: 0,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    ownerEmail: "alice@example.com",
    orgId: null,
    visibility: "private",
  });
}

describe("notes.delete-note", () => {
  it("soft-deletes by setting archivedAt (owner)", async () => {
    const { default: deleteNote } = await import("../../actions/delete-note");
    await insertNote();

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => deleteNote.run({ id: "note-1", purge: false }),
    );
    expect(result).toEqual({ id: "note-1", deleted: true, purged: false });

    const [row] = await fixture.db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, "note-1"));
    expect(row.archivedAt).toBeTruthy();
  });

  it("hard-deletes the row and its share grants with purge:true", async () => {
    const { default: deleteNote } = await import("../../actions/delete-note");
    await insertNote();
    await fixture.db.insert(schema.noteShares).values({
      id: "share-1",
      resourceId: "note-1",
      principalType: "user",
      principalId: "viewer@example.com",
      role: "viewer",
      createdBy: "alice@example.com",
      createdAt: "2026-05-02T00:00:00.000Z",
    });

    await runWithRequestContext({ userEmail: "alice@example.com" }, () =>
      deleteNote.run({ id: "note-1", purge: true }),
    );

    const notes = await fixture.db.select().from(schema.notes);
    const shares = await fixture.db.select().from(schema.noteShares);
    expect(notes).toHaveLength(0);
    expect(shares).toHaveLength(0);
  });

  it("rejects an editor-share with ForbiddenError (admin required)", async () => {
    const { default: deleteNote } = await import("../../actions/delete-note");
    await insertNote();
    await fixture.db.insert(schema.noteShares).values({
      id: "share-editor",
      resourceId: "note-1",
      principalType: "user",
      principalId: "editor@example.com",
      role: "editor",
      createdBy: "alice@example.com",
      createdAt: "2026-05-02T00:00:00.000Z",
    });

    await expect(
      runWithRequestContext({ userEmail: "editor@example.com" }, () =>
        deleteNote.run({ id: "note-1", purge: false }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
