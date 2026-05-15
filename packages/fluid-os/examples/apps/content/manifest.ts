import { z } from "zod";
import { defineApp } from "../../../src/manifest/index.js";

interface Doc {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

const docs = new Map<string, Doc>();

const docSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const contentApp = defineApp({
  id: "content",
  name: "Content",
  description: "Long-form documents: meeting notes, briefs, drafts, knowledge base.",
  icon: "file-text",
  url: "http://localhost:4113",
  routes: [
    { path: "/", label: "All documents" },
    { path: "/new", label: "New document" },
  ],
  agentGuidance:
    "Content is the canonical owner of long-form documents. Meeting notes, briefs, knowledge-base articles — all of them go through content.create-document. Slides and meetings seed from content; never duplicate it.",
  capabilities: {
    "create-document": {
      description: "Create a document. Returns the saved document.",
      input: z.object({ title: z.string().min(1), body: z.string().default("") }),
      output: docSchema,
      tags: ["write"],
      handler: async (input, ctx) => {
        const id = `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const now = Date.now();
        const doc: Doc = { id, title: input.title, body: input.body, ownerId: ctx.user.id, createdAt: now, updatedAt: now };
        docs.set(id, doc);
        const { ownerId: _o, ...rest } = doc;
        return rest;
      },
    },
    "get-document": {
      description: "Read a document by id.",
      input: z.object({ id: z.string() }),
      output: docSchema.nullable(),
      tags: ["read"],
      handler: async (input, ctx) => {
        const doc = docs.get(input.id);
        if (!doc || doc.ownerId !== ctx.user.id) return null;
        const { ownerId: _o, ...rest } = doc;
        return rest;
      },
    },
    "list-documents": {
      description: "List all documents owned by the user, newest first.",
      input: z.object({}).optional(),
      output: z.array(docSchema),
      tags: ["read"],
      handler: async (_input, ctx) => {
        return Array.from(docs.values())
          .filter((d) => d.ownerId === ctx.user.id)
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map(({ ownerId: _o, ...rest }) => rest);
      },
    },
    "search-documents": {
      description: "Search documents by case-insensitive title or body substring.",
      input: z.object({ q: z.string().min(1) }),
      output: z.array(z.object({ id: z.string(), title: z.string() })),
      tags: ["read"],
      handler: async (input, ctx) => {
        const q = input.q.toLowerCase();
        return Array.from(docs.values())
          .filter(
            (d) =>
              d.ownerId === ctx.user.id &&
              (d.title.toLowerCase().includes(q) || d.body.toLowerCase().includes(q)),
          )
          .map((d) => ({ id: d.id, title: d.title }));
      },
    },
  },
});
