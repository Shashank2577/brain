/**
 * OS invariant — when another app (tasks/calendar/crm) calls
 * `notes.create-note` via `ctx.call(...)`, the created row's `ownerEmail`
 * must be the originating user's email, NEVER the calling app's id.
 *
 * This test wires:
 *   - the dispatch CapabilityRegistry (the real RPC layer from
 *     `@agent-native/dispatch/server`)
 *   - the notes `create-note.ts` action (mocked DB)
 *   - a stand-in `tasks.create` static capability that forwards to
 *     `notes.create-note` via `ctx.call(...)`
 *
 * If identity propagation breaks (e.g. an action overrides `ownerEmail` from
 * `ctx.caller` instead of `getRequestUserEmail`), this fails and blocks ship.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runWithRequestContext } from "@agent-native/core/server/request-context";
import {
  buildRegistry,
  dispatchCapability,
  type ActionLike,
} from "@agent-native/dispatch/server";
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

describe("OS invariant — identity propagation through ctx.call", () => {
  it("notes.create-note called by tasks lands with ownerEmail = caller user", async () => {
    const createNoteModule = await import("../../actions/create-note");
    const notesCreate = createNoteModule.default as ActionLike;

    // Stand-in for the tasks template's `create.ts` action — it forwards a
    // sub-call to `notes.create-note` exactly the way the spec describes
    // (`ctx.call("notes.create-note", { title, body, sourceApp: "tasks", … })`).
    const tasksCreate: ActionLike = {
      tool: { description: "Create a task; optionally create a linked note." },
      run: async (args: any, ctx: any) => {
        const note = await ctx.call("notes.create-note", {
          title: `Notes for ${args.title}`,
          body: args.body ?? "",
          sourceApp: "tasks",
          sourceType: "task",
          sourceId: args.taskId,
        });
        return { taskId: args.taskId, linkedNoteId: note.id };
      },
    };

    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: {
        "notes.create-note": notesCreate,
        "tasks.create": tasksCreate,
      },
    });

    // Bob is the originating user. Tasks doesn't get to set ownership.
    const result = await runWithRequestContext(
      { userEmail: "bob@example.com", orgId: "org-acme" },
      () =>
        dispatchCapability({
          registry,
          fqid: "tasks.create",
          input: { title: "Ship Phase 3", body: "details", taskId: "task-42" },
          user: { id: "bob@example.com", email: "bob@example.com" },
        }),
    );

    expect(result.ok).toBe(true);

    const rows = await fixture.db.select().from(schema.notes);
    expect(rows).toHaveLength(1);
    expect(rows[0].ownerEmail).toBe("bob@example.com");
    expect(rows[0].ownerEmail).not.toBe("tasks");
    expect(rows[0].ownerEmail).not.toBe("app:tasks");
    expect(rows[0].sourceApp).toBe("tasks");
    expect(rows[0].sourceType).toBe("task");
    expect(rows[0].sourceId).toBe("task-42");
    expect(rows[0].orgId).toBe("org-acme");
  });

  it("notes survive the same registry run across separate dispatches (persistence)", async () => {
    const createNoteModule = await import("../../actions/create-note");
    const listNotesModule = await import("../../actions/list-notes");
    const notesCreate = createNoteModule.default as ActionLike;
    const notesList = listNotesModule.default as ActionLike;

    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: {
        "notes.create-note": notesCreate,
        "notes.list-notes": notesList,
      },
    });

    const userCtx = { userEmail: "carol@example.com" };
    const userOs = { id: "carol@example.com", email: "carol@example.com" };

    // First dispatch — create.
    await runWithRequestContext(userCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.create-note",
        input: { title: "Persisted" },
        user: userOs,
      }),
    );

    // Second dispatch — list (replaces the manifest's in-memory Map; the
    // note must survive into the next call).
    const listResult = await runWithRequestContext(userCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.list-notes",
        input: { archived: false, limit: 50 },
        user: userOs,
      }),
    );
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      const out = listResult.output as { notes: { title: string }[] };
      expect(out.notes.map((n) => n.title)).toEqual(["Persisted"]);
    }
  });
});
