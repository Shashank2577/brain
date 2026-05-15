import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { updateDealStageInput } from "../shared/schemas.js";
import { updateDealStage } from "../server/lib/service.js";

export default defineAction({
  description:
    "Move a deal between stages. Writes an audit `activities` row of kind `note` summarising the transition. Used by the kanban drag-and-drop interaction.",
  schema: updateDealStageInput,
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const result = await updateDealStage(input, {
      ownerEmail,
      orgId: orgId ?? undefined,
    });
    await writeAppState("refresh-signal", { ts: Date.now() });
    return result;
  },
});
