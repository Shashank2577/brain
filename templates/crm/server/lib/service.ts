/**
 * CRM service — the single source of truth for every capability the CRM
 * exposes. Both the standalone template actions and the fluid-os manifest
 * delegate to these functions so behavior cannot diverge.
 *
 * Each function takes an explicit `OwnerCtx` containing the authenticated
 * user's email + active org id rather than reading from request-context.
 * That lets us reuse them inside the fluid-os manifest handler where the
 * caller has already resolved `ctx.user`.
 */

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { nanoid, type DealStage, type ActivityKind } from "./crm.js";
import type {
  Contact,
  Deal,
  Activity,
} from "../../shared/schemas.js";

export interface OwnerCtx {
  /** Authenticated user's email — used as `owner_email` on writes. */
  ownerEmail: string;
  /** Optional org id — used as `org_id` on writes. */
  orgId?: string;
}

// -----------------------------------------------------------------------------
// Row shapers — strip framework-internal columns from outbound payloads.
// We keep `owner_email` server-side but never leak it across the RPC boundary
// (the user's email is the agent's authoritative identity, not a CRM field).
// -----------------------------------------------------------------------------

function rowToContact(row: typeof schema.contacts.$inferSelect): Contact {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company ?? undefined,
    phone: row.phone ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToDeal(row: typeof schema.deals.$inferSelect): Deal {
  return {
    id: row.id,
    contactId: row.contactId,
    title: row.title,
    amount: row.amount,
    stage: row.stage as DealStage,
    closeDate: row.closeDate ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToActivity(row: typeof schema.activities.$inferSelect): Activity {
  return {
    id: row.id,
    contactId: row.contactId,
    dealId: row.dealId ?? undefined,
    kind: row.kind as ActivityKind,
    summary: row.summary,
    refMessageId: row.refMessageId ?? undefined,
    refEventId: row.refEventId ?? undefined,
    refNoteId: row.refNoteId ?? undefined,
    at: row.at,
  };
}

// -----------------------------------------------------------------------------
// Access checks. The standalone-template surface uses framework
// accessFilter/assertAccess; the fluid-os manifest path verifies the owner
// manually because it isn't wrapped by request-context. We keep both fully
// explicit here — never trust an unauthenticated caller.
// -----------------------------------------------------------------------------

async function loadOwnedContact(
  contactId: string,
  owner: OwnerCtx,
): Promise<typeof schema.contacts.$inferSelect> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.contacts)
    .where(
      and(
        eq(schema.contacts.id, contactId),
        eq(schema.contacts.ownerEmail, owner.ownerEmail),
        isNull(schema.contacts.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new Error(`contact ${contactId} not found`);
  return row;
}

async function loadOwnedDeal(
  dealId: string,
  owner: OwnerCtx,
): Promise<typeof schema.deals.$inferSelect> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.deals)
    .where(
      and(
        eq(schema.deals.id, dealId),
        eq(schema.deals.ownerEmail, owner.ownerEmail),
        isNull(schema.deals.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new Error(`deal ${dealId} not found`);
  return row;
}

// -----------------------------------------------------------------------------
// Contacts
// -----------------------------------------------------------------------------

export async function createContact(
  input: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    notes?: string;
  },
  owner: OwnerCtx,
): Promise<Contact> {
  const db = getDb();
  const id = `contact_${nanoid(10)}`;
  const now = new Date().toISOString();
  await db.insert(schema.contacts).values({
    id,
    name: input.name,
    email: input.email,
    company: input.company ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
    ownerEmail: owner.ownerEmail,
    orgId: owner.orgId ?? null,
  });
  return {
    id,
    name: input.name,
    email: input.email,
    company: input.company,
    phone: input.phone,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listContacts(
  input: { q?: string; limit?: number } | undefined,
  owner: OwnerCtx,
): Promise<Contact[]> {
  const db = getDb();
  const limit = input?.limit ?? 50;
  const conditions = [
    eq(schema.contacts.ownerEmail, owner.ownerEmail),
    isNull(schema.contacts.deletedAt),
  ];
  if (input?.q) {
    const pat = `%${input.q.toLowerCase()}%`;
    conditions.push(
      sql`(LOWER(${schema.contacts.name}) LIKE ${pat} OR LOWER(${schema.contacts.email}) LIKE ${pat} OR LOWER(COALESCE(${schema.contacts.company}, '')) LIKE ${pat})`,
    );
  }
  const rows = await db
    .select()
    .from(schema.contacts)
    .where(and(...conditions))
    .orderBy(desc(schema.contacts.createdAt))
    .limit(limit);
  return rows.map(rowToContact);
}

export async function getContact(
  input: { contactId: string },
  owner: OwnerCtx,
): Promise<{ contact: Contact; recentActivity: Activity[] }> {
  const row = await loadOwnedContact(input.contactId, owner);
  const db = getDb();
  const activityRows = await db
    .select()
    .from(schema.activities)
    .where(
      and(
        eq(schema.activities.contactId, row.id),
        eq(schema.activities.ownerEmail, owner.ownerEmail),
        isNull(schema.activities.deletedAt),
      ),
    )
    .orderBy(desc(schema.activities.at))
    .limit(20);
  return {
    contact: rowToContact(row),
    recentActivity: activityRows.map(rowToActivity),
  };
}

export async function deleteContact(
  input: { contactId: string },
  owner: OwnerCtx,
): Promise<{ ok: true }> {
  const row = await loadOwnedContact(input.contactId, owner);
  const db = getDb();
  const now = new Date().toISOString();
  await db
    .update(schema.contacts)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(schema.contacts.id, row.id));
  // Detach (soft-delete) associated activities so the timeline view hides
  // them — but DO NOT cascade into mail/calendar/notes via their ref* ids.
  // Their home apps own those rows.
  await db
    .update(schema.activities)
    .set({ deletedAt: now })
    .where(
      and(
        eq(schema.activities.contactId, row.id),
        eq(schema.activities.ownerEmail, owner.ownerEmail),
      ),
    );
  return { ok: true as const };
}

// -----------------------------------------------------------------------------
// Deals
// -----------------------------------------------------------------------------

export async function createDeal(
  input: {
    contactId: string;
    title: string;
    amount: number;
    stage?: DealStage;
    closeDate?: string;
  },
  owner: OwnerCtx,
): Promise<Deal> {
  // Verify the contact exists AND is owned by the caller. This blocks the
  // common bug where one user could attach a deal to another user's contact.
  await loadOwnedContact(input.contactId, owner);

  const db = getDb();
  const id = `deal_${nanoid(10)}`;
  const now = new Date().toISOString();
  const stage = input.stage ?? "lead";
  await db.insert(schema.deals).values({
    id,
    contactId: input.contactId,
    title: input.title,
    amount: input.amount,
    stage,
    closeDate: input.closeDate ?? null,
    createdAt: now,
    updatedAt: now,
    ownerEmail: owner.ownerEmail,
    orgId: owner.orgId ?? null,
  });
  return {
    id,
    contactId: input.contactId,
    title: input.title,
    amount: input.amount,
    stage,
    closeDate: input.closeDate,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listDeals(
  input: { contactId?: string; stage?: DealStage } | undefined,
  owner: OwnerCtx,
): Promise<Deal[]> {
  const db = getDb();
  const conditions = [
    eq(schema.deals.ownerEmail, owner.ownerEmail),
    isNull(schema.deals.deletedAt),
  ];
  if (input?.contactId) {
    conditions.push(eq(schema.deals.contactId, input.contactId));
  }
  if (input?.stage) {
    conditions.push(eq(schema.deals.stage, input.stage));
  }
  // Order by pipeline rank ASC, then most-recently created within each
  // stage — matches the way a sales rep reads the kanban.
  const rows = await db
    .select()
    .from(schema.deals)
    .where(and(...conditions))
    .orderBy(
      sql`CASE ${schema.deals.stage}
        WHEN 'lead' THEN 0
        WHEN 'qualified' THEN 1
        WHEN 'proposal' THEN 2
        WHEN 'won' THEN 3
        WHEN 'lost' THEN 4
        ELSE 99 END`,
      desc(schema.deals.createdAt),
    );
  return rows.map(rowToDeal);
}

export async function updateDealStage(
  input: { dealId: string; stage: DealStage; note?: string },
  owner: OwnerCtx,
): Promise<{ deal: Deal; activityId: string }> {
  const row = await loadOwnedDeal(input.dealId, owner);
  const fromStage = row.stage;
  if (fromStage === input.stage) {
    // Idempotent — no audit activity row.
    return { deal: rowToDeal(row), activityId: "" };
  }

  const db = getDb();
  const now = new Date().toISOString();
  await db
    .update(schema.deals)
    .set({ stage: input.stage, updatedAt: now })
    .where(eq(schema.deals.id, row.id));

  const summary =
    input.note ??
    `Stage changed from ${fromStage} to ${input.stage}`;
  const activityId = `act_${nanoid(10)}`;
  await db.insert(schema.activities).values({
    id: activityId,
    contactId: row.contactId,
    dealId: row.id,
    kind: "note",
    summary,
    at: now,
    ownerEmail: owner.ownerEmail,
    orgId: owner.orgId ?? null,
  });

  return {
    deal: { ...rowToDeal(row), stage: input.stage, updatedAt: now },
    activityId,
  };
}

// -----------------------------------------------------------------------------
// Activities (read-only — writes happen as side effects of cross-app calls
// or update-deal-stage)
// -----------------------------------------------------------------------------

export async function listActivities(
  input:
    | {
        contactId?: string;
        dealId?: string;
        kind?: ActivityKind;
        limit?: number;
      }
    | undefined,
  owner: OwnerCtx,
): Promise<Activity[]> {
  const db = getDb();
  const limit = input?.limit ?? 50;
  const conditions = [
    eq(schema.activities.ownerEmail, owner.ownerEmail),
    isNull(schema.activities.deletedAt),
  ];
  if (input?.contactId) {
    conditions.push(eq(schema.activities.contactId, input.contactId));
  }
  if (input?.dealId) {
    conditions.push(eq(schema.activities.dealId, input.dealId));
  }
  if (input?.kind) {
    conditions.push(eq(schema.activities.kind, input.kind));
  }
  const rows = await db
    .select()
    .from(schema.activities)
    .where(and(...conditions))
    .orderBy(desc(schema.activities.at))
    .limit(limit);
  return rows.map(rowToActivity);
}

// -----------------------------------------------------------------------------
// Cross-app: log outreach + schedule meeting. These write an activity row
// AFTER the cross-app call succeeds, stamping the foreign id onto the
// appropriate ref* column.
// -----------------------------------------------------------------------------

export type CrossAppCaller = <O = unknown>(
  capability: string,
  input: unknown,
) => Promise<O>;

export async function logOutreach(
  input: { contactId: string; subject: string; body?: string },
  owner: OwnerCtx,
  call: CrossAppCaller,
): Promise<{ activityId: string; messageId: string }> {
  const contact = await loadOwnedContact(input.contactId, owner);

  // The mail.send-email capability MUST receive the user's email (not the
  // CRM app's). Identity propagation flows through the fluid-os RPC layer's
  // ctx.user automatically — we just pass payload, never overriding `from`.
  const sent = await call<{ id: string }>("mail.send-email", {
    to: contact.email,
    subject: input.subject,
    body: input.body ?? "",
  });

  const db = getDb();
  const now = new Date().toISOString();
  const activityId = `act_${nanoid(10)}`;
  await db.insert(schema.activities).values({
    id: activityId,
    contactId: contact.id,
    dealId: null,
    kind: "email",
    summary: input.subject,
    refMessageId: sent.id,
    at: now,
    ownerEmail: owner.ownerEmail,
    orgId: owner.orgId ?? null,
  });

  return { activityId, messageId: sent.id };
}

export async function scheduleMeeting(
  input: {
    contactId: string;
    title: string;
    startsAt: number;
    endsAt: number;
    extraAttendees?: string[];
  },
  owner: OwnerCtx,
  call: CrossAppCaller,
): Promise<{ activityId: string; eventId: string }> {
  const contact = await loadOwnedContact(input.contactId, owner);

  // Always include the CRM contact on the attendee list. Extra attendees are
  // appended after the contact so the contact is the canonical primary.
  const attendees = [
    contact.email,
    ...(input.extraAttendees ?? []),
  ];

  const evt = await call<{ id: string }>("calendar.create-event", {
    title: input.title,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    attendees,
  });

  const db = getDb();
  const now = new Date().toISOString();
  const activityId = `act_${nanoid(10)}`;
  await db.insert(schema.activities).values({
    id: activityId,
    contactId: contact.id,
    dealId: null,
    kind: "meeting",
    summary: input.title,
    refEventId: evt.id,
    at: now,
    ownerEmail: owner.ownerEmail,
    orgId: owner.orgId ?? null,
  });

  return { activityId, eventId: evt.id };
}
