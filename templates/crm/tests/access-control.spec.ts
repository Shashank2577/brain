import { describe, expect, it } from "vitest";
import { setupCrmTestEnv } from "./harness.js";

const alice = { id: "u_alice", email: "alice@example.com" };
const bob = { id: "u_bob", email: "bob@example.com" };

describe("CRM access control", () => {
  it("bob cannot get-contact for a contact owned by alice", async () => {
    const env = await setupCrmTestEnv();
    const aliceContact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "C", email: "c@example.com" },
    );

    await expect(
      env.call(bob, "crm.get-contact", { contactId: aliceContact.id }),
    ).rejects.toThrow(/not found/);
  });

  it("bob's list-contacts returns zero rows even when alice has contacts", async () => {
    const env = await setupCrmTestEnv();
    await env.call(alice, "crm.create-contact", {
      name: "C",
      email: "c@example.com",
    });

    const bobList = await env.call<unknown[]>(bob, "crm.list-contacts", {});
    expect(bobList).toHaveLength(0);
  });

  it("bob cannot update-deal-stage on a deal owned by alice", async () => {
    const env = await setupCrmTestEnv();
    const aliceContact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "C", email: "c@example.com" },
    );
    const aliceDeal = await env.call<{ id: string }>(
      alice,
      "crm.create-deal",
      { contactId: aliceContact.id, title: "T", amount: 100 },
    );

    await expect(
      env.call(bob, "crm.update-deal-stage", {
        dealId: aliceDeal.id,
        stage: "won",
      }),
    ).rejects.toThrow(/not found/);
  });

  it("bob's log-outreach against alice's contact never sends mail", async () => {
    const env = await setupCrmTestEnv();
    const aliceContact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "C", email: "c@example.com" },
    );

    await expect(
      env.call(bob, "crm.log-outreach", {
        contactId: aliceContact.id,
        subject: "Hi",
        body: "",
      }),
    ).rejects.toThrow();

    const mailCalls = env.callLog.filter(
      (c) => c.capability === "mail.send-email",
    );
    expect(mailCalls).toHaveLength(0);
  });
});
