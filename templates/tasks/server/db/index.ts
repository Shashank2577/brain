import * as schema from "./schema.js";
import { createGetDb } from "@agent-native/core/db";
import { registerShareableResource } from "@agent-native/core/sharing";

export const getDb = createGetDb(schema);
export { schema };

registerShareableResource({
  type: "task",
  resourceTable: schema.tasks,
  sharesTable: schema.taskShares,
  displayName: "Task",
  titleColumn: "text",
  getResourcePath: (task) => `/tasks/${task.id}`,
  getDb,
});
