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

async function insertNote(values: {
  id: string;
  title: string;
  body: string;
  ownerEmail?: string;
  archivedAt?: string | null;
}) {
  await fixture.db.insert(schema.notes).values({
    id: values.id,
    title: values.title,
    body: values.body,
    pinned: 0,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    archivedAt: values.archivedAt ?? null,
    ownerEmail: values.ownerEmail ?? "alice@example.com",
    orgId: null,
    visibility: "private",
  });
}

describe("notes.search-notes", () => {
  it("matches case-insensitive substring on title", async () => {
    const { default: searchNotes } = await import("../../actions/search-notes");
    await insertNote({
      id: "n1",
      title: "Pricing Strategy",
      body: "blah",
    });
    await insertNote({ id: "n2", title: "Unrelated", body: "noise" });

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => searchNotes.run({ q: "pricing", limit: 20 }),
    );

    expect(result.results.map((r) => r.id)).toEqual(["n1"]);
    expect(result.results[0].snippet.toLowerCase()).toContain("pricing");
  });

  it("matches case-insensitive substring on body and returns a snippet centered on the match", async () => {
    const { default: searchNotes } = await import("../../actions/search-notes");
    await insertNote({
      id: "long-note",
      title: "Random title",
      body:
        "lorem ipsum ".repeat(30) +
        "the crucial information lives in this exact sentence right here " +
        "lorem ipsum ".repeat(30),
    });

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => searchNotes.run({ q: "crucial information", limit: 20 }),
    );

    expect(result.results).toHaveLength(1);
    expect(result.results[0].snippet.toLowerCase()).toContain(
      "crucial information",
    );
    expect(result.results[0].snippet.length).toBeLessThan(300);
  });

  it("excludes archived notes from search results", async () => {
    const { default: searchNotes } = await import("../../actions/search-notes");
    await insertNote({
      id: "archived",
      title: "old pricing thoughts",
      body: "",
      archivedAt: "2026-05-02T00:00:00.000Z",
    });

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => searchNotes.run({ q: "pricing", limit: 20 }),
    );

    expect(result.results).toEqual([]);
  });

  it("scopes search results to the caller (cross-user isolation)", async () => {
    const { default: searchNotes } = await import("../../actions/search-notes");
    await insertNote({
      id: "bob-note",
      title: "Bob's pricing thoughts",
      body: "",
      ownerEmail: "bob@example.com",
    });

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => searchNotes.run({ q: "pricing", limit: 20 }),
    );

    expect(result.results).toEqual([]);
  });
});
