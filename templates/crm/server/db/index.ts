import * as schema from "./schema.js";
import { createGetDb, getDbExec } from "@agent-native/core/db";
import { registerShareableResource } from "@agent-native/core/sharing";

export const getDb = createGetDb(schema);
export { schema, getDbExec };

registerShareableResource({
  type: "crm-contact",
  resourceTable: schema.contacts,
  sharesTable: schema.contactShares,
  displayName: "Contact",
  titleColumn: "name",
  getResourcePath: (contact) => `/crm/contacts/${contact.id}`,
  getDb,
});

registerShareableResource({
  type: "crm-deal",
  resourceTable: schema.deals,
  sharesTable: schema.dealShares,
  displayName: "Deal",
  titleColumn: "title",
  getResourcePath: (deal) => `/crm/deals/${deal.id}`,
  getDb,
});

registerShareableResource({
  type: "crm-activity",
  resourceTable: schema.activities,
  sharesTable: schema.activityShares,
  displayName: "Activity",
  titleColumn: "summary",
  getResourcePath: (activity) =>
    `/crm/contacts/${activity.contactId}#activity-${activity.id}`,
  getDb,
});
