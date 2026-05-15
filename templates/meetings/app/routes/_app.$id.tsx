import { useParams } from "react-router";
import { useActionQuery, useActionMutation } from "@agent-native/core/client";
import { IconLoader2 } from "@tabler/icons-react";
import { MeetingDetail } from "@/components/meetings/MeetingDetail";

interface MeetingDetailData {
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

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const meetingId = id ?? "";

  const detail = useActionQuery<MeetingDetailData>("get", { id: meetingId });
  const startTranscript = useActionMutation<
    { transcriptId: string; source: string },
    { meetingId: string }
  >("start-transcript");
  const stopTranscript = useActionMutation<
    { transcriptId: string; status: string },
    { meetingId: string }
  >("stop-transcript");
  const finalize = useActionMutation<
    {
      meetingId: string;
      summaryNoteId: string;
      taskIds: string[];
      followupIds: string[];
      queued?: boolean;
    },
    { meetingId: string }
  >("finalize");

  if (detail.isLoading || !detail.data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 size={16} className="animate-spin" />
        Loading meeting…
      </div>
    );
  }

  if (detail.error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Could not load meeting: {String(detail.error)}
      </div>
    );
  }

  return (
    <MeetingDetail
      data={detail.data}
      onStartTranscript={async () => {
        await startTranscript.mutateAsync({ meetingId });
        detail.refetch();
      }}
      onStopTranscript={async () => {
        await stopTranscript.mutateAsync({ meetingId });
        detail.refetch();
      }}
      onFinalize={async () => {
        await finalize.mutateAsync({ meetingId });
        detail.refetch();
      }}
      isFinalizing={finalize.isPending || detail.data.meeting.status === "finalizing"}
    />
  );
}
