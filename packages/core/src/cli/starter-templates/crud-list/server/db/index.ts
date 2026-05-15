import * as schema from "./schema.js";
import { createGetDb } from "@agent-native/core/db";
import { registerShareableResource } from "@agent-native/core/sharing";

export const getDb = createGetDb(schema);
export { schema };

registerShareableResource({
  type: "<name>-item",
  resourceTable: schema.<name>Items,
  sharesTable: schema.<name>ItemShares,
  displayName: "<Name> Item",
  titleColumn: "title",
  getResourcePath: (item) => `/<name>/${item.id}`,
  getDb,
});
