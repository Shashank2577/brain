import { useState } from "react";
import { Link } from "react-router";
import { useActionQuery, useActionMutation } from "@agent-native/core/client";
import {
  IconCalendar,
  IconCircleDashed,
  IconFileText,
  IconLink,
  IconLoader2,
  IconPlus,
} from "@tabler/icons-react";
import { MeetingsList } from "@/components/meetings/MeetingsList";

interface MeetingListItem {
  id: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  status: "scheduled" | "live" | "finalizing" | "done" | "failed";
  calendarEventId: string | null;
  linkedNoteId: string | null;
  attendeeCount: number;
}

export default function MeetingsListPage() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const list = useActionQuery<MeetingListItem[]>("list", { filter });
  const create = useActionMutation<
    { id: string; status: string },
    { title?: string }
  >("create");

  const meetings = list.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prep notes, live transcripts, and AI-generated follow-ups for every
            meeting.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          onClick={async () => {
            await create.mutateAsync({ title: "Untitled meeting" });
            list.refetch();
          }}
          disabled={create.isPending}
        >
          {create.isPending ? (
            <IconLoader2 size={16} className="animate-spin" />
          ) : (
            <IconPlus size={16} />
          )}
          New meeting
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "upcoming", "past"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconLoader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState />
      ) : (
        <MeetingsList meetings={meetings} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <IconCalendar size={20} className="text-muted-foreground" />
      </div>
      <h2 className="text-base font-medium">No meetings yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect a calendar to import events, or click <b>New meeting</b> to
        start ad-hoc.
      </p>
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: MeetingListItem["status"];
}) {
  const config: Record<
    MeetingListItem["status"],
    { label: string; className: string; icon: typeof IconCircleDashed }
  > = {
    scheduled: {
      label: "Scheduled",
      className: "bg-secondary text-secondary-foreground",
      icon: IconCircleDashed,
    },
    live: {
      label: "Live",
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
      icon: IconLoader2,
    },
    finalizing: {
      label: "Finalizing",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
      icon: IconLoader2,
    },
    done: {
      label: "Done",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
      icon: IconFileText,
    },
    failed: {
      label: "Failed",
      className:
        "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
      icon: IconCircleDashed,
    },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.className}`}
    >
      <Icon
        size={12}
        className={status === "live" || status === "finalizing" ? "animate-spin" : ""}
      />
      {c.label}
    </span>
  );
}

export function LinkedNoteIcon({ noteId }: { noteId: string }) {
  return (
    <Link
      to={`/notes/${noteId}`}
      onClick={(e) => e.stopPropagation()}
      title="View linked note"
      className="text-muted-foreground hover:text-foreground"
    >
      <IconLink size={14} />
    </Link>
  );
}
