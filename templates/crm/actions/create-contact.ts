import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { createContactInput } from "../shared/schemas.js";
import { createContact } from "../server/lib/service.js";

export default defineAction({
  description: "Create a CRM contact owned by the caller.",
  schema: createContactInput,
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const contact = await createContact(input, {
      ownerEmail,
      orgId: orgId ?? undefined,
    });
    await writeAppState("refresh-signal", { ts: Date.now() });
    return contact;
  },
});
