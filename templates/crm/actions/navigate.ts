import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import { z } from "zod";

export default defineAction({
  description:
    "Navigate the CRM UI to a view. The one-shot `navigate` app-state entry is consumed by the UI on receipt.",
  schema: z.object({
    view: z
      .enum(["dashboard", "contacts", "contact", "deals", "deal"])
      .describe("The view to navigate to"),
    contactId: z
      .string()
      .optional()
      .describe("Contact id for view=contact"),
    dealId: z.string().optional().describe("Deal id for view=deal"),
  }),
  run: async (input) => {
    await writeAppState("navigate", input);
    return { ok: true };
  },
});
