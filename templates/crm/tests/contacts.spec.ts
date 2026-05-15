import { describe, expect, it } from "vitest";
import { setupCrmTestEnv, readContacts } from "./harness.js";

const alice = { id: "u_alice", email: "alice@example.com", name: "Alice" };

describe("crm.create-contact", () => {
  it("persists a contact owned by the caller", async () => {
    const env = await setupCrmTestEnv();
    const contact = await env.call<{
      id: string;
      name: string;
      email: string;
    }>(alice, "crm.create-contact", {
      name: "Carol Chen",
      email: "carol@example.com",
      company: "Acme",
    });

    expect(contact.id).toMatch(/^contact_/);
    expect(contact.name).toBe("Carol Chen");
    expect(contact.email).toBe("carol@example.com");

    // DB-side: row exists with the correct owner_email.
    const rows = await readContacts();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.ownerEmail).toBe("alice@example.com");
    expect(rows[0]?.deletedAt).toBeNull();
  });

  it("rejects a malformed email address", async () => {
    const env = await setupCrmTestEnv();
    await expect(
      env.call(alice, "crm.create-contact", {
        name: "Bad",
        email: "not-an-email",
      }),
    ).rejects.toThrow();
  });

  it("never returns ownerEmail in the output payload", async () => {
    const env = await setupCrmTestEnv();
    const contact = await env.call<Record<string, unknown>>(
      alice,
      "crm.create-contact",
      { name: "Carol", email: "carol@example.com" },
    );
    expect(contact).not.toHaveProperty("ownerEmail");
    expect(contact).not.toHaveProperty("owner_email");
  });
});

describe("crm.list-contacts", () => {
  it("returns only contacts owned by the caller", async () => {
    const env = await setupCrmTestEnv();
    const bob = { id: "u_bob", email: "bob@example.com", name: "Bob" };

    await env.call(alice, "crm.create-contact", {
      name: "Alice contact",
      email: "alice-contact@example.com",
    });
    await env.call(bob, "crm.create-contact", {
      name: "Bob contact",
      email: "bob-contact@example.com",
    });

    const aliceContacts = await env.call<unknown[]>(
      alice,
      "crm.list-contacts",
      {},
    );
    const bobContacts = await env.call<unknown[]>(bob, "crm.list-contacts", {});

    expect(aliceContacts).toHaveLength(1);
    expect(bobContacts).toHaveLength(1);
    expect((aliceContacts[0] as { email: string }).email).toBe(
      "alice-contact@example.com",
    );
    expect((bobContacts[0] as { email: string }).email).toBe(
      "bob-contact@example.com",
    );
  });

  it("filters by free-text query (name/email/company)", async () => {
    const env = await setupCrmTestEnv();
    await env.call(alice, "crm.create-contact", {
      name: "Carol Chen",
      email: "carol@acme.com",
      company: "Acme",
    });
    await env.call(alice, "crm.create-contact", {
      name: "Dave Davis",
      email: "dave@globex.com",
      company: "Globex",
    });

    const acmeOnly = await env.call<unknown[]>(alice, "crm.list-contacts", {
      q: "acme",
    });
    expect(acmeOnly).toHaveLength(1);
    expect((acmeOnly[0] as { name: string }).name).toBe("Carol Chen");
  });
});

describe("crm.get-contact", () => {
  it("returns the contact plus its recent activity preview", async () => {
    const env = await setupCrmTestEnv();
    const contact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "Carol", email: "carol@example.com" },
    );

    const result = await env.call<{
      contact: { id: string };
      recentActivity: unknown[];
    }>(alice, "crm.get-contact", { contactId: contact.id });

    expect(result.contact.id).toBe(contact.id);
    expect(Array.isArray(result.recentActivity)).toBe(true);
    expect(result.recentActivity).toHaveLength(0);
  });

  it("throws when the caller does not own the contact", async () => {
    const env = await setupCrmTestEnv();
    const bob = { id: "u_bob", email: "bob@example.com" };
    const aliceContact = await env.call<{ id: string }>(
      alice,
      "crm.create-contact",
      { name: "C", email: "c@example.com" },
    );

    await expect(
      env.call(bob, "crm.get-contact", { contactId: aliceContact.id }),
    ).rejects.toThrow(/not found/);
  });
});
