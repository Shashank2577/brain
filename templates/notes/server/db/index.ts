import * as schema from "./schema.js";
import { createGetDb } from "@agent-native/core/db";
import { registerShareableResource } from "@agent-native/core/sharing";

export const getDb = createGetDb(schema);
export { schema };

registerShareableResource({
  type: "note",
  resourceTable: schema.notes,
  sharesTable: schema.noteShares,
  displayName: "Note",
  titleColumn: "title",
  getResourcePath: (note) => `/notes/${note.id}`,
  getDb,
});
