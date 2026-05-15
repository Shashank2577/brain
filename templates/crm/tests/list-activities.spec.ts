import { describe, expect, it } from "vitest";
import { setupCrmTestEnv } from "./harness.js";

const alice = { id: "u_alice", email: "alice@example.com" };

describe("crm.list-activities", () => {
  it("returns an empty list when no activities exist", async () => {
    const env = await setupCrmTestEnv();
    const activities = await env.call<unknown[]>(
      alice,
      "crm.list-activities",
      {},
    );
    expect(activities).toEqual([]);
  });

  it("filters by kind and contactId", async () => {
    const env = await setupCrmTestEnv();
    env.stubReturns.set("mail.send-email", { id: "m" });
    env.stubReturns.set("calendar.create-event", { id: "e" });

    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "C", email: "c@example.com" },
    );
    await env.call(alice, "crm.log-outreach", {
      contactId: contact.id,
      subject: "Outreach 1",
      body: "",
    });
    const now = Date.now();
    await env.call(alice, "crm.schedule-meeting", {
      contactId: contact.id,
      title: "Meeting 1",
      startsAt: now,
      endsAt: now + 30 * 60 * 1000,
    });

    const emails = await env.call<unknown[]>(alice, "crm.list-activities", {
      contactId: contact.id,
      kind: "email",
    });
    expect(emails).toHaveLength(1);
    expect((emails[0] as { summary: string }).summary).toBe("Outreach 1");

    const meetings = await env.call<unknown[]>(alice, "crm.list-activities", {
      contactId: contact.id,
      kind: "meeting",
    });
    expect(meetings).toHaveLength(1);
    expect((meetings[0] as { summary: string }).summary).toBe("Meeting 1");
  });

  it("orders activities newest-first", async () => {
    const env = await setupCrmTestEnv();
    env.stubReturns.set("mail.send-email", { id: "m" });

    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "C", email: "c@example.com" },
    );
    await env.call(alice, "crm.log-outreach", {
      contactId: contact.id,
      subject: "First",
      body: "",
    });
    // Force a measurable gap between activity timestamps.
    await new Promise((r) => setTimeout(r, 10));
    await env.call(alice, "crm.log-outreach", {
      contactId: contact.id,
      subject: "Second",
      body: "",
    });

    const activities = await env.call<Array<{ summary: string }>>(
      alice,
      "crm.list-activities",
      { contactId: contact.id },
    );
    expect(activities).toHaveLength(2);
    expect(activities[0]?.summary).toBe("Second");
    expect(activities[1]?.summary).toBe("First");
  });
});
