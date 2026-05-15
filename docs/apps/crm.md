# CRM

## Purpose

CRM is the system of record for **contacts, deals, and the activity history that ties them together** — and it is the canonical example of a cross-app orchestrator in the Fluid OS. It owns no email, no calendar, no notes. Instead, every "send the prospect an email", "book a 30-min sync", "drop a note on the account" flows through CRM capabilities that compose `mail.send-email`, `calendar.create-event`, `notes.create`, and `tasks.create`, write a row into its own `activities` log, and stamp the resulting `messageId` / `eventId` / `noteId` onto that row so the timeline stays authoritative. The user remains the identity on every outbound side effect — CRM is just the bookkeeper.

## Data model

Three Drizzle tables, all ownable. `activities.kind` and `deals.stage` are SQL string enums (portable across SQLite / Postgres). Foreign keys are declared but **never** cascade-delete to side-effects in other apps — see _Cross-app cleanup_ in the test plan.

```ts
// templates/crm/server/db/schema.ts
import {
  table,
  text,
  integer,
  ownableColumns,
  createSharesTable,
} from "@agent-native/core/db/schema";

export const contacts = table("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  notes: text("notes"), // free-text inline summary; long-form lives in `notes` app
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  ...ownableColumns(),
});
export const contactShares = createSharesTable("contact_shares");

export const deals = table("deals", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  title: text("title").notNull(),
  amount: integer("amount").notNull().default(0), // cents
  stage: text("stage", {
    enum: ["lead", "qualified", "proposal", "won", "lost"],
  })
    .notNull()
    .default("lead"),
  closeDate: text("close_date"), // ISO date, optional
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  ...ownableColumns(),
});
export const dealShares = createSharesTable("deal_shares");

export const activities = table("activities", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  dealId: text("deal_id").references(() => deals.id), // optional — activity may be contact-only
  kind: text("kind", { enum: ["email", "meeting", "note", "call"] }).notNull(),
  summary: text("summary").notNull(),
  // Cross-app foreign refs — opaque ids returned by mail/calendar/notes.
  // Never followed back as DB FKs; deleting them in their home app does NOT
  // delete this row.
  refMessageId: text("ref_message_id"),
  refEventId: text("ref_event_id"),
  refNoteId: text("ref_note_id"),
  at: text("at").notNull(), // ISO timestamp
  ...ownableColumns(),
});
export const activityShares = createSharesTable("activity_shares");
```

## Capabilities

All capabilities preserve the manifest's contract; new ones fill out the standard CRUD surface. Every handler uses `accessFilter(table, sharesTable)` for reads and `assertAccess("<type>", id, role)` for writes. `ctx.user` is the authenticated end user, never the CRM app principal.

| Capability                  | Role         | Description                                                                          |
| --------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `crm.create-contact`        | `write`      | Create a contact owned by the caller.                                                |
| `crm.list-contacts`         | `read`       | List contacts visible to the caller, paged.                                          |
| `crm.get-contact`           | `read`       | Fetch one contact + its recent activity preview.                                     |
| `crm.delete-contact`        | `write`      | Soft-delete a contact (`admin` role); does not touch external refs.                  |
| `crm.create-deal`           | `write`      | Create a deal attached to a contact.                                                 |
| `crm.list-deals`            | `read`       | List deals, optionally filtered by `stage` or `contactId`, ordered by pipeline rank. |
| `crm.update-deal-stage`     | `write`      | Move a deal between stages; emits an audit `activities` row of kind `note`.          |
| `crm.log-outreach`          | `cross-app`  | Send an email AND log the activity. Calls `mail.send-email`.                         |
| `crm.schedule-meeting`      | `cross-app`  | Book a calendar event AND log the activity. Calls `calendar.create-event`.           |
| `crm.list-activities`       | `read`       | Activity feed, optionally scoped to `contactId` or `dealId`, newest-first.           |

```ts
// Shape sketches — full Zod schemas live next to each handler.

"crm.create-contact": {
  input: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    company: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
  }),
  output: contactSchema,
}

"crm.list-contacts": {
  input: z.object({ q: z.string().optional(), limit: z.number().int().positive().max(200).default(50) }).optional(),
  output: z.array(contactSchema),
}

"crm.get-contact": {
  input: z.object({ contactId: z.string() }),
  output: z.object({ contact: contactSchema, recentActivity: z.array(activitySchema) }),
}

"crm.delete-contact": {
  input: z.object({ contactId: z.string() }),
  output: z.object({ ok: z.literal(true) }),
}

"crm.create-deal": {
  input: z.object({
    contactId: z.string(),
    title: z.string().min(1),
    amount: z.number().int().nonnegative(),
    stage: z.enum(["lead", "qualified", "proposal", "won", "lost"]).default("lead"),
    closeDate: z.string().optional(),
  }),
  output: dealSchema,
}

"crm.list-deals": {
  input: z.object({
    contactId: z.string().optional(),
    stage: z.enum(["lead","qualified","proposal","won","lost"]).optional(),
  }).optional(),
  output: z.array(dealSchema),
}

"crm.update-deal-stage": {
  input: z.object({
    dealId: z.string(),
    stage: z.enum(["lead","qualified","proposal","won","lost"]),
    note: z.string().optional(),
  }),
  output: z.object({ deal: dealSchema, activityId: z.string() }),
}

"crm.log-outreach": {
  input: z.object({ contactId: z.string(), subject: z.string().min(1), body: z.string().default("") }),
  output: z.object({ activityId: z.string(), messageId: z.string() }),
}

"crm.schedule-meeting": {
  input: z.object({
    contactId: z.string(),
    title: z.string().min(1),
    startsAt: z.number(),
    endsAt: z.number(),
    extraAttendees: z.array(z.string().email()).optional(),
  }),
  output: z.object({ activityId: z.string(), eventId: z.string() }),
}

"crm.list-activities": {
  input: z.object({
    contactId: z.string().optional(),
    dealId: z.string().optional(),
    kind: z.enum(["email","meeting","note","call"]).optional(),
    limit: z.number().int().positive().max(200).default(50),
  }).optional(),
  output: z.array(activitySchema),
}
```

## UI surface

| Route                  | Purpose                                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/crm`                 | Dashboard: pinned contacts, open deals by value, this-week activity feed, "Add contact" / "Add deal" buttons.                                                                          |
| `/crm/contacts`        | Contact list with search and column sort. Inline "New Contact" sheet (shadcn `Sheet`).                                                                                                 |
| `/crm/contacts/:id`    | Contact detail: header card (name / company / email / phone), tabs for **Activity timeline** (default), **Deals**, **Notes**, **Files**. Activity rows show kind icon + cross-app link out. |
| `/crm/deals`           | Kanban board, columns = `stage` enum. Drag-and-drop fires `crm.update-deal-stage`. Filter chips above board.                                                                           |
| New-contact form       | shadcn `Dialog` from `/crm/contacts` and `/crm`. Validated client + server with the same Zod schema.                                                                                   |
| New-deal form          | shadcn `Dialog` from `/crm/deals` or the contact detail "Deals" tab.                                                                                                                   |
| **Log outreach** button | On contact detail header. Opens mail-compose preloaded with `to: contact.email`. On send, action calls `crm.log-outreach`.                                                            |
| **Schedule meeting** button | On contact detail header. Opens calendar-compose preloaded with `attendees: [contact.email]` and a 30-min default slot. On confirm, action calls `crm.schedule-meeting`.            |

All UI state (current contact id, active deal-board filter) lives in `application_state.navigation` so the agent always knows what the user is looking at. The agent drives navigation via the one-shot `navigate` key, never by writing `navigation` directly.

## Inter-app dependencies

CRM only consumes; it never owns the underlying record. Every call propagates `ctx.user` so the side effect is attributed to the human.

```ts
// crm.log-outreach handler
const sent = (await ctx.call("mail.send-email", {
  to: contact.email,
  subject: input.subject,
  body: input.body,
})) as { id: string };
// activities row gets refMessageId = sent.id

// crm.schedule-meeting handler
const evt = (await ctx.call("calendar.create-event", {
  title: input.title,
  startsAt: input.startsAt,
  endsAt: input.endsAt,
  attendees: [contact.email, ...(input.extraAttendees ?? [])],
})) as { id: string };
// activities row gets refEventId = evt.id

// Contact detail "Add note" button -> action wraps:
const note = (await ctx.call("notes.create", {
  title: `Note: ${contact.name}`,
  body: input.body,
  tags: ["crm", `contact:${contact.id}`],
})) as { id: string };
// activities row of kind="note" gets refNoteId = note.id

// "Follow up next Tuesday" from a deal -> action wraps:
await ctx.call("tasks.create", {
  title: `Follow up: ${deal.title}`,
  dueAt: input.dueAt,
  tags: ["crm", `deal:${deal.id}`],
});
```

The manifest's `consumes` list becomes:

```ts
consumes: [
  "mail.send-email",
  "mail.find-contact",
  "calendar.create-event",
  "notes.create",
  "tasks.create",
]
```

## Inter-app consumers

- **dispatch** subscribes to recent `crm.list-activities` so the agent can include a contact's last-N interactions in its context window when the user opens a thread tied to that contact.
- **analytics** taps deal-stage transitions (the audit `activities` rows emitted by `crm.update-deal-stage`) to build pipeline funnels — lead → qualified → proposal → won/lost conversion and time-in-stage. This is a read-only consumer; analytics never writes back.
- **content** can be installed as a downstream — letting "Generate proposal doc" from a deal call `content.create-document`, mirroring the pattern in `crossAppDemo`.

## Test plan

Unit, integration, and e2e tests live under `templates/crm/tests/`. All cross-app tests run against an in-process Fluid OS host with stub adapters for the consumed capabilities so we can assert call payloads.

- [ ] **unit** `contacts.spec.ts` — `crm.create-contact` rejects malformed email, persists with `ownerEmail = ctx.user.email`, and never returns `ownerEmail` in the output payload.
- [ ] **unit** `deals.spec.ts` — `crm.create-deal` rejects when `contactId` does not belong to the caller; `crm.update-deal-stage` writes an `activities` row of kind `note` summarising the transition.
- [ ] **integration** `log-outreach.spec.ts` — calling `crm.log-outreach`:
  - asserts a new row in `activities` with `kind = "email"` and `summary = input.subject`,
  - asserts `mail.send-email` was called **exactly once** with `{ to: contact.email, subject, body }`,
  - asserts the stubbed `mail.send-email` return value's `id` is stored in `activities.refMessageId`,
  - asserts the returned `{ activityId, messageId }` matches what was persisted.
- [ ] **integration** `schedule-meeting.spec.ts` — calling `crm.schedule-meeting`:
  - asserts `calendar.create-event` was called with `attendees` array that **inherits** `contact.email` plus any `extraAttendees`,
  - asserts the returned `eventId` is stored in `activities.refEventId`,
  - asserts a single `activities` row of kind `meeting` is written.
- [ ] **integration** `identity-propagation.spec.ts` — with a session for user `alice`, calling `crm.log-outreach` from the CRM app must result in `mail.send-email` receiving a context whose `ctx.user.email === "alice@example.com"`. The CRM app principal must never appear as the sender. Re-run with `crm.schedule-meeting` and `calendar.create-event` to assert the same identity flows through.
- [ ] **integration** `cross-app-cleanup.spec.ts` — create a contact, log an outreach (producing a `mail` message), schedule a meeting (producing a `calendar` event), then call `crm.delete-contact`. Assert:
  - the CRM `contacts` row is soft-deleted,
  - the CRM `activities` rows are soft-deleted (or detached),
  - the `mail` message **still exists** in the mail app's store and is reachable via `mail.get-message`,
  - the `calendar` event **still exists** and is reachable via `calendar.get-event`.
  - (Email and calendar entries have their own ownership and their own lifecycle — CRM never cascades into them.)
- [ ] **integration** `access-control.spec.ts` — user `bob` cannot `crm.get-contact` for a contact owned by `alice` unless an explicit `contact_shares` row exists. `crm.list-contacts` returns zero rows. `crm.update-deal-stage` rejects without `editor`.
- [ ] **e2e** `kanban.spec.ts` (Playwright) — load `/crm/deals`, drag a card from `qualified` to `proposal`, assert the column move, assert a new activity row in the contact detail page, assert no full-page reload.
- [ ] **e2e** `compose-handoff.spec.ts` — from a contact page, click **Log outreach**, confirm the mail-compose dialog opens prefilled with `contact.email`, send, assert the new `email`-kind row appears in the activity timeline within one polling cycle.

## Migration from manifest

Delete `packages/fluid-os/examples/apps/crm/manifest.ts` once the template is wired up in `templates/crm/`. **Preserve**:

1. The four capability names — `crm.create-contact`, `crm.create-deal`, `crm.log-outreach`, `crm.schedule-meeting` — and their Zod input/output shapes, so existing callers (including the `crossAppDemo` in `packages/fluid-os/examples/host/server.ts`) keep working.
2. The `consumes` list — promoted into the template's `mcp.config.json` / capability registry — plus the two new entries (`notes.create`, `tasks.create`).
3. The activity-row pattern: every `cross-app` capability MUST write its own `activities` row, stamp the returned id onto the appropriate `ref*` column, and return `{ activityId, <externalId> }` to the caller.
4. The `agentGuidance` paragraph — copied verbatim into `templates/crm/CLAUDE.md` as the agent's mental model. The line _"CRM owns contacts, deals, and activity history. It does NOT own email or calendar — it composes them."_ is the load-bearing sentence.

Drop the in-memory `Map<string, …>` stores; replace with Drizzle tables defined above and `ownableColumns()`. Update `crossAppDemo` to drive the new template via HTTP rather than the in-process manifest once the template is installed in the example host.

---

⠀
🟢 Implemented the requested change
