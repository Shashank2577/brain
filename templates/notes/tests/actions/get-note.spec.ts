import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runWithRequestContext } from "@agent-native/core/server/request-context";
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

async function insertOwnerNote() {
  await fixture.db.insert(schema.notes).values({
    id: "note-1",
    title: "Alice's note",
    body: "private body",
    pinned: 0,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    ownerEmail: "alice@example.com",
    orgId: null,
    visibility: "private",
  });
}

describe("notes.get-note", () => {
  it("returns the full body for the owner", async () => {
    const { default: getNote } = await import("../../actions/get-note");
    await insertOwnerNote();

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => getNote.run({ id: "note-1" }),
    );

    expect(result.id).toBe("note-1");
    expect(result.body).toBe("private body");
    expect(result.accessRole).toBe("owner");
    expect(result.canEdit).toBe(true);
    expect(result.canManage).toBe(true);
  });

  it("throws (404-shaped) on a note owned by another user with no share grant", async () => {
    const { default: getNote } = await import("../../actions/get-note");
    await insertOwnerNote();

    await expect(
      runWithRequestContext({ userEmail: "outsider@example.com" }, () =>
        getNote.run({ id: "note-1" }),
      ),
    ).rejects.toThrow(/not found/);
  });

  it("returns 200 with viewer role when a share grant exists", async () => {
    const { default: getNote } = await import("../../actions/get-note");
    await insertOwnerNote();
    await fixture.db.insert(schema.noteShares).values({
      id: "share-1",
      resourceId: "note-1",
      principalType: "user",
      principalId: "viewer@example.com",
      role: "viewer",
      createdBy: "alice@example.com",
      createdAt: "2026-05-02T00:00:00.000Z",
    });

    const result = await runWithRequestContext(
      { userEmail: "viewer@example.com" },
      () => getNote.run({ id: "note-1" }),
    );

    expect(result.id).toBe("note-1");
    expect(result.accessRole).toBe("viewer");
    expect(result.canEdit).toBe(false);
    expect(result.canManage).toBe(false);
  });
});
