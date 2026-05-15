import { z } from "zod";
import { defineApp } from "../../../src/manifest/index.js";

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  notes?: string;
  ownerId: string;
  createdAt: number;
}

interface Deal {
  id: string;
  contactId: string;
  title: string;
  amount: number;
  stage: "lead" | "qualified" | "proposal" | "won" | "lost";
  ownerId: string;
  createdAt: number;
}

interface Activity {
  id: string;
  contactId: string;
  kind: "email" | "meeting" | "note";
  summary: string;
  ref?: { messageId?: string; eventId?: string };
  ownerId: string;
  at: number;
}

const contacts = new Map<string, Contact>();
const deals = new Map<string, Deal>();
const activities = new Map<string, Activity>();

const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  company: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.number(),
});
const dealSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  title: z.string(),
  amount: z.number(),
  stage: z.enum(["lead", "qualified", "proposal", "won", "lost"]),
  createdAt: z.number(),
});
const activitySchema = z.object({
  id: z.string(),
  contactId: z.string(),
  kind: z.enum(["email", "meeting", "note"]),
  summary: z.string(),
  ref: z.object({ messageId: z.string().optional(), eventId: z.string().optional() }).optional(),
  at: z.number(),
});

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export const crmApp = defineApp({
  id: "crm",
  name: "CRM",
  description:
    "Contacts, deals, and activity log. Logs outreach by calling mail.send-email and books follow-ups via calendar.create-event.",
  icon: "users",
  url: "http://localhost:4116",
  consumes: ["mail.send-email", "mail.find-contact", "calendar.create-event"],
  routes: [
    { path: "/contacts", label: "Contacts" },
    { path: "/pipeline", label: "Pipeline" },
  ],
  capabilities: {
    "create-contact": {
      description: "Create a CRM contact.",
      input: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        notes: z.string().optional(),
      }),
      output: contactSchema,
      tags: ["write"],
      handler: async (input, ctx) => {
        const c: Contact = { id: id("contact"), ...input, ownerId: ctx.user.id, createdAt: Date.now() };
        contacts.set(c.id, c);
        const { ownerId: _o, ...rest } = c;
        return rest;
      },
    },
    "list-contacts": {
      description: "List all CRM contacts owned by the user.",
      input: z.object({}).optional(),
      output: z.array(contactSchema),
      tags: ["read"],
      handler: async (_input, ctx) => {
        return Array.from(contacts.values())
          .filter((c) => c.ownerId === ctx.user.id)
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(({ ownerId: _o, ...rest }) => rest);
      },
    },
    "create-deal": {
      description: "Create a deal attached to a contact.",
      input: z.object({
        contactId: z.string(),
        title: z.string().min(1),
        amount: z.number().nonnegative(),
        stage: z.enum(["lead", "qualified", "proposal", "won", "lost"]).default("lead"),
      }),
      output: dealSchema,
      tags: ["write"],
      handler: async (input, ctx) => {
        if (!contacts.has(input.contactId)) throw new Error(`contact ${input.contactId} not found`);
        const d: Deal = { id: id("deal"), ...input, ownerId: ctx.user.id, createdAt: Date.now() };
        deals.set(d.id, d);
        const { ownerId: _o, ...rest } = d;
        return rest;
      },
    },
    "list-pipeline": {
      description: "List all deals grouped by stage.",
      input: z.object({}).optional(),
      output: z.array(dealSchema),
      tags: ["read"],
      handler: async (_input, ctx) => {
        const order = { lead: 0, qualified: 1, proposal: 2, won: 3, lost: 4 } as const;
        return Array.from(deals.values())
          .filter((d) => d.ownerId === ctx.user.id)
          .sort((a, b) => order[a.stage] - order[b.stage])
          .map(({ ownerId: _o, ...rest }) => rest);
      },
    },
    "log-outreach": {
      description:
        "Send an email to a contact AND log the activity. Calls mail.send-email under the hood.",
      input: z.object({ contactId: z.string(), subject: z.string().min(1), body: z.string().default("") }),
      output: z.object({ activityId: z.string(), messageId: z.string() }),
      tags: ["write", "cross-app"],
      handler: async (input, ctx) => {
        const contact = contacts.get(input.contactId);
        if (!contact || contact.ownerId !== ctx.user.id) throw new Error("contact not found");
        const sent = (await ctx.call("mail.send-email", {
          to: contact.email,
          subject: input.subject,
          body: input.body,
        })) as { id: string };
        const act: Activity = {
          id: id("act"),
          contactId: contact.id,
          kind: "email",
          summary: input.subject,
          ref: { messageId: sent.id },
          ownerId: ctx.user.id,
          at: Date.now(),
        };
        activities.set(act.id, act);
        return { activityId: act.id, messageId: sent.id };
      },
    },
    "schedule-meeting": {
      description:
        "Book a meeting with a contact via calendar.create-event AND log the activity.",
      input: z.object({
        contactId: z.string(),
        title: z.string().min(1),
        startsAt: z.number(),
        endsAt: z.number(),
      }),
      output: z.object({ activityId: z.string(), eventId: z.string() }),
      tags: ["write", "cross-app"],
      handler: async (input, ctx) => {
        const contact = contacts.get(input.contactId);
        if (!contact || contact.ownerId !== ctx.user.id) throw new Error("contact not found");
        const evt = (await ctx.call("calendar.create-event", {
          title: input.title,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          attendees: [contact.email],
        })) as { id: string };
        const act: Activity = {
          id: id("act"),
          contactId: contact.id,
          kind: "meeting",
          summary: input.title,
          ref: { eventId: evt.id },
          ownerId: ctx.user.id,
          at: Date.now(),
        };
        activities.set(act.id, act);
        return { activityId: act.id, eventId: evt.id };
      },
    },
    "list-activity": {
      description: "List recent CRM activity for the user, optionally filtered to one contact.",
      input: z.object({ contactId: z.string().optional() }).optional(),
      output: z.array(activitySchema),
      tags: ["read"],
      handler: async (input, ctx) => {
        return Array.from(activities.values())
          .filter((a) => a.ownerId === ctx.user.id && (!input?.contactId || a.contactId === input.contactId))
          .sort((a, b) => b.at - a.at)
          .map(({ ownerId: _o, ...rest }) => rest);
      },
    },
  },
});
