/**
 * Booking lifecycle hooks → workflow / webhook dispatcher.
 *
 * When a booking is created / rescheduled / cancelled / no-shown, we:
 *   - Materialize scheduled reminders for each active workflow step
 *   - Enqueue outgoing webhook deliveries
 *
 * The actual reminder + webhook firing happens on a recurring job (not here).
 */
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSchedulingContext } from "./context.js";
import { addMinutes } from "../core/time.js";
export async function onBookingCreated(booking) {
    await materializeReminders(booking, "new-booking");
    await materializeRemindersBefore(booking);
    await enqueueWebhooks(booking, "BOOKING_CREATED");
}
export async function onBookingRescheduled(original, next) {
    await materializeReminders(next, "reschedule");
    await enqueueWebhooks(next, "BOOKING_RESCHEDULED");
}
export async function onBookingCancelled(booking) {
    await materializeReminders(booking, "cancellation");
    await enqueueWebhooks(booking, "BOOKING_CANCELLED");
    // Cancel any pending before-event reminders
    const { getDb, schema } = getSchedulingContext();
    await getDb()
        .update(schema.scheduledReminders)
        .set({ sent: true, sentAt: new Date().toISOString() })
        .where(and(eq(schema.scheduledReminders.bookingId, booking.id), eq(schema.scheduledReminders.sent, false)));
}
export async function onBookingNoShow(booking) {
    await materializeReminders(booking, "no-show");
    await enqueueWebhooks(booking, "BOOKING_NO_SHOW");
}
async function materializeReminders(booking, trigger) {
    const workflows = await activeWorkflowsForEvent(booking.eventTypeId, trigger);
    const now = new Date();
    for (const wf of workflows) {
        for (const step of wf.steps) {
            const scheduledFor = trigger === "new-booking" && step.offsetMinutes > 0
                ? addMinutes(now, step.offsetMinutes)
                : now;
            await writeReminder(booking, step, scheduledFor);
        }
    }
}
async function materializeRemindersBefore(booking) {
    const workflows = await activeWorkflowsForEvent(booking.eventTypeId, "before-event");
    const start = new Date(booking.startTime);
    for (const wf of workflows) {
        for (const step of wf.steps) {
            // offsetMinutes is how many minutes BEFORE the event
            const scheduledFor = addMinutes(start, -Math.abs(step.offsetMinutes));
            if (scheduledFor <= new Date())
                continue;
            await writeReminder(booking, step, scheduledFor);
        }
    }
    const afterWorkflows = await activeWorkflowsForEvent(booking.eventTypeId, "after-event");
    const end = new Date(booking.endTime);
    for (const wf of afterWorkflows) {
        for (const step of wf.steps) {
            const scheduledFor = addMinutes(end, Math.abs(step.offsetMinutes));
            await writeReminder(booking, step, scheduledFor);
        }
    }
}
async function writeReminder(booking, step, scheduledFor) {
    const { getDb, schema } = getSchedulingContext();
    await getDb()
        .insert(schema.scheduledReminders)
        .values({
        id: nanoid(),
        bookingId: booking.id,
        workflowStepId: step.id,
        method: methodForAction(step.action),
        scheduledFor: scheduledFor.toISOString(),
        sent: false,
        failed: false,
        attempts: 0,
        createdAt: new Date().toISOString(),
    });
}
function methodForAction(action) {
    if (action.startsWith("sms-"))
        return "sms";
    if (action === "webhook")
        return "webhook";
    return "email";
}
async function activeWorkflowsForEvent(eventTypeId, trigger) {
    const { getDb, schema } = getSchedulingContext();
    const db = getDb();
    const wfRows = await db
        .select()
        .from(schema.workflows)
        .where(and(eq(schema.workflows.trigger, trigger), eq(schema.workflows.disabled, false)));
    const active = wfRows.filter((w) => {
        const ids = safeJson(w.activeOnEventTypeIds) ?? [];
        return ids.includes(eventTypeId);
    });
    if (active.length === 0)
        return [];
    const stepRows = await db
        .select()
        .from(schema.workflowSteps)
        .where(inArray(schema.workflowSteps.workflowId, active.map((w) => w.id)));
    return active.map((w) => hydrateWorkflow(w, stepRows));
}
async function enqueueWebhooks(booking, event) {
    const { getDb, schema } = getSchedulingContext();
    const db = getDb();
    const webhooks = await db.select().from(schema.webhooks);
    const now = new Date().toISOString();
    for (const wh of webhooks) {
        if (!wh.active)
            continue;
        const triggers = safeJson(wh.eventTriggers) ?? [];
        if (!triggers.includes(event))
            continue;
        if (wh.eventTypeId && wh.eventTypeId !== booking.eventTypeId)
            continue;
        await db.insert(schema.webhookDeliveries).values({
            id: nanoid(),
            webhookId: wh.id,
            triggeredAt: now,
            payload: JSON.stringify({ event, booking }),
            success: false,
            attempts: 0,
        });
    }
}
function hydrateWorkflow(row, steps) {
    return {
        id: row.id,
        name: row.name,
        trigger: row.trigger,
        ownerEmail: row.ownerEmail ?? undefined,
        teamId: row.teamId ?? undefined,
        activeOnEventTypeIds: safeJson(row.activeOnEventTypeIds) ?? [],
        disabled: Boolean(row.disabled),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        steps: steps
            .filter((s) => s.workflowId === row.id)
            .sort((a, b) => a.order - b.order)
            .map((s) => ({
            id: s.id,
            order: s.order,
            action: s.action,
            offsetMinutes: s.offsetMinutes,
            sendTo: s.sendTo ?? undefined,
            emailSubject: s.emailSubject ?? undefined,
            emailBody: s.emailBody ?? undefined,
            smsBody: s.smsBody ?? undefined,
            webhookUrl: s.webhookUrl ?? undefined,
            template: s.template ?? undefined,
        })),
    };
}
function safeJson(s) {
    if (!s)
        return undefined;
    try {
        return JSON.parse(s);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=hooks.js.map