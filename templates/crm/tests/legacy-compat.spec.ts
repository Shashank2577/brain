import { describe, expect, it } from "vitest";
import { setupCrmTestEnv } from "./harness.js";

const alice = { id: "u_alice", email: "alice@example.com", name: "Alice" };

/**
 * The legacy `crossAppDemo` in packages/fluid-os/examples/host/server.ts
 * still drives these four capabilities. The promoted template MUST keep
 * accepting their original input shapes and returning the same output
 * shapes so it can replace the in-memory manifest without breaking
 * existing callers.
 */
describe("legacy crossAppDemo compatibility", () => {
  it("end-to-end demo flow runs unchanged against the new template", async () => {
    const env = await setupCrmTestEnv();
    env.stubReturns.set("mail.send-email", { id: "msg_demo" });
    env.stubReturns.set("calendar.create-event", { id: "evt_demo" });

    // 1. crm.create-contact — original input { name, email, company? }
    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      {
        name: "Carol Chen",
        email: "carol@example.com",
        company: "Acme",
      },
    );
    expect(contact.id).toBeTruthy();

    // 2. crm.create-deal — original input { contactId, title, amount, stage? }
    const deal = await env.call<{ id: string; stage: string }>(
      alice,
      "crm.create-deal",
      {
        contactId: contact.id,
        title: "Acme — Pro plan",
        amount: 12000,
      },
    );
    expect(deal.stage).toBe("lead");

    // 3. crm.log-outreach — original input { contactId, subject, body }
    const outreach = await env.call<{
      activityId: string;
      messageId: string;
    }>(alice, "crm.log-outreach", {
      contactId: contact.id,
      subject: "Pro plan — next steps",
      body: "Hi Carol, sharing a one-pager.",
    });
    expect(outreach.messageId).toBe("msg_demo");

    // 4. crm.schedule-meeting — original input { contactId, title, startsAt, endsAt }
    const now = Date.now();
    const meet = await env.call<{ activityId: string; eventId: string }>(
      alice,
      "crm.schedule-meeting",
      {
        contactId: contact.id,
        title: "Carol × Alice — Pro plan",
        startsAt: now + 60 * 60 * 1000,
        endsAt: now + 90 * 60 * 1000,
      },
    );
    expect(meet.eventId).toBe("evt_demo");

    // 5. The legacy list-activity alias still works (singular).
    const activitiesLegacy = await env.call<unknown[]>(
      alice,
      "crm.list-activity",
      { contactId: contact.id },
    );
    expect(activitiesLegacy).toHaveLength(2);
  });
});
