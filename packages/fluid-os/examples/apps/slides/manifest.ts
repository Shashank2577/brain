import { z } from "zod";
import { defineApp } from "../../../src/manifest/index.js";

interface Slide {
  title: string;
  body: string;
}

interface Deck {
  id: string;
  title: string;
  slides: Slide[];
  sourceDocId?: string;
  ownerId: string;
  createdAt: number;
}

const decks = new Map<string, Deck>();

const slideSchema = z.object({ title: z.string(), body: z.string() });
const deckSchema = z.object({
  id: z.string(),
  title: z.string(),
  slides: z.array(slideSchema),
  sourceDocId: z.string().optional(),
  createdAt: z.number(),
});

export const slidesApp = defineApp({
  id: "slides",
  name: "Slides",
  description: "Create and edit presentation decks. Can be seeded from a content.* document.",
  icon: "presentation",
  url: "http://localhost:4114",
  consumes: ["content.get-document", "content.search-documents"],
  routes: [
    { path: "/", label: "All decks" },
  ],
  capabilities: {
    "create-deck": {
      description: "Create an empty deck with a title slide.",
      input: z.object({ title: z.string().min(1) }),
      output: deckSchema,
      tags: ["write"],
      handler: async (input, ctx) => {
        const id = `deck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const deck: Deck = {
          id,
          title: input.title,
          slides: [{ title: input.title, body: "" }],
          ownerId: ctx.user.id,
          createdAt: Date.now(),
        };
        decks.set(id, deck);
        const { ownerId: _o, ...rest } = deck;
        return rest;
      },
    },
    "create-deck-from-document": {
      description:
        "Create a deck whose slides are derived from a content document. Calls content.get-document.",
      input: z.object({ documentId: z.string(), maxSlides: z.number().int().positive().max(50).default(10) }),
      output: deckSchema,
      tags: ["write", "cross-app"],
      handler: async (input, ctx) => {
        const doc = (await ctx.call("content.get-document", { id: input.documentId })) as
          | { id: string; title: string; body: string }
          | null;
        if (!doc) throw new Error(`Document ${input.documentId} not found or not readable`);

        const paragraphs = doc.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
        const slides: Slide[] = [{ title: doc.title, body: "" }];
        for (const p of paragraphs.slice(0, input.maxSlides - 1)) {
          const firstLine = p.split("\n")[0].slice(0, 60);
          slides.push({ title: firstLine, body: p });
        }

        const id = `deck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const deck: Deck = { id, title: doc.title, slides, sourceDocId: doc.id, ownerId: ctx.user.id, createdAt: Date.now() };
        decks.set(id, deck);
        const { ownerId: _o, ...rest } = deck;
        return rest;
      },
    },
    "list-decks": {
      description: "List all decks owned by the user, newest first.",
      input: z.object({}).optional(),
      output: z.array(deckSchema),
      tags: ["read"],
      handler: async (_input, ctx) => {
        return Array.from(decks.values())
          .filter((d) => d.ownerId === ctx.user.id)
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(({ ownerId: _o, ...rest }) => rest);
      },
    },
  },
});
