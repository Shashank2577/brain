import { defineAction } from "@agent-native/core";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { callCapability, RpcError } from "@agent-native/core/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
);

/**
 * Create a task. Preserves the `alsoNote` flag from the legacy manifest:
 * when true, dispatches the `notes.create-note` capability via the Phase 1
 * registry so the new note is owned by the calling user (identity propagates
 * through `runWithRequestContext`).
 *
 * If the `notes` app is not installed or `notes.create-note` throws, the
 * task is still created with `linkedNoteId: null`. The non-fatal failure is
 * returned in `linkWarning` so the UI can toast it without rolling back.
 */
export default defineAction({
  description:
    "Create a task. Optionally also create a linked note via the notes app.",
  schema: z.object({
    text: z.string().min(1).max(500).describe("Task text (required)"),
    alsoNote: z
      .boolean()
      .default(false)
      .describe(
        "If true, also create a notes.create-note entry with the same text and store the resulting note id on the task.",
      ),
    dueDate: z
      .string()
      .datetime()
      .optional()
      .describe("Optional due date (ISO-8601)"),
    priority: z
      .enum(["low", "normal", "high", "urgent"])
      .optional()
      .describe("Optional priority bucket"),
  }),
  run: async (args) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) {
      throw new Error("no authenticated user");
    }
    const orgId = getRequestOrgId();

    let linkedNoteId: string | null = null;
    let linkWarning: string | null = null;

    if (args.alsoNote) {
      // Item A3: cross-app calls go through `callCapability` from core. The
      // helper picks the in-process fast path when this code runs inside
      // dispatch, and the signed-identity HTTP path when it runs in any
      // other worker. Either way the propagated identity is the current
      // user (read from the ALS request context), never the calling app.
      try {
        const out = await callCapability<{ id?: string } | undefined>(
          "notes.create-note",
          { title: args.text, body: "" },
        );
        linkedNoteId = out?.id ?? null;
        if (!linkedNoteId) {
          linkWarning =
            "notes.create-note returned no id; task created without link";
        }
      } catch (err) {
        if (err instanceof RpcError) {
          linkWarning = `notes.create-note failed: ${err.code} — ${err.message}`;
        } else {
          linkWarning = `notes.create-note threw: ${(err as Error).message}`;
        }
      }
    }

    const id = `task_${nanoid(10)}`;
    const now = new Date().toISOString();
    const dueDate = args.dueDate ?? null;
    const priority = args.priority ?? null;
    const visibility = "private" as const;

    const db = getDb();
    await db.insert(schema.tasks).values({
      id,
      text: args.text,
      linkedNoteId,
      dueDate,
      priority,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      ownerEmail,
      orgId,
      visibility,
    });

    return {
      id,
      text: args.text,
      completed: false,
      completedAt: null,
      linkedNoteId,
      dueDate,
      priority,
      linkWarning,
      createdAt: now,
      updatedAt: now,
    };
  },
});
