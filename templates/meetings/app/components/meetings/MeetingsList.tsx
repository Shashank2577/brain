import { Link } from "react-router";
import {
  IconCircleDashed,
  IconFileText,
  IconLink,
  IconLoader2,
  IconUsers,
} from "@tabler/icons-react";

export interface MeetingRow {
  id: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  status: "scheduled" | "live" | "finalizing" | "done" | "failed";
  calendarEventId: string | null;
  linkedNoteId: string | null;
  attendeeCount: number;
}

export function MeetingsList({ meetings }: { meetings: MeetingRow[] }) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {meetings.map((m) => (
        <li key={m.id}>
          <Link
            to={`/${m.id}`}
            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/40"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-foreground">
                  {m.title}
                </span>
                <StatusPill status={m.status} />
                {m.linkedNoteId && (
                  <span
                    className="inline-flex items-center text-muted-foreground"
                    title="Linked summary note"
                  >
                    <IconLink size={14} />
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatTimeRange(m.startsAt, m.endsAt)}</span>
                {m.attendeeCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <IconUsers size={12} />
                    {m.attendeeCount}{" "}
                    {m.attendeeCount === 1 ? "attendee" : "attendees"}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StatusPill({ status }: { status: MeetingRow["status"] }) {
  const config: Record<
    MeetingRow["status"],
    { label: string; className: string; spinning: boolean }
  > = {
    scheduled: {
      label: "Scheduled",
      className: "bg-secondary text-secondary-foreground",
      spinning: false,
    },
    live: {
      label: "Live",
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
      spinning: true,
    },
    finalizing: {
      label: "Finalizing",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
      spinning: true,
    },
    done: {
      label: "Done",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
      spinning: false,
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
      spinning: false,
    },
  };
  const c = config[status];
  const Icon = c.spinning ? IconLoader2 : status === "done" ? IconFileText : IconCircleDashed;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.className}`}
    >
      <Icon size={12} className={c.spinning ? "animate-spin" : ""} />
      {c.label}
    </span>
  );
}

function formatTimeRange(starts: string | null, ends: string | null): string {
  if (!starts) return "No start time";
  const startDate = new Date(starts);
  if (Number.isNaN(startDate.getTime())) return "Invalid time";
  const datePart = startDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startPart = startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (!ends) return `${datePart} · ${startPart}`;
  const endDate = new Date(ends);
  if (Number.isNaN(endDate.getTime())) return `${datePart} · ${startPart}`;
  const endPart = endDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${startPart} – ${endPart}`;
}
