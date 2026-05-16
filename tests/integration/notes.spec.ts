/**
 * Phase 7 — Notes capability-registry RPC integration test.
 *
 * Exercises the five baseline notes capabilities (create/list/get/update/
 * delete) via the dispatch capability registry RPC path, against a fresh
 * in-memory SQLite database. Asserts both response shape and persistence
 * — calling `notes.list-notes` after `notes.create-note` must surface the
 * created row, and the row must carry the calling user's `ownerEmail`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runWithRequestContext } from "@agent-native/core/server/request-context";
import {
  buildRegistry,
  dispatchCapability,
  type ActionLike,
} from "@agent-native/dispatch/server";
import {
  setupNotesFixture,
  getActiveNotesDb,
  schema,
  type NotesFixture,
} from "./helpers/notes-fixture";

vi.mock("../../templates/notes/server/db/index.js", () => ({
  getDb: () => getActiveNotesDb(),
  schema,
}));

vi.mock("@agent-native/core/application-state", () => ({
  writeAppState: vi.fn(async () => {}),
}));

const aliceCtx = { userEmail: "alice@test.local" };
const aliceUser = { id: "alice@test.local", email: "alice@test.local" };

let fixture: NotesFixture;

beforeEach(() => {
  fixture = setupNotesFixture();
});

afterEach(() => {
  fixture.close();
  vi.clearAllMocks();
});

async function loadNotesCapabilities(): Promise<Record<string, ActionLike>> {
  const [create, list, get, update, del] = await Promise.all([
    import("../../templates/notes/actions/create-note"),
    import("../../templates/notes/actions/list-notes"),
    import("../../templates/notes/actions/get-note"),
    import("../../templates/notes/actions/update-note"),
    import("../../templates/notes/actions/delete-note"),
  ]);
  return {
    "notes.create-note": create.default as ActionLike,
    "notes.list-notes": list.default as ActionLike,
    "notes.get-note": get.default as ActionLike,
    "notes.update-note": update.default as ActionLike,
    "notes.delete-note": del.default as ActionLike,
  };
}

describe("notes — capability-registry RPC integration", () => {
  it("create-note returns the new note shape and persists ownerEmail", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadNotesCapabilities(),
    });

    const result = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.create-note",
        input: { title: "Phase 7 plan", body: "Author tests" },
        user: aliceUser,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    const output = result.output as {
      id: string;
      title: string;
      body: string;
      ownerEmail: string;
    };
    expect(output.title).toBe("Phase 7 plan");
    expect(output.body).toBe("Author tests");
    expect(output.ownerEmail).toBe("alice@test.local");

    const rows = await fixture.db.select().from(schema.notes);
    expect(rows).toHaveLength(1);
    expect(rows[0].ownerEmail).toBe("alice@test.local");
  });

  it("list-notes returns previously-created notes for the same user", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadNotesCapabilities(),
    });

    await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.create-note",
        input: { title: "First" },
        user: aliceUser,
      }),
    );

    const listResult = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.list-notes",
        input: { archived: false, limit: 50 },
        user: aliceUser,
      }),
    );

    expect(listResult.ok).toBe(true);
    if (!listResult.ok) throw new Error(listResult.error.message);
    const { notes } = listResult.output as { notes: Array<{ title: string }> };
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("First");
  });

  it("get-note resolves a note the user owns", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadNotesCapabilities(),
    });

    const created = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.create-note",
        input: { title: "Read me", body: "Hello" },
        user: aliceUser,
      }),
    );
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(created.error.message);
    const { id } = created.output as { id: string };

    const got = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.get-note",
        input: { id },
        user: aliceUser,
      }),
    );
    expect(got.ok).toBe(true);
    if (!got.ok) throw new Error(got.error.message);
    const out = got.output as { id: string; title: string; body: string };
    expect(out.id).toBe(id);
    expect(out.title).toBe("Read me");
    expect(out.body).toBe("Hello");
  });

  it("update-note mutates the row in place", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadNotesCapabilities(),
    });

    const created = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.create-note",
        input: { title: "Draft", body: "wip" },
        user: aliceUser,
      }),
    );
    if (!created.ok) throw new Error(created.error.message);
    const { id } = created.output as { id: string };

    const updated = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.update-note",
        input: { id, title: "Final" },
        user: aliceUser,
      }),
    );
    expect(updated.ok).toBe(true);

    const rows = await fixture.db.select().from(schema.notes);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Final");
  });

  it("delete-note (soft) sets archivedAt without removing the row", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadNotesCapabilities(),
    });

    const created = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.create-note",
        input: { title: "Soon archived" },
        user: aliceUser,
      }),
    );
    if (!created.ok) throw new Error(created.error.message);
    const { id } = created.output as { id: string };

    const deleted = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "notes.delete-note",
        input: { id },
        user: aliceUser,
      }),
    );
    expect(deleted.ok).toBe(true);

    const rows = await fixture.db.select().from(schema.notes);
    expect(rows).toHaveLength(1);
    expect(rows[0].archivedAt).not.toBeNull();
  });
});

describe("notes — identity propagation for inter-app dependents", () => {
  it("tasks.create called via ctx.call lands the linked note with ownerEmail = caller user", async () => {
    const capabilities = await loadNotesCapabilities();

    // Stand-in for `tasks.create` that forwards via ctx.call. Mirrors the
    // signature documented in docs/apps/notes.md — tasks tags the note
    // with sourceApp="tasks", sourceType="task", sourceId=<taskId>.
    const tasksCreate: ActionLike = {
      tool: { description: "Create a task; optionally link a note." },
      run: async (args: { title: string; taskId: string }, ctx: any) => {
        const note = await ctx.call("notes.create-note", {
          title: `Notes for ${args.title}`,
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
        ...capabilities,
        "tasks.create": tasksCreate,
      },
    });

    const result = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "tasks.create",
        input: { title: "Ship Phase 7", taskId: "task-42" },
        user: aliceUser,
      }),
    );

    expect(result.ok).toBe(true);

    const rows = await fixture.db.select().from(schema.notes);
    expect(rows).toHaveLength(1);
    // OS invariant: the row is owned by the originating user, not the
    // calling app id.
    expect(rows[0].ownerEmail).toBe("alice@test.local");
    expect(rows[0].ownerEmail).not.toBe("tasks");
    expect(rows[0].ownerEmail).not.toBe("app:tasks");
    expect(rows[0].sourceApp).toBe("tasks");
    expect(rows[0].sourceId).toBe("task-42");
  });

  it("calendar.create-event with withNotes:true tags the note as a calendar source", async () => {
    const capabilities = await loadNotesCapabilities();

    const calendarCreateEvent: ActionLike = {
      tool: { description: "Create a calendar event with linked prep notes." },
      run: async (
        args: { title: string; eventId: string; withNotes?: boolean },
        ctx: any,
      ) => {
        if (!args.withNotes) return { eventId: args.eventId };
        const note = await ctx.call("notes.create-note", {
          title: `Prep — ${args.title}`,
          sourceApp: "calendar",
          sourceType: "event",
          sourceId: args.eventId,
        });
        return { eventId: args.eventId, linkedNoteId: note.id };
      },
    };

    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: {
        ...capabilities,
        "calendar.create-event": calendarCreateEvent,
      },
    });

    await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "calendar.create-event",
        input: { title: "Sync", eventId: "evt-1", withNotes: true },
        user: aliceUser,
      }),
    );

    const rows = await fixture.db.select().from(schema.notes);
    expect(rows).toHaveLength(1);
    expect(rows[0].ownerEmail).toBe("alice@test.local");
    expect(rows[0].sourceApp).toBe("calendar");
    expect(rows[0].sourceId).toBe("evt-1");
  });
});
