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

describe("<name>.list-metrics", () => {
  it("returns an empty metrics list when there is no data", async () => {
    const { default: listMetrics } = await import(
      "../../actions/list-metrics"
    );

    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => listMetrics.run({}),
    );

    expect(result.metrics).toEqual([]);
  });

  it("returns one metric card per row the user can see", async () => {
    const nowIso = new Date().toISOString();
    await fixture.db.insert(schema.<name>Items).values({
      id: "m1",
      title: "Active users",
      body: "1234",
      createdAt: nowIso,
      updatedAt: nowIso,
      ownerEmail: "alice@example.com",
      orgId: null,
      visibility: "private",
    });

    const { default: listMetrics } = await import(
      "../../actions/list-metrics"
    );
    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => listMetrics.run({}),
    );

    expect(result.metrics).toHaveLength(1);
    expect(result.metrics[0].label).toBe("Active users");
    expect(result.metrics[0].value).toBe("1234");
  });

  it("scopes metrics to the current viewer", async () => {
    const nowIso = new Date().toISOString();
    await fixture.db.insert(schema.<name>Items).values({
      id: "m1",
      title: "Bob's metric",
      body: "9999",
      createdAt: nowIso,
      updatedAt: nowIso,
      ownerEmail: "bob@example.com",
      orgId: null,
      visibility: "private",
    });

    const { default: listMetrics } = await import(
      "../../actions/list-metrics"
    );
    const result = await runWithRequestContext(
      { userEmail: "alice@example.com" },
      () => listMetrics.run({}),
    );

    expect(result.metrics).toEqual([]);
  });
});
