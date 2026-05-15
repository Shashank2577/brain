import { describe, expect, it } from "vitest";
import {
  setupCrmTestEnv,
  readActivities,
  readContacts,
} from "./harness.js";

const alice = { id: "u_alice", email: "alice@example.com" };

describe("crm.delete-contact does NOT cascade across apps", () => {
  it("soft-deletes the CRM contact + activities but leaves mail/calendar refs alone", async () => {
    const env = await setupCrmTestEnv();
    env.stubReturns.set("mail.send-email", { id: "msg_real_message" });
    env.stubReturns.set("calendar.create-event", { id: "evt_real_event" });

    // 1. Set up a contact with a logged outreach + scheduled meeting.
    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "Carol", email: "carol@example.com" },
    );
    await env.call(alice, "crm.log-outreach", {
      contactId: contact.id,
      subject: "Hi",
      body: "",
    });
    const now = Date.now();
    await env.call(alice, "crm.schedule-meeting", {
      contactId: contact.id,
      title: "Sync",
      startsAt: now,
      endsAt: now + 30 * 60 * 1000,
    });

    // Pre-delete sanity — we have 2 activities, both stamped with refs.
    let activities = await readActivities();
    expect(activities).toHaveLength(2);
    expect(activities.some((a) => a.refMessageId === "msg_real_message")).toBe(
      true,
    );
    expect(activities.some((a) => a.refEventId === "evt_real_event")).toBe(
      true,
    );

    // 2. Delete the contact.
    const result = await env.call<{ ok: true }>(
      alice,
      "crm.delete-contact",
      { contactId: contact.id },
    );
    expect(result.ok).toBe(true);

    // 3. CRM rows are soft-deleted.
    const contacts = await readContacts();
    expect(contacts).toHaveLength(1);
    expect(contacts[0]?.deletedAt).not.toBeNull();

    activities = await readActivities();
    expect(activities).toHaveLength(2);
    for (const a of activities) {
      expect(a.deletedAt).not.toBeNull();
    }

    // 4. CRM did NOT issue any cascade calls into mail/calendar/notes/tasks.
    // The refMessageId and refEventId values still exist in the activity
    // rows even after soft-delete — they're authoritative pointers into
    // their home apps, and the spec says CRM never deletes them.
    const cascadeCalls = env.callLog.filter(
      (c) =>
        c.capability === "mail.delete-message" ||
        c.capability === "calendar.delete-event" ||
        c.capability === "notes.delete",
    );
    expect(cascadeCalls).toHaveLength(0);

    // The mail messageId + calendar eventId are still authoritative refs
    // on the soft-deleted activity rows. We treat them as living outside
    // CRM's lifecycle — the home apps own them.
    const refMessageIds = activities.map((a) => a.refMessageId);
    const refEventIds = activities.map((a) => a.refEventId);
    expect(refMessageIds).toContain("msg_real_message");
    expect(refEventIds).toContain("evt_real_event");
  });
});
