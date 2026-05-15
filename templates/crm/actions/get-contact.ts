import { defineAction } from "@agent-native/core";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { getContactInput } from "../shared/schemas.js";
import { getContact } from "../server/lib/service.js";

export default defineAction({
  description:
    "Fetch a contact and its 20 most recent activity rows. Used by the contact detail page header card and activity timeline tab.",
  schema: getContactInput,
  http: { method: "GET" },
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    return getContact(input, { ownerEmail, orgId: orgId ?? undefined });
  },
});
