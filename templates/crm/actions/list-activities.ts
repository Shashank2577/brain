import { defineAction } from "@agent-native/core";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { z } from "zod";
import { activityKindSchema } from "../shared/schemas.js";
import { listActivities } from "../server/lib/service.js";

export default defineAction({
  description:
    "List CRM activities (email / meeting / note / call) newest-first. Filter by contactId, dealId, or kind.",
  schema: z.object({
    contactId: z.string().optional(),
    dealId: z.string().optional(),
    kind: activityKindSchema.optional(),
    limit: z.coerce.number().int().positive().max(200).default(50),
  }),
  http: { method: "GET" },
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const activities = await listActivities(input, {
      ownerEmail,
      orgId: orgId ?? undefined,
    });
    return { activities };
  },
});
