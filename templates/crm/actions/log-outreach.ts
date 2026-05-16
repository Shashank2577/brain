import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { callCapability } from "@agent-native/core/server";
import { logOutreachInput } from "../shared/schemas.js";
import { logOutreach } from "../server/lib/service.js";

export default defineAction({
  description:
    "Send an email to a CRM contact AND log the activity. Composes mail.send-email via the dispatch RPC broker (Item A3). The user's identity propagates through ctx — the email is sent from the user, not the CRM app.",
  schema: logOutreachInput,
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const result = await logOutreach(
      input,
      { ownerEmail, orgId: orgId ?? undefined },
      (capability, payload) => callCapability(capability, payload),
    );
    await writeAppState("refresh-signal", { ts: Date.now() });
    return result;
  },
});
