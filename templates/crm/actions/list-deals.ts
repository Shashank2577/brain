import { defineAction } from "@agent-native/core";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { z } from "zod";
import { dealStageSchema } from "../shared/schemas.js";
import { listDeals } from "../server/lib/service.js";

export default defineAction({
  description:
    "List deals visible to the caller, optionally filtered by contactId or stage, ordered by pipeline rank.",
  schema: z.object({
    contactId: z.string().optional(),
    stage: dealStageSchema.optional(),
  }),
  http: { method: "GET" },
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const deals = await listDeals(input, {
      ownerEmail,
      orgId: orgId ?? undefined,
    });
    return { deals };
  },
});
