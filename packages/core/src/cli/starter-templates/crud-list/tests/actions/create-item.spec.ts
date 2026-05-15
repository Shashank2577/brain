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

describe("<name>.create-item", () => {
  it("creates a row owned by the current user", async () => {
    const { default: createItem } = await import("../../actions/create-item");

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () =>
        createItem.run({
          title: "First item",
          body: "Body.",
        }),
    );

    expect(result.title).toBe("First item");
    expect(result.ownerEmail).toBe("alice@example.com");
    expect(result.id).toMatch(/^[A-Za-z0-9]{12}$/);

    const rows = await fixture.db.select().from(schema.<name>Items);
    expect(rows).toHaveLength(1);
    expect(rows[0].ownerEmail).toBe("alice@example.com");
  });

  it("rejects an empty title via the zod schema", async () => {
    const { default: createItem } = await import("../../actions/create-item");
    const std = (createItem.schema as any)["~standard"];
    const parsed = await std.validate({ title: "" });
    expect(parsed.issues).toBeTruthy();
  });

  it("throws when there is no authenticated user", async () => {
    const { default: createItem } = await import("../../actions/create-item");

    await expect(
      runWithRequestContext({ userEmail: undefined }, () =>
        createItem.run({ title: "Anonymous" }),
      ),
    ).rejects.toThrow(/Unauthenticated/);
  });
});
