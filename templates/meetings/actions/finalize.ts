/**
 * meetings.finalize — turn one meeting into one note + N tasks via the agent.
 *
 * Big-picture flow (per docs/apps/meetings.md):
 *   1. Read the transcript + prep notes + attendees.
 *   2. Delegate to the agent chat for { summary, bullets, actionItems[] }.
 *      In tests we accept a pre-baked `agentOutput` arg so the fan-out can
 *      be exercised without a real agent loop.
 *   3. Insert 3 `meeting_summaries` rows (one per kind).
 *   4. Call `notes.create` once with the markdown summary → store
 *      `meeting.linkedNoteId`.
 *   5. Insert one `meeting_followups` row per action item, then call
 *      `tasks.create` per followup (best-effort) and store the returned
 *      task id on the followup.
 *   6. Flip `meeting.status` to "done".
 *
 * Idempotency: rerunning replaces summary + followup rows. Best-effort
 * `tasks.delete` is fired for the previous task ids so we don't leak
 * orphaned tasks. Failures in `tasks.delete` are logged, not thrown.
 *
 * NEVER inline an LLM call here. The agent chat is the only AI surface.
 * The actual AI delegation is queued via `application_state` (the same
 * pattern as meeting-notes/actions/enhance-notes.ts) when no
 * `agentOutput` is supplied. The agent then calls back into the
 * `meetings.finalize` action with the populated output.
 */
import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import { assertAccess } from "@agent-native/core/sharing";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";
import { nanoid } from "../server/lib/meetings.js";
import { dispatchCrossApp } from "../server/lib/dispatch.js";

const actionItemSchema = z.object({
  text: z.string().min(1),
  assigneeEmail: z.string().optional().nullable(),
  assigneeName: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

const agentOutputSchema = z.object({
  summary: z.string().min(1),
  bullets: z.array(z.string()),
  actionItems: z.array(actionItemSchema),
  provider: z.string().optional(),
});

export type AgentOutput = z.infer<typeof agentOutputSchema>;

export default defineAction({
  description:
    "Finalize a meeting: generate summary/bullets/action-items via the agent, write summary as a note, fan out tasks. Idempotent (rerunning replaces prior outputs).",
  schema: z.object({
    meetingId: z.string(),
    overrideTranscript: z
      .string()
      .optional()
      .describe("Override transcript text — for tests / replays only."),
    /**
     * When the agent calls back with its output, the result is passed
     * here directly so we can run the fan-out without re-prompting.
     * When omitted, the caller is the original UI/agent request and we
     * just queue the delegation (handled below).
     */
    agentOutput: agentOutputSchema.optional(),
  }),
  run: async (args) => {
    await assertAccess("meeting", args.meetingId, "editor");

    const db = getDb();
    const nowIso = new Date().toISOString();

    const [meeting] = await db
      .select()
      .from(schema.meetings)
      .where(eq(schema.meetings.id, args.meetingId));

    if (!meeting) throw new Error(`Meeting not found: ${args.meetingId}`);

    // ── If no agentOutput, queue the delegation and return ──────────────
    if (!args.agentOutput) {
      const [transcript] = await db
        .select()
        .from(schema.meetingTranscripts)
        .where(eq(schema.meetingTranscripts.meetingId, args.meetingId));

      const transcriptText =
        args.overrideTranscript ?? transcript?.fullText ?? "";

      const attendees = await db
        .select()
        .from(schema.meetingAttendees)
        .where(eq(schema.meetingAttendees.meetingId, args.meetingId));

      await db
        .update(schema.meetings)
        .set({ status: "finalizing", updatedAt: nowIso })
        .where(eq(schema.meetings.id, args.meetingId));

      await writeAppState(`notes-ai-request-${args.meetingId}`, {
        kind: "finalize-meeting" as const,
        meetingId: args.meetingId,
        meetingTitle: meeting.title,
        startsAt: meeting.startsAt,
        prepNotes: meeting.prepNotes,
        transcriptText,
        attendees: attendees.map((a) => ({
          name: a.name,
          email: a.email,
          role: a.role,
        })),
        requestedAt: nowIso,
        message:
          `Finalize meeting "${meeting.title}" (id: ${args.meetingId}). ` +
          `Produce a 2-3 paragraph markdown summary, 5-7 bullet highlights, ` +
          `and an action-items array shaped { text, assigneeEmail?, dueDate? }. ` +
          `Then call meetings.finalize again with --agentOutput='<json>' to ` +
          `commit the result. One action item per concrete commitment — do ` +
          `not group by attendee.`,
      } as any);
      await writeAppState("refresh-signal", { ts: Date.now() });

      return {
        meetingId: args.meetingId,
        summaryNoteId: "",
        taskIds: [],
        followupIds: [],
        queued: true,
      };
    }

    // ── agentOutput provided — run the fan-out ──────────────────────────
    const output = args.agentOutput;

    // Idempotency: capture previous task ids so we can best-effort delete
    // them after the new fan-out completes.
    const previousFollowups = await db
      .select()
      .from(schema.meetingFollowups)
      .where(eq(schema.meetingFollowups.meetingId, args.meetingId));
    const previousTaskIds = previousFollowups
      .map((f) => f.taskId)
      .filter((id): id is string => Boolean(id));

    // Wipe previous summaries + followups in this meeting.
    await db
      .delete(schema.meetingSummaries)
      .where(eq(schema.meetingSummaries.meetingId, args.meetingId));
    await db
      .delete(schema.meetingFollowups)
      .where(eq(schema.meetingFollowups.meetingId, args.meetingId));

    // 3 summary rows (one per kind).
    const summaryRows = [
      {
        id: nanoid(),
        meetingId: args.meetingId,
        kind: "summary" as const,
        content: output.summary,
        generatedAt: nowIso,
        provider: output.provider ?? null,
      },
      {
        id: nanoid(),
        meetingId: args.meetingId,
        kind: "bullets" as const,
        content: JSON.stringify(output.bullets),
        generatedAt: nowIso,
        provider: output.provider ?? null,
      },
      {
        id: nanoid(),
        meetingId: args.meetingId,
        kind: "action_items" as const,
        content: JSON.stringify(output.actionItems),
        generatedAt: nowIso,
        provider: output.provider ?? null,
      },
    ];
    for (const row of summaryRows) {
      await db.insert(schema.meetingSummaries).values(row as any);
    }

    // Followups (one row per action item). Insert BEFORE tasks so we
    // always have a stable id for the task to reference back.
    const followups = output.actionItems.map((item) => ({
      id: nanoid(),
      meetingId: args.meetingId,
      text: item.text,
      assigneeEmail: item.assigneeEmail ?? null,
      assigneeName: item.assigneeName ?? null,
      dueDate: item.dueDate ?? null,
      createdAt: nowIso,
    }));
    for (const f of followups) {
      const { assigneeName: _drop, ...row } = f;
      await db.insert(schema.meetingFollowups).values({
        ...row,
        taskId: null,
      } as any);
    }

    // Call notes.create-note with the summary. Failure is recorded as a
    // warning but does NOT prevent the meeting from being marked `done`.
    let summaryNoteId = "";
    try {
      const note = (await dispatchCrossApp("notes.create-note", {
        title: `${meeting.title} — Notes`,
        body: output.summary,
        sourceApp: "meetings",
        sourceType: "meeting",
        sourceId: args.meetingId,
      })) as { id?: string } | null;
      summaryNoteId = note?.id ?? "";
    } catch (err) {
      console.warn(
        `[meetings.finalize] notes.create-note failed (continuing): ${err}`,
      );
    }

    // Fan out tasks. Each failure is recorded as a non-fatal warning so
    // we still flip the meeting to `done`.
    const taskIds: string[] = [];
    const warnings: string[] = [];
    for (let i = 0; i < followups.length; i++) {
      const followup = followups[i];
      const assigneeLabel =
        followup.assigneeName ||
        followup.assigneeEmail?.split("@")[0] ||
        "Someone";
      try {
        const task = (await dispatchCrossApp("tasks.create", {
          text: `${assigneeLabel}: ${followup.text}`,
          alsoNote: false,
          dueDate: followup.dueDate ?? undefined,
        })) as { id?: string } | null;
        if (task?.id) {
          taskIds.push(task.id);
          await db
            .update(schema.meetingFollowups)
            .set({ taskId: task.id })
            .where(eq(schema.meetingFollowups.id, followup.id));
        } else {
          warnings.push(
            `tasks.create returned no id for followup ${followup.id}`,
          );
        }
      } catch (err) {
        warnings.push(
          `tasks.create failed for followup ${followup.id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    // Best-effort cleanup of previous task rows (idempotency).
    for (const oldTaskId of previousTaskIds) {
      try {
        await dispatchCrossApp("tasks.delete", { id: oldTaskId });
      } catch (err) {
        console.warn(
          `[meetings.finalize] tasks.delete failed for ${oldTaskId} (non-fatal): ${err}`,
        );
      }
    }

    // Update meeting: linkedNoteId + status=done.
    await db
      .update(schema.meetings)
      .set({
        status: "done",
        linkedNoteId: summaryNoteId || null,
        updatedAt: nowIso,
      })
      .where(eq(schema.meetings.id, args.meetingId));

    await writeAppState("refresh-signal", { ts: Date.now() });

    return {
      meetingId: args.meetingId,
      summaryNoteId,
      taskIds,
      followupIds: followups.map((f) => f.id),
      provider: output.provider,
      ...(warnings.length ? { warnings } : {}),
    };
  },
});

