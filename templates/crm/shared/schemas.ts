import { z } from "zod";

// -----------------------------------------------------------------------------
// Zod schemas shared by:
//   1. The fluid-os capability manifest (consumed by ctx.call(...))
//   2. The standalone Nitro template's actions/* HTTP endpoints
//   3. The React UI's client-side form validation
//
// Keeping a single source of truth means the agent's tool schema and the
// browser-side form schema cannot drift.
// -----------------------------------------------------------------------------

export const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "won",
  "lost",
] as const;

export const ACTIVITY_KINDS = [
  "email",
  "meeting",
  "note",
  "call",
] as const;

export const dealStageSchema = z.enum(DEAL_STAGES);
export const activityKindSchema = z.enum(ACTIVITY_KINDS);

// -----------------------------------------------------------------------------
// Resource shapes returned by capability outputs
// -----------------------------------------------------------------------------

export const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  company: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Contact = z.infer<typeof contactSchema>;

export const dealSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  title: z.string(),
  amount: z.number().int().nonnegative(),
  stage: dealStageSchema,
  closeDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Deal = z.infer<typeof dealSchema>;

export const activitySchema = z.object({
  id: z.string(),
  contactId: z.string(),
  dealId: z.string().optional(),
  kind: activityKindSchema,
  summary: z.string(),
  refMessageId: z.string().optional(),
  refEventId: z.string().optional(),
  refNoteId: z.string().optional(),
  at: z.string(),
});
export type Activity = z.infer<typeof activitySchema>;

// -----------------------------------------------------------------------------
// Capability input schemas
// -----------------------------------------------------------------------------

export const createContactInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const listContactsInput = z
  .object({
    q: z.string().optional(),
    limit: z.number().int().positive().max(200).default(50),
  })
  .optional();

export const getContactInput = z.object({ contactId: z.string() });

export const deleteContactInput = z.object({ contactId: z.string() });

export const createDealInput = z.object({
  contactId: z.string(),
  title: z.string().min(1),
  amount: z.number().int().nonnegative(),
  stage: dealStageSchema.default("lead"),
  closeDate: z.string().optional(),
});

export const listDealsInput = z
  .object({
    contactId: z.string().optional(),
    stage: dealStageSchema.optional(),
  })
  .optional();

export const updateDealStageInput = z.object({
  dealId: z.string(),
  stage: dealStageSchema,
  note: z.string().optional(),
});

export const logOutreachInput = z.object({
  contactId: z.string(),
  subject: z.string().min(1),
  body: z.string().default(""),
});

export const scheduleMeetingInput = z.object({
  contactId: z.string(),
  title: z.string().min(1),
  startsAt: z.number(),
  endsAt: z.number(),
  extraAttendees: z.array(z.string().email()).optional(),
});

export const listActivitiesInput = z
  .object({
    contactId: z.string().optional(),
    dealId: z.string().optional(),
    kind: activityKindSchema.optional(),
    limit: z.number().int().positive().max(200).default(50),
  })
  .optional();

// -----------------------------------------------------------------------------
// Capability output schemas
// -----------------------------------------------------------------------------

export const getContactOutput = z.object({
  contact: contactSchema,
  recentActivity: z.array(activitySchema),
});

export const deleteContactOutput = z.object({ ok: z.literal(true) });

export const updateDealStageOutput = z.object({
  deal: dealSchema,
  activityId: z.string(),
});

export const logOutreachOutput = z.object({
  activityId: z.string(),
  messageId: z.string(),
});

export const scheduleMeetingOutput = z.object({
  activityId: z.string(),
  eventId: z.string(),
});
