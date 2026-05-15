import {
  IconCalendar,
  IconMail,
  IconNote,
  IconPhone,
} from "@tabler/icons-react";
import type { Activity } from "@shared/schemas";
import { formatRelativeDate, cn } from "@/lib/utils";

const KIND_ICONS = {
  email: IconMail,
  meeting: IconCalendar,
  note: IconNote,
  call: IconPhone,
} as const;

export function ActivityRow({
  activity,
  className,
}: {
  activity: Activity;
  className?: string;
}) {
  const Icon = KIND_ICONS[activity.kind];
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3", className)}>
      <div className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm">{activity.summary}</div>
        <div className="text-xs text-muted-foreground">
          {activity.kind} · {formatRelativeDate(activity.at)}
          {activity.refMessageId && (
            <span title={`Message ${activity.refMessageId}`}>
              {" "}
              · ✉️ logged
            </span>
          )}
          {activity.refEventId && (
            <span title={`Event ${activity.refEventId}`}>
              {" "}
              · 📅 booked
            </span>
          )}
          {activity.refNoteId && (
            <span title={`Note ${activity.refNoteId}`}> · 📝 saved</span>
          )}
        </div>
      </div>
    </div>
  );
}
