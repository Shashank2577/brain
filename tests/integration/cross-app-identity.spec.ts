/**
 * Phase 7 — Cross-app identity propagation matrix.
 *
 * OS invariant: when app A calls a capability registered by app B via
 * `ctx.call(...)`, the resulting row on B's side must be owned by the
 * originating user — NOT the calling app's id and NOT app B's service
 * account. This test mounts a notes fixture and exercises every declared
 * inter-app dependency from `docs/apps/notes.md` (the only fully-fleshed
 * app spec with consumers) plus the documented `tasks → notes` and
 * `crm → activities` chains.
 *
 * If identity propagation breaks anywhere, this test fails and the build
 * blocks ship.
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

let fixture: NotesFixture;

beforeEach(() => {
  fixture = setupNotesFixture();
});

afterEach(() => {
  fixture.close();
  vi.clearAllMocks();
});

const aliceCtx = { userEmail: "alice@test.local", orgId: "org-acme" };
const aliceUser = {
  id: "alice@test.local",
  email: "alice@test.local",
  orgId: "org-acme",
};

async function loadNotesCreate(): Promise<ActionLike> {
  const mod = await import("../../templates/notes/actions/create-note");
  return mod.default as ActionLike;
}

interface CallerSpec {
  /** Calling app's FQID prefix, e.g. "tasks" */
  callerAppId: string;
  /** Capability name on the caller side, e.g. "create" */
  callerCapId: string;
  /** What inputs the test passes when invoking the caller's capability */
  callerInput: Record<string, unknown>;
  /** sourceApp/sourceType/sourceId expected on the resulting note row */
  expected: {
    sourceApp: string;
    sourceType: string;
    sourceId: string;
  };
  /** Stand-in implementation that wraps ctx.call("notes.create-note", ...) */
  build: () => ActionLike;
}

const callers: CallerSpec[] = [
  {
    callerAppId: "tasks",
    callerCapId: "create",
    callerInput: { title: "Ship", taskId: "task-1" },
    expected: { sourceApp: "tasks", sourceType: "task", sourceId: "task-1" },
    build: () => ({
      tool: { description: "Create a task with a linked note." },
      run: async (
        args: { title: string; taskId: string },
        ctx: any,
      ) => {
        await ctx.call("notes.create-note", {
          title: `Notes for ${args.title}`,
          sourceApp: "tasks",
          sourceType: "task",
          sourceId: args.taskId,
        });
        return { taskId: args.taskId };
      },
    }),
  },
  {
    callerAppId: "calendar",
    callerCapId: "create-event",
    callerInput: { title: "Quarterly review", eventId: "evt-1" },
    expected: { sourceApp: "calendar", sourceType: "event", sourceId: "evt-1" },
    build: () => ({
      tool: { description: "Create a calendar event with prep notes." },
      run: async (
        args: { title: string; eventId: string },
        ctx: any,
      ) => {
        await ctx.call("notes.create-note", {
          title: `Prep — ${args.title}`,
          sourceApp: "calendar",
          sourceType: "event",
          sourceId: args.eventId,
        });
        return { eventId: args.eventId };
      },
    }),
  },
  {
    callerAppId: "mail",
    callerCapId: "save-as-note",
    callerInput: { threadId: "thr-1", excerpt: "Important quote" },
    expected: { sourceApp: "mail", sourceType: "thread", sourceId: "thr-1" },
    build: () => ({
      tool: { description: "Save an email thread excerpt as a note." },
      run: async (
        args: { threadId: string; excerpt: string },
        ctx: any,
      ) => {
        await ctx.call("notes.create-note", {
          title: `Mail: ${args.threadId}`,
          body: args.excerpt,
          sourceApp: "mail",
          sourceType: "thread",
          sourceId: args.threadId,
        });
        return { threadId: args.threadId };
      },
    }),
  },
  {
    callerAppId: "crm",
    callerCapId: "log-note",
    callerInput: { contactId: "ct-1", text: "Initial call notes" },
    expected: { sourceApp: "crm", sourceType: "contact", sourceId: "ct-1" },
    build: () => ({
      tool: { description: "Log a note against a CRM contact." },
      run: async (
        args: { contactId: string; text: string },
        ctx: any,
      ) => {
        await ctx.call("notes.create-note", {
          title: `CRM note for ${args.contactId}`,
          body: args.text,
          sourceApp: "crm",
          sourceType: "contact",
          sourceId: args.contactId,
        });
        return { contactId: args.contactId };
      },
    }),
  },
];

describe("cross-app identity propagation matrix → notes.create-note", () => {
  for (const spec of callers) {
    const fqid = `${spec.callerAppId}.${spec.callerCapId}`;
    it(`${fqid} via ctx.call stamps ownerEmail = caller user (not app id)`, async () => {
      const notesCreate = await loadNotesCreate();
      const registry = await buildRegistry({
        templatesDir: "",
        staticCapabilities: {
          "notes.create-note": notesCreate,
          [fqid]: spec.build(),
        },
      });

      const result = await runWithRequestContext(aliceCtx, () =>
        dispatchCapability({
          registry,
          fqid,
          input: spec.callerInput,
          user: aliceUser,
        }),
      );

      expect(result.ok).toBe(true);

      const rows = await fixture.db.select().from(schema.notes);
      expect(rows).toHaveLength(1);

      // The OS invariant: identity is the originating user, not the
      // calling app id, not the called app id, not anonymous.
      expect(rows[0].ownerEmail).toBe("alice@test.local");
      expect(rows[0].ownerEmail).not.toBe(spec.callerAppId);
      expect(rows[0].ownerEmail).not.toBe(`app:${spec.callerAppId}`);
      expect(rows[0].ownerEmail).not.toBe("notes");
      expect(rows[0].ownerEmail).not.toBe("app:notes");
      expect(rows[0].ownerEmail).not.toBe("anonymous");

      // Source pointers propagate through the call so the caller's row
      // is findable via `notes.list-notes({ sourceApp, sourceType, sourceId })`.
      expect(rows[0].sourceApp).toBe(spec.expected.sourceApp);
      expect(rows[0].sourceType).toBe(spec.expected.sourceType);
      expect(rows[0].sourceId).toBe(spec.expected.sourceId);

      // Org id propagates too (the row is org-scoped to the caller's org).
      expect(rows[0].orgId).toBe("org-acme");
    });
  }

  it("multi-hop ctx.call preserves identity through both hops", async () => {
    // Simulates: meetings.finalize → tasks.create → notes.create-note. The
    // note row at the bottom of the chain must still be owned by alice.
    const notesCreate = await loadNotesCreate();
    const tasksCreate: ActionLike = {
      tool: { description: "Create a task with a linked note." },
      run: async (args: { title: string }, ctx: any) => {
        const note = await ctx.call("notes.create-note", {
          title: `Notes for ${args.title}`,
          sourceApp: "tasks",
          sourceType: "task",
          sourceId: "task-x",
        });
        return { taskId: "task-x", linkedNoteId: (note as { id: string }).id };
      },
    };
    const meetingsFinalize: ActionLike = {
      tool: { description: "Finalize a meeting; create action-item tasks." },
      run: async (args: { meetingId: string }, ctx: any) => {
        const result = await ctx.call("tasks.create", {
          title: `Follow-ups from ${args.meetingId}`,
        });
        return result;
      },
    };

    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: {
        "notes.create-note": notesCreate,
        "tasks.create": tasksCreate,
        "meetings.finalize": meetingsFinalize,
      },
    });

    const result = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "meetings.finalize",
        input: { meetingId: "mtg-7" },
        user: aliceUser,
      }),
    );

    expect(result.ok).toBe(true);

    const rows = await fixture.db.select().from(schema.notes);
    expect(rows).toHaveLength(1);
    expect(rows[0].ownerEmail).toBe("alice@test.local");
  });
});
