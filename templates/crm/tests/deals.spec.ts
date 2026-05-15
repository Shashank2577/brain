import { describe, expect, it } from "vitest";
import { setupCrmTestEnv, readActivities, readDeals } from "./harness.js";

const alice = { id: "u_alice", email: "alice@example.com", name: "Alice" };
const bob = { id: "u_bob", email: "bob@example.com", name: "Bob" };

async function makeContact(env: Awaited<ReturnType<typeof setupCrmTestEnv>>, user = alice) {
  return env.call<{ id: string }>(user, "crm.create-contact", {
    name: "Carol",
    email: "carol@example.com",
  });
}

describe("crm.create-deal", () => {
  it("creates a deal attached to a contact the caller owns", async () => {
    const env = await setupCrmTestEnv();
    const contact = await makeContact(env);

    const deal = await env.call<{
      id: string;
      contactId: string;
      stage: string;
      amount: number;
    }>(alice, "crm.create-deal", {
      contactId: contact.id,
      title: "Acme — Pro plan",
      amount: 12000,
    });

    expect(deal.id).toMatch(/^deal_/);
    expect(deal.contactId).toBe(contact.id);
    expect(deal.stage).toBe("lead");
    expect(deal.amount).toBe(12000);

    const rows = await readDeals();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.ownerEmail).toBe("alice@example.com");
  });

  it("rejects when contactId does not belong to the caller", async () => {
    const env = await setupCrmTestEnv();
    const aliceContact = await makeContact(env, alice);

    await expect(
      env.call(bob, "crm.create-deal", {
        contactId: aliceContact.id,
        title: "Stolen deal",
        amount: 999,
      }),
    ).rejects.toThrow(/not found/);
  });
});

describe("crm.update-deal-stage", () => {
  it("moves a deal and writes an audit activity row of kind note", async () => {
    const env = await setupCrmTestEnv();
    const contact = await makeContact(env);
    const deal = await env.call<{ id: string }>(alice, "crm.create-deal", {
      contactId: contact.id,
      title: "T",
      amount: 100,
    });

    const result = await env.call<{
      deal: { stage: string };
      activityId: string;
    }>(alice, "crm.update-deal-stage", {
      dealId: deal.id,
      stage: "qualified",
    });

    expect(result.deal.stage).toBe("qualified");
    expect(result.activityId).toMatch(/^act_/);

    const activities = await readActivities();
    expect(activities).toHaveLength(1);
    expect(activities[0]?.kind).toBe("note");
    expect(activities[0]?.dealId).toBe(deal.id);
    expect(activities[0]?.summary).toMatch(/lead.*qualified/);
  });

  it("is idempotent when the new stage equals the current stage", async () => {
    const env = await setupCrmTestEnv();
    const contact = await makeContact(env);
    const deal = await env.call<{ id: string }>(alice, "crm.create-deal", {
      contactId: contact.id,
      title: "T",
      amount: 100,
    });

    await env.call(alice, "crm.update-deal-stage", {
      dealId: deal.id,
      stage: "lead",
    });
    const activities = await readActivities();
    expect(activities).toHaveLength(0);
  });
});

describe("crm.list-deals", () => {
  it("filters by stage and contactId", async () => {
    const env = await setupCrmTestEnv();
    const contact = await makeContact(env);

    await env.call(alice, "crm.create-deal", {
      contactId: contact.id,
      title: "D1",
      amount: 100,
      stage: "lead",
    });
    await env.call(alice, "crm.create-deal", {
      contactId: contact.id,
      title: "D2",
      amount: 200,
      stage: "qualified",
    });

    const all = await env.call<unknown[]>(alice, "crm.list-deals", {});
    const qualifiedOnly = await env.call<unknown[]>(alice, "crm.list-deals", {
      stage: "qualified",
    });

    expect(all).toHaveLength(2);
    expect(qualifiedOnly).toHaveLength(1);
    expect((qualifiedOnly[0] as { title: string }).title).toBe("D2");
  });
});
