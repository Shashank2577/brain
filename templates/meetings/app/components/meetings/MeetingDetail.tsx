import {
  IconLoader2,
  IconMicrophone,
  IconPlayerStop,
  IconSparkles,
} from "@tabler/icons-react";
import { TranscriptPane } from "./TranscriptPane";
import { SummaryPane } from "./SummaryPane";
import { ActionItemsList } from "./ActionItemsList";
import { AttendeesList } from "./AttendeesList";

interface DetailData {
  meeting: {
    id: string;
    title: string;
    startsAt: string | null;
    endsAt: string | null;
    calendarEventId: string | null;
    status: "scheduled" | "live" | "finalizing" | "done" | "failed";
    prepNotes: string;
    linkedNoteId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  transcript: {
    id: string;
    status: "pending" | "streaming" | "ready" | "failed";
    source: "native" | "whisper" | "manual";
    fullText: string;
    segments: Array<{
      startMs?: number;
      endMs?: number;
      speaker?: string;
      text: string;
    }>;
  } | null;
  summaries: Array<{
    kind: "summary" | "bullets" | "action_items";
    content: string;
    generatedAt: string;
  }>;
  attendees: Array<{
    email: string | null;
    name: string;
    role: string;
    isOwner: boolean;
  }>;
  followups: Array<{
    id: string;
    text: string;
    assigneeEmail: string | null;
    dueDate: string | null;
    taskId: string | null;
  }>;
}

export function MeetingDetail({
  data,
  onStartTranscript,
  onStopTranscript,
  onFinalize,
  isFinalizing,
}: {
  data: DetailData;
  onStartTranscript: () => void | Promise<void>;
  onStopTranscript: () => void | Promise<void>;
  onFinalize: () => void | Promise<void>;
  isFinalizing: boolean;
}) {
  const { meeting, transcript, summaries, attendees, followups } = data;
  const transcriptIsLive =
    meeting.status === "live" || transcript?.status === "streaming";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {meeting.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatRange(meeting.startsAt, meeting.endsAt)}
              {meeting.calendarEventId && (
                <>
                  {" · "}
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                    Linked event
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!transcriptIsLive ? (
              <button
                type="button"
                onClick={onStartTranscript}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <IconMicrophone size={14} />
                Start notes
              </button>
            ) : (
              <button
                type="button"
                onClick={onStopTranscript}
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:opacity-90"
              >
                <IconPlayerStop size={14} />
                Stop transcription
              </button>
            )}
          </div>
        </div>
      </div>

      <AttendeesList attendees={attendees} />

      <div className="grid gap-4 md:grid-cols-2">
        <TranscriptPane transcript={transcript} prepNotes={meeting.prepNotes} />
        <div className="flex flex-col gap-4">
          {meeting.status !== "done" ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-6">
              <h3 className="text-sm font-semibold">AI Summary</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                When you’re done, finalize to generate the summary, bullets,
                and action items. Each action item becomes a task in the
                Tasks app, and the full summary becomes a note.
              </p>
              <button
                type="button"
                onClick={onFinalize}
                disabled={isFinalizing}
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isFinalizing ? (
                  <IconLoader2 size={14} className="animate-spin" />
                ) : (
                  <IconSparkles size={14} />
                )}
                Finalize meeting
              </button>
            </div>
          ) : (
            <>
              <SummaryPane summaries={summaries} />
              <ActionItemsList followups={followups} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRange(starts: string | null, ends: string | null): string {
  if (!starts) return "No scheduled time";
  const s = new Date(starts);
  if (Number.isNaN(s.getTime())) return "Invalid time";
  const datePart = s.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const sp = s.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (!ends) return `${datePart} · ${sp}`;
  const e = new Date(ends);
  if (Number.isNaN(e.getTime())) return `${datePart} · ${sp}`;
  const ep = e.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${sp} – ${ep}`;
}
