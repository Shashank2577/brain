import { describe, expect, it } from "vitest";
import { setupCrmTestEnv, readActivities } from "./harness.js";

const alice = { id: "u_alice", email: "alice@example.com", name: "Alice" };

describe("crm.schedule-meeting (integration)", () => {
  it("calls calendar.create-event with attendees that include the contact's email and extras, then stamps eventId onto activities.refEventId", async () => {
    const env = await setupCrmTestEnv();
    env.stubReturns.set("calendar.create-event", { id: "evt_xyz789" });

    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "Carol", email: "carol@example.com" },
    );

    const now = Date.now();
    const result = await env.call<{
      activityId: string;
      eventId: string;
    }>(alice, "crm.schedule-meeting", {
      contactId: contact.id,
      title: "Carol × Alice — review",
      startsAt: now + 60 * 60 * 1000,
      endsAt: now + 90 * 60 * 1000,
      extraAttendees: ["dave@example.com"],
    });

    // 1. calendar.create-event was called exactly once.
    const calCalls = env.callLog.filter(
      (c) => c.capability === "calendar.create-event",
    );
    expect(calCalls).toHaveLength(1);
    const input = calCalls[0]?.input as {
      title: string;
      attendees: string[];
    };
    expect(input.title).toBe("Carol × Alice — review");
    expect(input.attendees).toEqual([
      "carol@example.com",
      "dave@example.com",
    ]);

    // 2. The eventId flows back to the caller.
    expect(result.eventId).toBe("evt_xyz789");

    // 3. A single activities row of kind=meeting with refEventId set.
    const activities = await readActivities();
    expect(activities).toHaveLength(1);
    expect(activities[0]?.kind).toBe("meeting");
    expect(activities[0]?.refEventId).toBe("evt_xyz789");
    expect(activities[0]?.refMessageId).toBeNull();
    expect(activities[0]?.summary).toBe("Carol × Alice — review");
  });

  it("inherits the contact's email even with no extra attendees", async () => {
    const env = await setupCrmTestEnv();
    env.stubReturns.set("calendar.create-event", { id: "evt_solo" });

    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "Solo", email: "solo@example.com" },
    );
    const now = Date.now();
    await env.call(alice, "crm.schedule-meeting", {
      contactId: contact.id,
      title: "Solo 1:1",
      startsAt: now,
      endsAt: now + 30 * 60 * 1000,
    });

    const calCalls = env.callLog.filter(
      (c) => c.capability === "calendar.create-event",
    );
    expect(calCalls).toHaveLength(1);
    const input = calCalls[0]?.input as { attendees: string[] };
    expect(input.attendees).toEqual(["solo@example.com"]);
  });
});
