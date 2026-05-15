import { z } from "zod";
import { defineApp } from "../../../src/manifest/index.js";

interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  ownerId: string;
}

const notes = new Map<string, Note>();

export const notesApp = defineApp({
  id: "notes",
  name: "Notes",
  description: "A tiny notes app — the canonical place to store a snippet of text.",
  icon: "file-text",
  url: "http://localhost:4101",
  routes: [
    { path: "/", label: "All notes" },
    { path: "/new", label: "New note" },
  ],
  capabilities: {
    create: {
      description: "Create a new note. Returns the created note.",
      input: z.object({ title: z.string().min(1), body: z.string().default("") }),
      output: z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
        createdAt: z.number(),
        ownerId: z.string(),
      }),
      handler: async (input, ctx) => {
        const note: Note = {
          id: `note_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          title: input.title,
          body: input.body,
          createdAt: Date.now(),
          ownerId: ctx.user.id,
        };
        notes.set(note.id, note);
        return note;
      },
    },
    list: {
      description: "List all notes owned by the current user.",
      input: z.object({}).optional(),
      output: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          body: z.string(),
          createdAt: z.number(),
          ownerId: z.string(),
        }),
      ),
      handler: async (_input, ctx) => {
        return Array.from(notes.values()).filter((n) => n.ownerId === ctx.user.id);
      },
    },
    search: {
      description: "Search notes by case-insensitive title substring.",
      input: z.object({ q: z.string().min(1) }),
      output: z.array(z.object({ id: z.string(), title: z.string() })),
      handler: async (input, ctx) => {
        const q = input.q.toLowerCase();
        return Array.from(notes.values())
          .filter((n) => n.ownerId === ctx.user.id && n.title.toLowerCase().includes(q))
          .map((n) => ({ id: n.id, title: n.title }));
      },
    },
  },
});
