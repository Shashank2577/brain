import { describe, expect, it } from "vitest";
import { setupCrmTestEnv } from "./harness.js";

const alice = {
  id: "u_alice",
  email: "alice@example.com",
  name: "Alice",
};

describe("identity propagation across cross-app calls", () => {
  it("crm.log-outreach forwards Alice's identity to mail.send-email", async () => {
    const env = await setupCrmTestEnv();
    env.stubReturns.set("mail.send-email", { id: "msg_id" });

    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "C", email: "c@example.com" },
    );

    await env.call(alice, "crm.log-outreach", {
      contactId: contact.id,
      subject: "Hi",
      body: "",
    });

    const mailCall = env.callLog.find(
      (c) => c.capability === "mail.send-email",
    );
    // The user on the sub-call is the original Alice, NOT the "crm" app
    // principal. This is the load-bearing contract: when CRM calls Mail,
    // the email is sent BY Alice, not BY some `crm-app@system.local`.
    expect(mailCall?.user.email).toBe("alice@example.com");
    expect(mailCall?.user.id).toBe("u_alice");
    // The sub-call's caller.appId is "crm" — that's the app currently
    // executing when it dispatched the sub-call.
    expect(mailCall?.callerAppId).toBe("crm");
  });

  it("crm.schedule-meeting forwards Alice's identity to calendar.create-event", async () => {
    const env = await setupCrmTestEnv();
    env.stubReturns.set("calendar.create-event", { id: "evt_id" });

    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "C", email: "c@example.com" },
    );
    const now = Date.now();
    await env.call(alice, "crm.schedule-meeting", {
      contactId: contact.id,
      title: "M",
      startsAt: now,
      endsAt: now + 30 * 60 * 1000,
    });

    const calCall = env.callLog.find(
      (c) => c.capability === "calendar.create-event",
    );
    expect(calCall?.user.email).toBe("alice@example.com");
    expect(calCall?.callerAppId).toBe("crm");
  });

  it("the CRM app principal never appears as the cross-app user", async () => {
    const env = await setupCrmTestEnv();
    env.stubReturns.set("mail.send-email", { id: "msg_id" });
    env.stubReturns.set("calendar.create-event", { id: "evt_id" });

    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "C", email: "c@example.com" },
    );
    await env.call(alice, "crm.log-outreach", {
      contactId: contact.id,
      subject: "Hi",
      body: "",
    });
    const now = Date.now();
    await env.call(alice, "crm.schedule-meeting", {
      contactId: contact.id,
      title: "M",
      startsAt: now,
      endsAt: now + 30 * 60 * 1000,
    });

    // No call from the CRM app should ever surface the CRM-as-user.
    for (const call of env.callLog) {
      expect(call.user.email).not.toMatch(/crm[-@.]/);
      expect(call.user.email).toBe("alice@example.com");
    }
  });
});
