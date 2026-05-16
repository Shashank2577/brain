/**
 * Phase 7 — CRM capability-registry RPC integration test.
 *
 * Smoke-level coverage of the CRM happy path: create-contact, list-contacts,
 * get-contact, create-deal, list-deals. Each capability invocation goes
 * through `dispatchCapability` so the `runWithRequestContext` boundary is
 * exercised end-to-end.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runWithRequestContext } from "@agent-native/core/server/request-context";
import {
  buildRegistry,
  dispatchCapability,
  type ActionLike,
} from "@agent-native/dispatch/server";
import {
  setupCrmFixture,
  getActiveCrmDb,
  schema,
  type CrmFixture,
} from "./helpers/crm-fixture";

vi.mock("../../templates/crm/server/db/index.js", () => ({
  getDb: () => getActiveCrmDb(),
  schema,
}));

vi.mock("@agent-native/core/application-state", () => ({
  writeAppState: vi.fn(async () => {}),
}));

const aliceCtx = { userEmail: "alice@test.local" };
const aliceUser = { id: "alice@test.local", email: "alice@test.local" };

let fixture: CrmFixture;

beforeEach(() => {
  fixture = setupCrmFixture();
});

afterEach(() => {
  fixture.close();
  vi.clearAllMocks();
});

async function loadCrmCapabilities(): Promise<Record<string, ActionLike>> {
  const [createContact, listContacts, getContact, createDeal, listDeals] =
    await Promise.all([
      import("../../templates/crm/actions/create-contact"),
      import("../../templates/crm/actions/list-contacts"),
      import("../../templates/crm/actions/get-contact"),
      import("../../templates/crm/actions/create-deal"),
      import("../../templates/crm/actions/list-deals"),
    ]);
  return {
    "crm.create-contact": createContact.default as ActionLike,
    "crm.list-contacts": listContacts.default as ActionLike,
    "crm.get-contact": getContact.default as ActionLike,
    "crm.create-deal": createDeal.default as ActionLike,
    "crm.list-deals": listDeals.default as ActionLike,
  };
}

describe("crm — capability-registry RPC integration", () => {
  it("create-contact persists a contact with ownerEmail = caller", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadCrmCapabilities(),
    });

    const result = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "crm.create-contact",
        input: { name: "Acme CEO", email: "ceo@acme.test" },
        user: aliceUser,
      }),
    );

    expect(result.ok).toBe(true);

    const rows = await fixture.db.select().from(schema.contacts);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Acme CEO");
    expect(rows[0].email).toBe("ceo@acme.test");
    expect(rows[0].ownerEmail).toBe("alice@test.local");
  });

  it("list-contacts returns previously-created contacts", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadCrmCapabilities(),
    });

    await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "crm.create-contact",
        input: { name: "Beta CEO", email: "ceo@beta.test" },
        user: aliceUser,
      }),
    );

    const listed = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "crm.list-contacts",
        input: { limit: 50 },
        user: aliceUser,
      }),
    );
    expect(listed.ok).toBe(true);
    if (!listed.ok) throw new Error(listed.error.message);
    const { contacts } = listed.output as {
      contacts: Array<{ name: string }>;
    };
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe("Beta CEO");
  });

  it("create-deal links a deal to a contact", async () => {
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: await loadCrmCapabilities(),
    });

    const contactResult = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "crm.create-contact",
        input: { name: "Gamma CEO", email: "ceo@gamma.test" },
        user: aliceUser,
      }),
    );
    if (!contactResult.ok) throw new Error(contactResult.error.message);
    const contact = contactResult.output as { id: string };

    const dealResult = await runWithRequestContext(aliceCtx, () =>
      dispatchCapability({
        registry,
        fqid: "crm.create-deal",
        input: {
          contactId: contact.id,
          title: "Enterprise tier",
          amount: 1_000_000,
          stage: "qualified",
        },
        user: aliceUser,
      }),
    );
    expect(dealResult.ok).toBe(true);

    const deals = await fixture.db.select().from(schema.deals);
    expect(deals).toHaveLength(1);
    expect(deals[0].title).toBe("Enterprise tier");
    expect(deals[0].contactId).toBe(contact.id);
    expect(deals[0].amount).toBe(1_000_000);
    expect(deals[0].stage).toBe("qualified");
    expect(deals[0].ownerEmail).toBe("alice@test.local");
  });
});
