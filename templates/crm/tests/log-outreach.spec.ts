import { describe, expect, it } from "vitest";
import { setupCrmTestEnv, readActivities } from "./harness.js";

const alice = { id: "u_alice", email: "alice@example.com", name: "Alice" };

describe("crm.log-outreach (integration)", () => {
  it("calls mail.send-email exactly once with { to, subject, body } and stamps the returned id onto activities.refMessageId", async () => {
    const env = await setupCrmTestEnv();
    // Stub mail.send-email to return a known message id so we can assert on it.
    env.stubReturns.set("mail.send-email", { id: "msg_abc123" });

    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "Carol", email: "carol@example.com" },
    );

    const result = await env.call<{
      activityId: string;
      messageId: string;
    }>(alice, "crm.log-outreach", {
      contactId: contact.id,
      subject: "Pro plan — next steps",
      body: "Hi Carol, attaching a one-pager.",
    });

    // 1. mail.send-email was called exactly once.
    const mailCalls = env.callLog.filter(
      (c) => c.capability === "mail.send-email",
    );
    expect(mailCalls).toHaveLength(1);
    expect(mailCalls[0]?.input).toEqual({
      to: "carol@example.com",
      subject: "Pro plan — next steps",
      body: "Hi Carol, attaching a one-pager.",
    });

    // 2. mail.send-email's stub return id flowed back to the caller.
    expect(result.messageId).toBe("msg_abc123");

    // 3. The persisted activities row has the right shape:
    const activities = await readActivities();
    expect(activities).toHaveLength(1);
    expect(activities[0]?.id).toBe(result.activityId);
    expect(activities[0]?.kind).toBe("email");
    expect(activities[0]?.contactId).toBe(contact.id);
    expect(activities[0]?.summary).toBe("Pro plan — next steps");
    expect(activities[0]?.refMessageId).toBe("msg_abc123");
    expect(activities[0]?.refEventId).toBeNull();
    expect(activities[0]?.refNoteId).toBeNull();
  });

  it("rejects when the contact does not belong to the caller", async () => {
    const env = await setupCrmTestEnv();
    const aliceContact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "C", email: "c@example.com" },
    );

    const bob = { id: "u_bob", email: "bob@example.com" };
    await expect(
      env.call(bob, "crm.log-outreach", {
        contactId: aliceContact.id,
        subject: "Hi",
        body: "",
      }),
    ).rejects.toThrow(/not found/);

    // Most importantly: mail.send-email was NEVER called — we don't want a
    // foreign user to inadvertently send an email from someone else's
    // identity, even if the rest of the flow would have rolled back.
    const mailCalls = env.callLog.filter(
      (c) => c.capability === "mail.send-email",
    );
    expect(mailCalls).toHaveLength(0);
  });
});
