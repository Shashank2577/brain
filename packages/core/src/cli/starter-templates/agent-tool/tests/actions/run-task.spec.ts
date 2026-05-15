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

describe("<name>.run-task", () => {
  it("records a task row for the calling user", async () => {
    const { default: runTask } = await import("../../actions/run-task");

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => runTask.run({ input: "ping" }),
    );

    expect(result.status).toBe("completed");
    expect(result.output).toContain("ping");
    expect(result.ownerEmail).toBe("alice@example.com");

    const rows = await fixture.db.select().from(schema.<name>Items);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("ping");
  });

  it("throws when there is no authenticated user", async () => {
    const { default: runTask } = await import("../../actions/run-task");

    await expect(
      runWithRequestContext({ userEmail: undefined }, () =>
        runTask.run({ input: "anon" }),
      ),
    ).rejects.toThrow(/Unauthenticated/);
  });

  it("persists optional metadata as JSON in the body column", async () => {
    const { default: runTask } = await import("../../actions/run-task");

    await runWithRequestContext({ userEmail: "alice@example.com" }, () =>
      runTask.run({ input: "ping", metadata: { source: "test" } }),
    );

    const rows = await fixture.db.select().from(schema.<name>Items);
    expect(rows[0].body).toBe(JSON.stringify({ source: "test" }));
  });
});
