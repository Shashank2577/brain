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

async function insertNote(visibility: "private" | "org" | "public" = "private") {
  await fixture.db.insert(schema.notes).values({
    id: "note-1",
    title: "Original",
    body: "Original body",
    pinned: 0,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    ownerEmail: "alice@example.com",
    orgId: null,
    visibility,
  });
}

describe("notes.update-note", () => {
  it("applies a title + body update for the owner", async () => {
    const { default: updateNote } = await import("../../actions/update-note");
    await insertNote();

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () =>
        updateNote.run({
          id: "note-1",
          title: "Updated",
          body: "Updated body",
        }),
    );

    expect(result.title).toBe("Updated");
    expect(result.body).toBe("Updated body");

    const [row] = await fixture.db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, "note-1"));
    expect(row.title).toBe("Updated");
    expect(row.body).toBe("Updated body");
  });

  it("rejects a viewer-share with ForbiddenError", async () => {
    const { default: updateNote } = await import("../../actions/update-note");
    await insertNote();
    await fixture.db.insert(schema.noteShares).values({
      id: "share-viewer",
      resourceId: "note-1",
      principalType: "user",
      principalId: "viewer@example.com",
      role: "viewer",
      createdBy: "alice@example.com",
      createdAt: "2026-05-02T00:00:00.000Z",
    });

    await expect(
      runWithRequestContext({ userEmail: "viewer@example.com" }, () =>
        updateNote.run({ id: "note-1", body: "tampered" }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("accepts an editor-share update", async () => {
    const { default: updateNote } = await import("../../actions/update-note");
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

    const result = await runWithRequestContext(
      { userEmail: "editor@example.com" },
      () => updateNote.run({ id: "note-1", body: "edited" }),
    );

    expect(result.body).toBe("edited");
  });

  it("is a no-op when no fields change (updated_at stays the same)", async () => {
    const { default: updateNote } = await import("../../actions/update-note");
    await insertNote();

    const [before] = await fixture.db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, "note-1"));

    await runWithRequestContext({ userEmail: "alice@example.com" }, () =>
      updateNote.run({
        id: "note-1",
        title: "Original",
        body: "Original body",
      }),
    );

    const [after] = await fixture.db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, "note-1"));
    expect(after.updatedAt).toBe(before.updatedAt);
  });
});
