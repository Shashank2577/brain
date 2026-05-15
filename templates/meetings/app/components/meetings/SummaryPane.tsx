interface Summary {
  kind: "summary" | "bullets" | "action_items";
  content: string;
  generatedAt: string;
}

export function SummaryPane({ summaries }: { summaries: Summary[] }) {
  const summary = summaries.find((s) => s.kind === "summary");
  const bullets = summaries.find((s) => s.kind === "bullets");
  let bulletList: string[] = [];
  if (bullets) {
    try {
      bulletList = JSON.parse(bullets.content);
    } catch {
      bulletList = [];
    }
  }
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-semibold">Summary</h3>
      </header>
      <div className="space-y-4 p-4 text-sm">
        {summary ? (
          <div className="whitespace-pre-wrap leading-relaxed text-foreground">
            {summary.content}
          </div>
        ) : (
          <div className="text-muted-foreground">No summary yet.</div>
        )}
        {bulletList.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Highlights
            </h4>
            <ul className="list-disc space-y-1 pl-5 text-foreground">
              {bulletList.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
