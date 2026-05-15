/**
 * Fluid OS app manifest for the CRM template.
 *
 * Replaces the legacy in-memory `packages/fluid-os/examples/apps/crm/`
 * manifest. All capability handlers delegate to `server/lib/service.ts`
 * which is also used by the standalone-template `actions/*` HTTP surface,
 * so behavior cannot diverge between the two surfaces.
 *
 * The four legacy capability NAMES — `crm.create-contact`, `crm.create-deal`,
 * `crm.log-outreach`, `crm.schedule-meeting` — are preserved with the EXACT
 * same Zod input shape so the existing `crossAppDemo` (and any third party
 * still calling them) keeps working. The remaining capabilities round out
 * the standard CRUD surface per docs/apps/crm.md.
 */

import { z } from "zod";
import { defineApp } from "@agent-native/fluid-os";
import {
  createContact,
  listContacts,
  getContact,
  deleteContact,
  createDeal,
  listDeals,
  updateDealStage,
  listActivities,
  logOutreach,
  scheduleMeeting,
  type OwnerCtx,
} from "./lib/service.js";
import {
  contactSchema,
  dealSchema,
  activitySchema,
  createContactInput,
  listContactsInput,
  getContactInput,
  deleteContactInput,
  createDealInput,
  listDealsInput,
  updateDealStageInput,
  logOutreachInput,
  scheduleMeetingInput,
  listActivitiesInput,
  getContactOutput,
  deleteContactOutput,
  updateDealStageOutput,
  logOutreachOutput,
  scheduleMeetingOutput,
} from "../shared/schemas.js";

function ownerCtxFor(ctx: { user: { id: string; email: string; orgId?: string } }): OwnerCtx {
  // The fluid-os RPC layer guarantees ctx.user is the authenticated end user
  // — propagated from the original session, not the calling app's principal.
  // We trust ctx.user.email as the ownership identity.
  return { ownerEmail: ctx.user.email, orgId: ctx.user.orgId };
}

export const crmApp = defineApp({
  id: "crm",
  name: "CRM",
  description:
    "Contacts, deals, and activity log. Logs outreach by calling mail.send-email, books follow-ups via calendar.create-event, and attaches long-form notes via notes.create.",
  icon: "users",
  url: process.env.CRM_TEMPLATE_URL ?? "http://localhost:8101",
  consumes: [
    "mail.send-email",
    "mail.find-contact",
    "calendar.create-event",
    "notes.create",
    "tasks.create",
  ],
  routes: [
    { path: "/", label: "Dashboard" },
    { path: "/contacts", label: "Contacts" },
    { path: "/deals", label: "Deals" },
  ],
  agentGuidance:
    "CRM owns contacts, deals, and activity history. It does NOT own email or calendar — it composes them. crm.log-outreach is the right way to send an email TO a CRM contact (it calls mail.send-email and logs the activity). crm.schedule-meeting is the right way to book a meeting WITH a CRM contact (it calls calendar.create-event and logs the activity).",
  capabilities: {
    "create-contact": {
      description: "Create a CRM contact owned by the caller.",
      input: createContactInput,
      output: contactSchema,
      tags: ["write"],
      handler: async (input, ctx) => createContact(input, ownerCtxFor(ctx)),
    },
    "list-contacts": {
      description:
        "List contacts visible to the caller. Optionally filtered by free-text q (name / email / company) and limited.",
      input: listContactsInput,
      output: z.array(contactSchema),
      tags: ["read"],
      handler: async (input, ctx) => listContacts(input, ownerCtxFor(ctx)),
    },
    "get-contact": {
      description:
        "Fetch a contact and its 20 most recent activity rows (preview for the contact-detail page).",
      input: getContactInput,
      output: getContactOutput,
      tags: ["read"],
      handler: async (input, ctx) => getContact(input, ownerCtxFor(ctx)),
    },
    "delete-contact": {
      description:
        "Soft-delete a contact. Does NOT cascade into mail/calendar/notes — external refs survive.",
      input: deleteContactInput,
      output: deleteContactOutput,
      tags: ["write"],
      handler: async (input, ctx) => deleteContact(input, ownerCtxFor(ctx)),
    },
    "create-deal": {
      description: "Create a deal attached to a contact.",
      input: createDealInput,
      output: dealSchema,
      tags: ["write"],
      handler: async (input, ctx) => createDeal(input, ownerCtxFor(ctx)),
    },
    "list-deals": {
      description:
        "List deals visible to the caller, optionally filtered by contactId or stage, ordered by pipeline rank.",
      input: listDealsInput,
      output: z.array(dealSchema),
      tags: ["read"],
      handler: async (input, ctx) => listDeals(input, ownerCtxFor(ctx)),
    },
    "update-deal-stage": {
      description:
        "Move a deal between stages. Writes an audit `activities` row of kind `note` summarising the transition.",
      input: updateDealStageInput,
      output: updateDealStageOutput,
      tags: ["write"],
      handler: async (input, ctx) =>
        updateDealStage(input, ownerCtxFor(ctx)),
    },
    "log-outreach": {
      description:
        "Send an email to a contact AND log the activity. Calls mail.send-email under the hood. Returns { activityId, messageId } where messageId is what mail.send-email returned.",
      input: logOutreachInput,
      output: logOutreachOutput,
      tags: ["write", "cross-app"],
      handler: async (input, ctx) =>
        logOutreach(input, ownerCtxFor(ctx), ctx.call),
    },
    "schedule-meeting": {
      description:
        "Book a meeting with a contact via calendar.create-event AND log the activity. The contact's email is always on the attendee list; extraAttendees are appended.",
      input: scheduleMeetingInput,
      output: scheduleMeetingOutput,
      tags: ["write", "cross-app"],
      handler: async (input, ctx) =>
        scheduleMeeting(input, ownerCtxFor(ctx), ctx.call),
    },
    "list-activities": {
      description:
        "Activity feed, optionally scoped to a contactId / dealId / kind, newest-first.",
      input: listActivitiesInput,
      output: z.array(activitySchema),
      tags: ["read"],
      handler: async (input, ctx) =>
        listActivities(input, ownerCtxFor(ctx)),
    },
    // Legacy compat alias — keep `list-activity` (singular) working for any
    // existing caller until they migrate. New code should use list-activities.
    "list-activity": {
      description:
        "Alias for list-activities (legacy spelling, kept for backward compat).",
      input: z.object({ contactId: z.string().optional() }).optional(),
      output: z.array(activitySchema),
      tags: ["read"],
      handler: async (input, ctx) =>
        listActivities(input, ownerCtxFor(ctx)),
    },
  },
});
