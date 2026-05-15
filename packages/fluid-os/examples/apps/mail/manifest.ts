import { z } from "zod";
import { defineApp } from "../../../src/manifest/index.js";

interface Email {
  id: string;
  threadId: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  read: boolean;
  sentAt: number;
  ownerId: string;
}

const emails = new Map<string, Email>();

const emailSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  to: z.string(),
  from: z.string(),
  subject: z.string(),
  body: z.string(),
  read: z.boolean(),
  sentAt: z.number(),
});

export const mailApp = defineApp({
  id: "mail",
  name: "Mail",
  description: "Send and read email.",
  icon: "mail",
  url: "http://localhost:4111",
  routes: [
    { path: "/inbox", label: "Inbox" },
    { path: "/sent", label: "Sent" },
    { path: "/compose", label: "Compose" },
  ],
  agentGuidance:
    "Mail is the only app that owns email. Other apps should call mail.send-email and never reimplement it. Use mail.find-contact to resolve a name to an address before sending.",
  capabilities: {
    "send-email": {
      description: "Send an email immediately. Returns the sent message id.",
      input: z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        body: z.string().default(""),
        threadId: z.string().optional(),
      }),
      output: emailSchema,
      tags: ["write", "messaging"],
      handler: async (input, ctx) => {
        const id = `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const email: Email = {
          id,
          threadId: input.threadId ?? id,
          to: input.to,
          from: ctx.user.email,
          subject: input.subject,
          body: input.body,
          read: true,
          sentAt: Date.now(),
          ownerId: ctx.user.id,
        };
        emails.set(id, email);
        const { ownerId: _o, ...rest } = email;
        return rest;
      },
    },
    "list-inbox": {
      description: "List emails the user has received.",
      input: z.object({ limit: z.number().int().positive().max(100).default(20) }).optional(),
      output: z.array(emailSchema),
      tags: ["read"],
      handler: async (input, ctx) => {
        const limit = input?.limit ?? 20;
        return Array.from(emails.values())
          .filter((e) => e.to === ctx.user.email)
          .sort((a, b) => b.sentAt - a.sentAt)
          .slice(0, limit)
          .map(({ ownerId: _o, ...rest }) => rest);
      },
    },
    "find-contact": {
      description: "Look up a known contact by name. Returns the best-matching email address.",
      input: z.object({ name: z.string().min(1) }),
      output: z.object({ name: z.string(), email: z.string() }).nullable(),
      tags: ["read"],
      handler: async (input) => {
        const directory: Record<string, string> = {
          alice: "alice@example.com",
          bob: "bob@example.com",
          carol: "carol@example.com",
          dave: "dave@example.com",
        };
        const key = input.name.trim().toLowerCase().split(/\s+/)[0];
        const email = directory[key];
        return email ? { name: input.name, email } : null;
      },
    },
  },
});
