import { defineAction } from "@agent-native/core";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { z } from "zod";
import { listContacts } from "../server/lib/service.js";

export default defineAction({
  description: "List CRM contacts visible to the caller.",
  schema: z.object({
    q: z.string().optional().describe("Search query (name / email / company)"),
    limit: z.coerce.number().int().positive().max(200).default(50),
  }),
  http: { method: "GET" },
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const contacts = await listContacts(input, {
      ownerEmail,
      orgId: orgId ?? undefined,
    });
    return { contacts };
  },
});
