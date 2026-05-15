import { describe, expect, it } from "vitest";
import { crmApp } from "../server/manifest.js";

describe("CRM fluid-os manifest", () => {
  it("preserves the four legacy capability names with the expected contract", async () => {
    const ids = Object.keys(crmApp.capabilities);
    // These four MUST be preserved verbatim — `crossAppDemo` and any other
    // third-party caller still depends on them.
    expect(ids).toContain("create-contact");
    expect(ids).toContain("create-deal");
    expect(ids).toContain("log-outreach");
    expect(ids).toContain("schedule-meeting");
  });

  it("exposes the new spec capabilities (list/get/delete + activities)", async () => {
    const ids = Object.keys(crmApp.capabilities);
    expect(ids).toContain("list-contacts");
    expect(ids).toContain("get-contact");
    expect(ids).toContain("list-deals");
    expect(ids).toContain("update-deal-stage");
    expect(ids).toContain("delete-contact");
    expect(ids).toContain("list-activities");
  });

  it("declares the full consumes list (mail + calendar + notes + tasks)", () => {
    expect(crmApp.consumes).toEqual(
      expect.arrayContaining([
        "mail.send-email",
        "mail.find-contact",
        "calendar.create-event",
        "notes.create",
        "tasks.create",
      ]),
    );
  });

  it("agentGuidance carries the load-bearing CRM-is-an-orchestrator sentence", () => {
    expect(crmApp.agentGuidance).toMatch(
      /does NOT own email or calendar.*it composes them/i,
    );
  });

  it("create-contact rejects invalid email at the schema layer", async () => {
    const cap = crmApp.capabilities["create-contact"];
    expect(() =>
      cap.input.parse({ name: "X", email: "not-an-email" }),
    ).toThrow();
    // Valid email passes:
    expect(
      cap.input.parse({ name: "X", email: "x@example.com" }),
    ).toMatchObject({ email: "x@example.com" });
  });

  it("update-deal-stage input requires a valid stage enum", async () => {
    const cap = crmApp.capabilities["update-deal-stage"];
    expect(() =>
      cap.input.parse({ dealId: "d_1", stage: "in-progress" }),
    ).toThrow();
    expect(
      cap.input.parse({ dealId: "d_1", stage: "qualified" }),
    ).toMatchObject({ stage: "qualified" });
  });
});
