import { z } from "zod";
import { defineApp } from "../../../src/manifest/index.js";

interface Event {
  id: string;
  title: string;
  startsAt: number;
  endsAt: number;
  attendees: string[];
  ownerId: string;
  description?: string;
}

const events = new Map<string, Event>();

const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  startsAt: z.number(),
  endsAt: z.number(),
  attendees: z.array(z.string()),
  description: z.string().optional(),
});

export const calendarApp = defineApp({
  id: "calendar",
  name: "Calendar",
  description: "Read, create, and find availability on the user's calendar.",
  icon: "calendar",
  url: "http://localhost:4112",
  routes: [
    { path: "/", label: "Day" },
    { path: "/week", label: "Week" },
  ],
  capabilities: {
    "create-event": {
      description: "Schedule an event. Times are unix milliseconds. Attendees are email addresses.",
      input: z.object({
        title: z.string().min(1),
        startsAt: z.number(),
        endsAt: z.number(),
        attendees: z.array(z.string().email()).default([]),
        description: z.string().optional(),
      }),
      output: eventSchema,
      tags: ["write", "scheduling"],
      handler: async (input, ctx) => {
        if (input.endsAt <= input.startsAt) throw new Error("endsAt must be > startsAt");
        const id = `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const evt: Event = { id, ...input, ownerId: ctx.user.id };
        events.set(id, evt);
        const { ownerId: _o, ...rest } = evt;
        return rest;
      },
    },
    "list-events": {
      description: "List upcoming events for the user in a time window.",
      input: z
        .object({
          from: z.number().optional(),
          to: z.number().optional(),
        })
        .optional(),
      output: z.array(eventSchema),
      tags: ["read"],
      handler: async (input, ctx) => {
        const from = input?.from ?? 0;
        const to = input?.to ?? Number.MAX_SAFE_INTEGER;
        return Array.from(events.values())
          .filter((e) => e.ownerId === ctx.user.id && e.startsAt >= from && e.endsAt <= to)
          .sort((a, b) => a.startsAt - b.startsAt)
          .map(({ ownerId: _o, ...rest }) => rest);
      },
    },
    "check-availability": {
      description: "Return whether the user is free in the given window.",
      input: z.object({ startsAt: z.number(), endsAt: z.number() }),
      output: z.object({ free: z.boolean(), conflictsWith: z.array(z.string()) }),
      tags: ["read", "scheduling"],
      handler: async (input, ctx) => {
        const conflicts = Array.from(events.values())
          .filter((e) => e.ownerId === ctx.user.id)
          .filter((e) => e.startsAt < input.endsAt && e.endsAt > input.startsAt)
          .map((e) => e.id);
        return { free: conflicts.length === 0, conflictsWith: conflicts };
      },
    },
  },
});
