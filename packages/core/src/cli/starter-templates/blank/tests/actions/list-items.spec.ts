import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runWithRequestContext } from "@agent-native/core/server/request-context";
import { setupTestDb, getActiveTestDb, type TestDb } from "../setup-db";
import * as schema from "../../server/db/schema";

vi.mock("../../server/db/index.js", () => ({
  getDb: () => getActiveTestDb(),
  schema,
}));

let fixture: TestDb;

beforeEach(() => {
  fixture = setupTestDb();
});

afterEach(() => {
  fixture.close();
  vi.clearAllMocks();
});

describe("<name>.list-items", () => {
  it("returns an empty array when the table has no rows", async () => {
    const { default: listItems } = await import("../../actions/list-items");

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => listItems.run({ limit: 50 }),
    );

    expect(result.items).toEqual([]);
  });

  it("returns rows owned by the current user", async () => {
    await fixture.db.insert(schema.<name>Items).values({
      id: "item-1",
      title: "First",
      body: "Hello",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerEmail: "alice@example.com",
      orgId: null,
      visibility: "private",
    });

    const { default: listItems } = await import("../../actions/list-items");
    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => listItems.run({ limit: 50 }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("First");
  });

  it("does not surface rows owned by a different user", async () => {
    await fixture.db.insert(schema.<name>Items).values({
      id: "item-1",
      title: "Bob's item",
      body: "private",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerEmail: "bob@example.com",
      orgId: null,
      visibility: "private",
    });

    const { default: listItems } = await import("../../actions/list-items");
    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => listItems.run({ limit: 50 }),
    );

    expect(result.items).toEqual([]);
  });
});
