import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { createDealInput } from "../shared/schemas.js";
import { createDeal } from "../server/lib/service.js";

export default defineAction({
  description:
    "Create a deal attached to a contact. The caller must own the contact.",
  schema: createDealInput,
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const deal = await createDeal(input, {
      ownerEmail,
      orgId: orgId ?? undefined,
    });
    await writeAppState("refresh-signal", { ts: Date.now() });
    return deal;
  },
});
