import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { deleteContactInput } from "../shared/schemas.js";
import { deleteContact } from "../server/lib/service.js";

export default defineAction({
  description:
    "Soft-delete a contact. Detaches CRM activities but does NOT cascade into mail/calendar/notes — external refs survive.",
  schema: deleteContactInput,
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const result = await deleteContact(input, {
      ownerEmail,
      orgId: orgId ?? undefined,
    });
    await writeAppState("refresh-signal", { ts: Date.now() });
    return result;
  },
});
