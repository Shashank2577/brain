import { IconCircleDashed, IconMicrophone } from "@tabler/icons-react";

interface Segment {
  startMs?: number;
  endMs?: number;
  speaker?: string;
  text: string;
}

export function TranscriptPane({
  transcript,
  prepNotes,
}: {
  transcript: {
    id: string;
    status: "pending" | "streaming" | "ready" | "failed";
    source: "native" | "whisper" | "manual";
    fullText: string;
    segments: Segment[];
  } | null;
  prepNotes: string;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-4 py-2">
          <h3 className="text-sm font-semibold">Transcript</h3>
          {transcript && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-xs capitalize">
              {transcript.source} · {transcript.status}
            </span>
          )}
        </header>
        <div className="max-h-[420px] overflow-y-auto p-4 text-sm">
          {!transcript ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconMicrophone size={14} />
              Click <b>Start notes</b> to begin live transcription.
            </div>
          ) : transcript.segments.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconCircleDashed size={14} className="animate-spin" />
              Waiting for the first segment…
            </div>
          ) : (
            <ul className="space-y-2">
              {transcript.segments.map((seg, i) => (
                <li key={i} className="leading-relaxed">
                  {seg.speaker && (
                    <span className="font-semibold text-foreground">
                      {seg.speaker}:{" "}
                    </span>
                  )}
                  <span className="text-muted-foreground">{seg.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <header className="border-b border-border px-4 py-2">
          <h3 className="text-sm font-semibold">Prep notes</h3>
        </header>
        <div className="p-4 text-sm text-muted-foreground">
          {prepNotes ? (
            <pre className="whitespace-pre-wrap font-sans">{prepNotes}</pre>
          ) : (
            "Type during the meeting and the agent will fold these into the final summary."
          )}
        </div>
      </section>
    </div>
  );
}
