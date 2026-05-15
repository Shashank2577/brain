import { defineAction } from "@agent-native/core";
import { readAppState } from "@agent-native/core/application-state";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { z } from "zod";
import {
  listContacts,
  listDeals,
  listActivities,
  getContact,
} from "../server/lib/service.js";

interface NavigationSnapshot {
  view?: string;
  contactId?: string;
  dealId?: string;
  stageFilter?: string;
}

export default defineAction({
  description:
    "Snapshot of what the user is looking at right now in the CRM UI. Returns the navigation state plus a context-appropriate slice of contacts/deals/activities.",
  schema: z.object({}).optional(),
  http: { method: "GET" },
  run: async () => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const owner = { ownerEmail, orgId: orgId ?? undefined };

    const raw = (await readAppState("navigation")) as
      | NavigationSnapshot
      | null
      | undefined;
    const navigation: NavigationSnapshot = raw ?? { view: "dashboard" };

    if (navigation.view === "contact" && navigation.contactId) {
      const detail = await getContact(
        { contactId: navigation.contactId },
        owner,
      );
      return {
        navigation,
        contact: detail.contact,
        recentActivity: detail.recentActivity,
      };
    }

    if (navigation.view === "contacts") {
      const contacts = await listContacts({}, owner);
      return { navigation, contacts };
    }

    if (navigation.view === "deals") {
      const deals = await listDeals({}, owner);
      return { navigation, deals };
    }

    // Dashboard / default — show a small slice of everything.
    const [contacts, deals, activities] = await Promise.all([
      listContacts({ limit: 5 }, owner),
      listDeals({}, owner),
      listActivities({ limit: 10 }, owner),
    ]);
    return {
      navigation,
      summary: {
        contacts,
        openDeals: deals.filter((d) => d.stage !== "won" && d.stage !== "lost"),
        recentActivity: activities,
      },
    };
  },
});
