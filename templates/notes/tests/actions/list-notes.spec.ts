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

async function insertNote(values: {
  id: string;
  ownerEmail: string;
  orgId?: string | null;
  title?: string;
  body?: string;
  archivedAt?: string | null;
  sourceApp?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  pinned?: number;
  visibility?: "private" | "org" | "public";
}) {
  await fixture.db.insert(schema.notes).values({
    id: values.id,
    title: values.title ?? values.id,
    body: values.body ?? "",
    archivedAt: values.archivedAt ?? null,
    sourceApp: values.sourceApp ?? null,
    sourceType: values.sourceType ?? null,
    sourceId: values.sourceId ?? null,
    pinned: values.pinned ?? 0,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    ownerEmail: values.ownerEmail,
    orgId: values.orgId === undefined ? null : values.orgId,
    visibility: values.visibility ?? "private",
  });
}

beforeEach(() => {
  fixture = setupTestDb();
});

afterEach(() => {
  fixture.close();
  vi.clearAllMocks();
});

describe("notes.list-notes", () => {
  it("returns only the caller's notes (cross-user isolation)", async () => {
    const { default: listNotes } = await import("../../actions/list-notes");
    await insertNote({ id: "alice-1", ownerEmail: "alice@example.com" });
    await insertNote({ id: "bob-1", ownerEmail: "bob@example.com" });

    const aliceList = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => listNotes.run({ archived: false, limit: 50 }),
    );
    expect(aliceList.notes.map((n) => n.id)).toEqual(["alice-1"]);

    const bobList = await runWithRequestContext(
      { userEmail: "bob@example.com" },
      () => listNotes.run({ archived: false, limit: 50 }),
    );
    expect(bobList.notes.map((n) => n.id)).toEqual(["bob-1"]);
  });

  it("excludes archived rows by default", async () => {
    const { default: listNotes } = await import("../../actions/list-notes");
    await insertNote({ id: "live", ownerEmail: "alice@example.com" });
    await insertNote({
      id: "archived",
      ownerEmail: "alice@example.com",
      archivedAt: "2026-05-02T00:00:00.000Z",
    });

    const live = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => listNotes.run({ archived: false, limit: 50 }),
    );
    expect(live.notes.map((n) => n.id)).toEqual(["live"]);

    const all = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => listNotes.run({ archived: true, limit: 50 }),
    );
    expect(all.notes.map((n) => n.id)).toEqual(["archived"]);
  });

  it("filters by sourceApp / sourceType / sourceId exact match", async () => {
    const { default: listNotes } = await import("../../actions/list-notes");
    await insertNote({
      id: "task-note",
      ownerEmail: "alice@example.com",
      sourceApp: "tasks",
      sourceType: "task",
      sourceId: "task-1",
    });
    await insertNote({
      id: "crm-note",
      ownerEmail: "alice@example.com",
      sourceApp: "crm",
      sourceType: "contact",
      sourceId: "contact-9",
    });
    await insertNote({ id: "free-note", ownerEmail: "alice@example.com" });

    const taskOnly = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () =>
        listNotes.run({
          sourceApp: "tasks",
          archived: false,
          limit: 50,
        }),
    );
    expect(taskOnly.notes.map((n) => n.id)).toEqual(["task-note"]);

    const crmContact = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () =>
        listNotes.run({
          sourceApp: "crm",
          sourceType: "contact",
          sourceId: "contact-9",
          archived: false,
          limit: 50,
        }),
    );
    expect(crmContact.notes.map((n) => n.id)).toEqual(["crm-note"]);
  });

  it("sorts pinned rows ahead of unpinned ones", async () => {
    const { default: listNotes } = await import("../../actions/list-notes");
    await insertNote({ id: "regular", ownerEmail: "alice@example.com" });
    await insertNote({
      id: "pinned",
      ownerEmail: "alice@example.com",
      pinned: 1,
    });

    const list = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => listNotes.run({ archived: false, limit: 50 }),
    );
    expect(list.notes.map((n) => n.id)).toEqual(["pinned", "regular"]);
  });
});
