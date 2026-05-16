/**
 * Phase 7 — Tasks capability-registry RPC integration test.
 *
 * Exercises tasks.create / tasks.list / tasks.complete / tasks.update /
 * tasks.delete via the dispatch capability registry RPC path. Asserts
 * response shape, persistence, and that the calling user's identity is
 * stamped onto every row via `runWithRequestContext`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runWithRequestContext } from "@agent-native/core/server/request-context";
import {
  buildRegistry,
  dispatchCapability,
  type ActionLike,
} from "@agent-native/dispatch/server";
import {
  setupTasksFixture,
  getActiveTasksDb,
  schema,
  type TasksFixture,
} from "./helpers/tasks-fixture";

vi.mock("../../templates/tasks/server/db/index.js", () => ({
  getDb: () => getActiveTasksDb(),
  schema,
}));

vi.mock("@agent-native/core/application-state", () => ({
  writeAppState: vi.fn(async () => {}),
}));

const aliceCtx = { userEmail: "alice@test.local" };
const aliceUser = { id: "alice@test.local", email: "alice@test.local" };

let fixture: TasksFixture;

beforeEach(() => {
  fixture = setupTasksFixture();
});

afterEach(() => {
  fixture.close();
  vi.clearAllMocks();
});

async function loadTasksCapabilities(): Promise<Record<string, ActionLike>> {
  const [create, list, complete, update, del] = await Promise.all([
    import("../../templates/tasks/actions/create"),
    import("../../templates/tasks/actions/list"),
    import("../../templates/tasks/actions/complete"),
    import("../../templates/tasks/actions/update"),
    import("../../templates/tasks/actions/delete"),
  ]);
  return {
    "tasks.create": create.default as ActionLike,
    "tasks.list": list.default as ActionLike,
    "tasks.complete": complete.default as ActionLike,
    "tasks.update": update.default as ActionLike,
    "tasks.delete": del.default as ActionLike,
  };
}

describe("tasks — capability-registry RPC integration", () => {
  it("create persists a task with the caller's ownerEmail", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadTasksCapabilities(),
    });

    const result = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.create",
        input: { text: "Author Phase 7 tests", alsoNote: false },
        user: aliceUser,
      }),
    );

    expect(result.ok).toBe(true);

    const rows = await fixture.db.select().from(schema.tasks);
    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe("Author Phase 7 tests");
    expect(rows[0].ownerEmail).toBe("alice@test.local");
  });

  it("list returns only the caller's tasks (cross-user isolation)", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadTasksCapabilities(),
    });

    await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.create",
        input: { text: "Alice's task", alsoNote: false },
        user: aliceUser,
      }),
    );

    const bobCtx = { userEmail: "bob@test.local" };
    const bobUser = { id: "bob@test.local", email: "bob@test.local" };
    await runWithRequestContext(bobCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.create",
        input: { text: "Bob's task", alsoNote: false },
        user: bobUser,
      }),
    );

    const asAlice = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.list",
        input: { filter: "active", limit: 100 },
        user: aliceUser,
      }),
    );
    expect(asAlice.ok).toBe(true);
    if (!asAlice.ok) throw new Error(asAlice.error.message);
    const aliceList = asAlice.output as Array<{ text: string }>;
    expect(aliceList).toHaveLength(1);
    expect(aliceList[0].text).toBe("Alice's task");

    const asBob = await runWithRequestContext(bobCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.list",
        input: { filter: "active", limit: 100 },
        user: bobUser,
      }),
    );
    expect(asBob.ok).toBe(true);
    if (!asBob.ok) throw new Error(asBob.error.message);
    const bobList = asBob.output as Array<{ text: string }>;
    expect(bobList).toHaveLength(1);
    expect(bobList[0].text).toBe("Bob's task");
  });

  it("complete sets completedAt", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadTasksCapabilities(),
    });

    const created = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.create",
        input: { text: "Finish me", alsoNote: false },
        user: aliceUser,
      }),
    );
    if (!created.ok) throw new Error(created.error.message);
    const { id } = created.output as { id: string };

    const completed = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.complete",
        input: { id },
        user: aliceUser,
      }),
    );
    expect(completed.ok).toBe(true);

    const rows = await fixture.db.select().from(schema.tasks);
    expect(rows).toHaveLength(1);
    expect(rows[0].completedAt).not.toBeNull();
  });

  it("update patches a single field without touching the rest", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadTasksCapabilities(),
    });

    const created = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.create",
        input: { text: "Original", priority: "normal", alsoNote: false },
        user: aliceUser,
      }),
    );
    if (!created.ok) throw new Error(created.error.message);
    const { id } = created.output as { id: string };

    await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.update",
        input: { id, priority: "high" },
        user: aliceUser,
      }),
    );

    const rows = await fixture.db.select().from(schema.tasks);
    expect(rows[0].priority).toBe("high");
    expect(rows[0].text).toBe("Original"); // untouched
  });

  it("delete removes the row", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadTasksCapabilities(),
    });

    const created = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.create",
        input: { text: "Will be gone", alsoNote: false },
        user: aliceUser,
      }),
    );
    if (!created.ok) throw new Error(created.error.message);
    const { id } = created.output as { id: string };

    await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.delete",
        input: { id },
        user: aliceUser,
      }),
    );

    const rows = await fixture.db.select().from(schema.tasks);
    expect(rows).toHaveLength(0);
  });
});
