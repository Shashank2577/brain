import { z } from "zod";
import { defineApp } from "../../../src/manifest/index.js";

export const dispatchApp = defineApp({
  id: "dispatch",
  name: "Dispatch",
  description: "Multi-channel coordinator. Fans messages out to mail and schedules follow-ups on the calendar.",
  icon: "send",
  url: "http://localhost:4115",
  consumes: ["mail.send-email", "mail.find-contact", "calendar.create-event", "calendar.check-availability"],
  routes: [
    { path: "/", label: "Campaigns" },
  ],
  capabilities: {
    broadcast: {
      description:
        "Send the same email to many recipients via mail.send-email. Returns one entry per recipient.",
      input: z.object({
        recipients: z.array(z.string().email()).min(1),
        subject: z.string().min(1),
        body: z.string().default(""),
      }),
      output: z.array(
        z.object({
          to: z.string(),
          messageId: z.string().optional(),
          error: z.string().optional(),
        }),
      ),
      tags: ["write", "cross-app", "fanout"],
      handler: async (input, ctx) => {
        const out: { to: string; messageId?: string; error?: string }[] = [];
        for (const to of input.recipients) {
          try {
            const sent = (await ctx.call("mail.send-email", {
              to,
              subject: input.subject,
              body: input.body,
            })) as { id: string };
            out.push({ to, messageId: sent.id });
          } catch (err) {
            out.push({ to, error: (err as Error).message });
          }
        }
        return out;
      },
    },
    "send-and-schedule": {
      description:
        "Send an email to a named contact (resolved via mail.find-contact) AND book a follow-up event on the user's calendar in the requested window. Fails the whole call if the slot is busy.",
      input: z.object({
        contactName: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().default(""),
        followUp: z.object({
          startsAt: z.number(),
          endsAt: z.number(),
          title: z.string().optional(),
        }),
      }),
      output: z.object({
        messageId: z.string(),
        eventId: z.string(),
        resolvedRecipient: z.string(),
      }),
      tags: ["write", "cross-app"],
      handler: async (input, ctx) => {
        const contact = (await ctx.call("mail.find-contact", { name: input.contactName })) as
          | { email: string }
          | null;
        if (!contact) throw new Error(`No contact resolved for "${input.contactName}"`);

        const avail = (await ctx.call("calendar.check-availability", {
          startsAt: input.followUp.startsAt,
          endsAt: input.followUp.endsAt,
        })) as { free: boolean; conflictsWith: string[] };
        if (!avail.free) throw new Error(`Calendar busy: conflicts with ${avail.conflictsWith.join(", ")}`);

        const sent = (await ctx.call("mail.send-email", {
          to: contact.email,
          subject: input.subject,
          body: input.body,
        })) as { id: string };

        const evt = (await ctx.call("calendar.create-event", {
          title: input.followUp.title ?? `Follow-up: ${input.subject}`,
          startsAt: input.followUp.startsAt,
          endsAt: input.followUp.endsAt,
          attendees: [contact.email],
          description: input.body,
        })) as { id: string };

        return { messageId: sent.id, eventId: evt.id, resolvedRecipient: contact.email };
      },
    },
  },
});
