import { z } from "zod";
import { defineApp } from "../../../src/manifest/index.js";

interface Task {
  id: string;
  text: string;
  done: boolean;
  ownerId: string;
  linkedNoteId?: string;
}

const tasks = new Map<string, Task>();

export const tasksApp = defineApp({
  id: "tasks",
  name: "Tasks",
  description: "A tiny todo app. Demonstrates calling another app — it can link tasks to notes via the notes app.",
  icon: "checkbox",
  url: "http://localhost:4102",
  consumes: ["notes.create", "notes.list"],
  routes: [
    { path: "/", label: "All tasks" },
  ],
  capabilities: {
    create: {
      description: "Create a task. If `alsoNote` is true, also creates a notes.create entry with the same text.",
      input: z.object({ text: z.string().min(1), alsoNote: z.boolean().default(false) }),
      output: z.object({
        id: z.string(),
        text: z.string(),
        done: z.boolean(),
        linkedNoteId: z.string().optional(),
      }),
      handler: async (input, ctx) => {
        let linkedNoteId: string | undefined;
        if (input.alsoNote) {
          const note = (await ctx.call("notes.create", { title: input.text, body: "" })) as { id: string };
          linkedNoteId = note.id;
        }
        const task: Task = {
          id: `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          text: input.text,
          done: false,
          ownerId: ctx.user.id,
          linkedNoteId,
        };
        tasks.set(task.id, task);
        return { id: task.id, text: task.text, done: task.done, linkedNoteId };
      },
    },
    list: {
      description: "List all tasks owned by the current user.",
      input: z.object({}).optional(),
      output: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
          done: z.boolean(),
          linkedNoteId: z.string().optional(),
        }),
      ),
      handler: async (_input, ctx) => {
        return Array.from(tasks.values())
          .filter((t) => t.ownerId === ctx.user.id)
          .map(({ ownerId: _o, ...rest }) => rest);
      },
    },
    complete: {
      description: "Mark a task as done.",
      input: z.object({ id: z.string() }),
      output: z.object({ id: z.string(), done: z.boolean() }),
      handler: async (input, ctx) => {
        const t = tasks.get(input.id);
        if (!t || t.ownerId !== ctx.user.id) throw new Error("Task not found");
        t.done = true;
        return { id: t.id, done: t.done };
      },
    },
  },
});
