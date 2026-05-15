/**
 * The big finalize fan-out test.
 *
 * Given a meeting with a transcript and 3 action items, asserts:
 *   - 3 `meeting_summaries` rows exist (summary | bullets | action_items)
 *   - 3 `meeting_followups` rows exist (one per action item)
 *   - notes.create was called exactly ONCE with the summary as the body
 *   - tasks.create was called exactly N times (one per action item),
 *     each task text prefixed by the assignee name
 *   - meeting.linkedNoteId = the returned note id
 *   - meeting.status = "done"
 *   - Each followup.taskId is set to the matching tasks.create return id
 *
 * Cross-app calls are stubbed via the `__meetingsCallOtherApp` global hook,
 * which the action consults before falling back to its real dispatcher.
 *
 * This is the load-bearing test for the "N+1 cross-app rows exist" claim
 * (1 note + N tasks).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Stub state ────────────────────────────────────────────────────────────
type Row = Record<string, unknown>;

const meetingsRows: Row[] = [];
const transcriptsRows: Row[] = [];
const summariesRows: Row[] = [];
const followupsRows: Row[] = [];
const attendeesRows: Row[] = [];

function reset() {
  meetingsRows.length = 0;
  transcriptsRows.length = 0;
  summariesRows.length = 0;
  followupsRows.length = 0;
  attendeesRows.length = 0;
}

// Simple chainable query builder — supports the shapes the finalize
// action actually uses (.select.from.where, .insert.values,
// .update.set.where, .delete.where).
function buildQuery(rows: Row[]) {
  return {
    select: () => ({
      from: () => ({
        where: (_clause: any) => Promise.resolve([...rows]),
      }),
    }),
    insert: () => ({
      values: (v: Row) => {
        rows.push({ ...v });
        return Promise.resolve();
      },
    }),
    update: () => ({
      set: (patch: Row) => ({
        where: (_clause: { __row?: Row; __field?: string; __value?: unknown }) => {
          const target = _clause?.__field;
          const value = _clause?.__value;
          for (const row of rows) {
            if (target === undefined || row[target] === value) {
              Object.assign(row, patch);
            }
          }
          return Promise.resolve();
        },
      }),
    }),
    delete: () => ({
      where: (_clause: { __field?: string; __value?: unknown }) => {
        const target = _clause?.__field;
        const value = _clause?.__value;
        for (let i = rows.length - 1; i >= 0; i--) {
          if (target === undefined || rows[i][target] === value) {
            rows.splice(i, 1);
          }
        }
        return Promise.resolve();
      },
    }),
  };
}

const mockDb = {
  select: () => ({
    from: (table: { __tag: string }) => ({
      where: (_clause: any) => {
        if (table.__tag === "meetings") return Promise.resolve([...meetingsRows]);
        if (table.__tag === "transcripts")
          return Promise.resolve([...transcriptsRows]);
        if (table.__tag === "summaries")
          return Promise.resolve([...summariesRows]);
        if (table.__tag === "followups")
          return Promise.resolve([...followupsRows]);
        if (table.__tag === "attendees")
          return Promise.resolve([...attendeesRows]);
        return Promise.resolve([]);
      },
    }),
  }),
  insert: (table: { __tag: string }) => ({
    values: (v: Row) => {
      if (table.__tag === "meetings") meetingsRows.push({ ...v });
      else if (table.__tag === "transcripts") transcriptsRows.push({ ...v });
      else if (table.__tag === "summaries") summariesRows.push({ ...v });
      else if (table.__tag === "followups") followupsRows.push({ ...v });
      else if (table.__tag === "attendees") attendeesRows.push({ ...v });
      return Promise.resolve();
    },
  }),
  update: (table: { __tag: string }) => ({
    set: (patch: Row) => ({
      where: (clause: { __field?: string; __value?: unknown }) => {
        const rows =
          table.__tag === "meetings"
            ? meetingsRows
            : table.__tag === "transcripts"
              ? transcriptsRows
              : table.__tag === "summaries"
                ? summariesRows
                : table.__tag === "followups"
                  ? followupsRows
                  : table.__tag === "attendees"
                    ? attendeesRows
                    : [];
        for (const row of rows) {
          if (
            clause?.__field === undefined ||
            row[clause.__field] === clause.__value
          ) {
            Object.assign(row, patch);
          }
        }
        return Promise.resolve();
      },
    }),
  }),
  delete: (table: { __tag: string }) => ({
    where: (clause: { __field?: string; __value?: unknown }) => {
      const rows =
        table.__tag === "summaries"
          ? summariesRows
          : table.__tag === "followups"
            ? followupsRows
            : [];
      for (let i = rows.length - 1; i >= 0; i--) {
        if (clause?.__field === undefined || rows[i][clause.__field] === clause.__value) {
          rows.splice(i, 1);
        }
      }
      return Promise.resolve();
    },
  }),
};

vi.mock("../server/db/index.js", () => ({
  getDb: () => mockDb,
  schema: {
    meetings: { __tag: "meetings", id: "id" },
    meetingShares: { __tag: "meeting_shares" },
    meetingTranscripts: { __tag: "transcripts", meetingId: "meetingId" },
    meetingAttendees: { __tag: "attendees", meetingId: "meetingId" },
    meetingSummaries: { __tag: "summaries", meetingId: "meetingId" },
    meetingFollowups: {
      __tag: "followups",
      meetingId: "meetingId",
      id: "id",
    },
  },
}));

vi.mock("@agent-native/core/sharing", () => ({
  accessFilter: () => ({}),
  assertAccess: () => Promise.resolve(),
}));

vi.mock("@agent-native/core/application-state", () => ({
  writeAppState: () => Promise.resolve(),
  readAppState: () => Promise.resolve(null),
}));

vi.mock("drizzle-orm", () => ({
  eq: (column: { __field?: string } | string, value: unknown) => ({
    __field:
      typeof column === "string" ? column : (column.__field ?? undefined),
    __value: value,
  }),
}));

import action from "./finalize";

beforeEach(() => {
  reset();
  // Seed a meeting + transcript + attendees.
  meetingsRows.push({
    id: "mtg_1",
    title: "Q3 Roadmap Sync",
    startsAt: "2026-05-15T16:00:00.000Z",
    endsAt: "2026-05-15T17:00:00.000Z",
    status: "scheduled",
    ownerEmail: "owner@example.com",
    prepNotes: "",
    linkedNoteId: null,
    calendarEventId: null,
    createdAt: "2026-05-15T15:00:00.000Z",
    updatedAt: "2026-05-15T15:00:00.000Z",
  });
  transcriptsRows.push({
    id: "tr_1",
    meetingId: "mtg_1",
    fullText: "[alice] We should ship next week.\n[bob] I'll write the docs.",
    status: "ready",
    source: "manual",
    segmentsJson: "[]",
  });
  attendeesRows.push(
    {
      id: "att_a",
      meetingId: "mtg_1",
      email: "alice@example.com",
      name: "Alice",
      role: "organizer",
      isOwner: true,
    },
    {
      id: "att_b",
      meetingId: "mtg_1",
      email: "bob@example.com",
      name: "Bob",
      role: "required",
      isOwner: false,
    },
  );
});

afterEach(() => {
  delete (globalThis as any).__meetingsCallOtherApp;
});

const baseOutput = {
  summary:
    "The team agreed to ship the v2 roadmap next week. Alice will own the launch checklist; Bob will write the public docs; Carol will book the all-hands.",
  bullets: [
    "Ship v2 next week",
    "Docs need a refresh",
    "All-hands scheduled",
  ],
  actionItems: [
    {
      text: "Write the launch checklist",
      assigneeEmail: "alice@example.com",
      assigneeName: "Alice",
      dueDate: "2026-05-22",
    },
    {
      text: "Draft public-facing docs",
      assigneeEmail: "bob@example.com",
      assigneeName: "Bob",
      dueDate: null,
    },
    {
      text: "Book the all-hands room",
      assigneeEmail: "carol@example.com",
      assigneeName: "Carol",
      dueDate: "2026-05-20",
    },
  ],
  provider: "test-stub",
};

describe("meetings.finalize fan-out", () => {
  it("creates 3 summary rows, 3 followup rows, 1 note, and 3 tasks", async () => {
    const callLog: Array<{ fqid: string; input: any }> = [];
    (globalThis as any).__meetingsCallOtherApp = async (
      fqid: string,
      input: any,
    ) => {
      callLog.push({ fqid, input });
      if (fqid === "notes.create-note") return { id: "note_xyz" };
      if (fqid === "tasks.create") {
        return { id: `task_${callLog.filter((c) => c.fqid === "tasks.create").length}` };
      }
      return null;
    };

    const result = await action.run({
      meetingId: "mtg_1",
      agentOutput: baseOutput,
    });

    // Summary rows — 3 per kind.
    expect(summariesRows).toHaveLength(3);
    const kinds = summariesRows.map((s) => s.kind).sort();
    expect(kinds).toEqual(["action_items", "bullets", "summary"]);

    // Followups — one per action item.
    expect(followupsRows).toHaveLength(3);
    // Every followup got its taskId stamped.
    for (const f of followupsRows) {
      expect(f.taskId).toMatch(/^task_/);
    }

    // notes.create called exactly once with the summary as body.
    const notesCalls = callLog.filter((c) => c.fqid === "notes.create-note");
    expect(notesCalls).toHaveLength(1);
    expect(notesCalls[0].input.body).toBe(baseOutput.summary);
    expect(notesCalls[0].input.title).toContain("Q3 Roadmap Sync");
    expect(notesCalls[0].input.sourceApp).toBe("meetings");
    expect(notesCalls[0].input.sourceId).toBe("mtg_1");

    // tasks.create called exactly once per action item (3 total).
    const taskCalls = callLog.filter((c) => c.fqid === "tasks.create");
    expect(taskCalls).toHaveLength(3);
    // Each task text prefixed with the assignee name.
    expect(taskCalls[0].input.text).toBe(
      "Alice: Write the launch checklist",
    );
    expect(taskCalls[1].input.text).toBe("Bob: Draft public-facing docs");
    expect(taskCalls[2].input.text).toBe("Carol: Book the all-hands room");
    // Each task gets the followup's dueDate (when present).
    expect(taskCalls[0].input.dueDate).toBe("2026-05-22");
    expect(taskCalls[2].input.dueDate).toBe("2026-05-20");

    // Meeting was flipped to done, linkedNoteId set.
    const [meeting] = meetingsRows;
    expect(meeting.status).toBe("done");
    expect(meeting.linkedNoteId).toBe("note_xyz");

    // Output summary.
    expect(result.summaryNoteId).toBe("note_xyz");
    expect(result.taskIds).toEqual(["task_1", "task_2", "task_3"]);
    expect(result.followupIds).toHaveLength(3);
  });

  it("produces per-item tasks for duplicate assignees (not grouped by attendee)", async () => {
    const taskCalls: Array<{ text: string }> = [];
    (globalThis as any).__meetingsCallOtherApp = async (
      fqid: string,
      input: any,
    ) => {
      if (fqid === "notes.create-note") return { id: "note_x" };
      if (fqid === "tasks.create") {
        taskCalls.push({ text: input.text });
        return { id: `task_${taskCalls.length}` };
      }
      return null;
    };

    await action.run({
      meetingId: "mtg_1",
      agentOutput: {
        ...baseOutput,
        actionItems: [
          {
            text: "Update the spec",
            assigneeEmail: "alice@example.com",
            assigneeName: "Alice",
          },
          {
            text: "Send the kickoff email",
            assigneeEmail: "alice@example.com",
            assigneeName: "Alice",
          },
        ],
      },
    });

    // Two tasks, both for Alice — per-item, not grouped.
    expect(taskCalls).toHaveLength(2);
    expect(taskCalls[0].text).toBe("Alice: Update the spec");
    expect(taskCalls[1].text).toBe("Alice: Send the kickoff email");
    expect(followupsRows).toHaveLength(2);
  });

  it("is idempotent — rerunning replaces summaries + followups", async () => {
    let taskCounter = 0;
    (globalThis as any).__meetingsCallOtherApp = async (
      fqid: string,
      _input: any,
    ) => {
      if (fqid === "notes.create-note") return { id: "note_x" };
      if (fqid === "tasks.create") {
        taskCounter += 1;
        return { id: `task_${taskCounter}` };
      }
      // tasks.delete is best-effort — just resolve.
      return null;
    };

    const first = await action.run({
      meetingId: "mtg_1",
      agentOutput: baseOutput,
    });

    const second = await action.run({
      meetingId: "mtg_1",
      agentOutput: baseOutput,
    });

    expect(summariesRows).toHaveLength(3); // Replaced, not duplicated.
    expect(followupsRows).toHaveLength(3); // Replaced.
    // Every taskId in the second result is new.
    for (const newId of second.taskIds) {
      expect(first.taskIds).not.toContain(newId);
    }
  });

  it("surfaces tasks.create failures as non-fatal warnings", async () => {
    (globalThis as any).__meetingsCallOtherApp = async (
      fqid: string,
      _input: any,
    ) => {
      if (fqid === "notes.create-note") return { id: "note_x" };
      if (fqid === "tasks.create") {
        const count =
          ((globalThis as any).__taskCallCount =
            ((globalThis as any).__taskCallCount ?? 0) + 1);
        if (count === 2) throw new Error("tasks app exploded");
        return { id: `task_${count}` };
      }
      return null;
    };

    const result = await action.run({
      meetingId: "mtg_1",
      agentOutput: baseOutput,
    });

    // The meeting still finalizes.
    expect(meetingsRows[0].status).toBe("done");
    // The failed followup has no taskId.
    const failed = followupsRows.find((f) => !f.taskId);
    expect(failed).toBeTruthy();
    // The response carries a non-fatal warning.
    expect((result as any).warnings).toBeTruthy();
    expect((result as any).warnings[0]).toMatch(/tasks\.create failed/);

    delete (globalThis as any).__taskCallCount;
  });
});

describe("meetings.finalize without agentOutput", () => {
  it("queues a delegation request and returns without fan-out", async () => {
    let dispatched = 0;
    (globalThis as any).__meetingsCallOtherApp = async () => {
      dispatched += 1;
      return null;
    };

    const result = await action.run({ meetingId: "mtg_1" });

    expect(dispatched).toBe(0); // No cross-app calls yet.
    expect(summariesRows).toHaveLength(0);
    expect(followupsRows).toHaveLength(0);
    expect(result.taskIds).toEqual([]);
    expect(result.summaryNoteId).toBe("");
    // Meeting flipped to `finalizing` while the agent works.
    expect(meetingsRows[0].status).toBe("finalizing");
  });
});
