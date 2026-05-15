import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { scheduleMeetingInput } from "../shared/schemas.js";
import { scheduleMeeting } from "../server/lib/service.js";
import { callerFromEnv } from "../server/lib/fluid-os-client.js";

export default defineAction({
  description:
    "Book a calendar event with a CRM contact AND log the activity. Composes calendar.create-event via the Fluid OS RPC layer. The contact's email is always included on the attendee list; extraAttendees are appended.",
  schema: scheduleMeetingInput,
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const result = await scheduleMeeting(
      input,
      { ownerEmail, orgId: orgId ?? undefined },
      callerFromEnv(),
    );
    await writeAppState("refresh-signal", { ts: Date.now() });
    return result;
  },
});
