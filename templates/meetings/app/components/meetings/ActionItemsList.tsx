import { IconChecks, IconUser } from "@tabler/icons-react";

interface Followup {
  id: string;
  text: string;
  assigneeEmail: string | null;
  dueDate: string | null;
  taskId: string | null;
}

export function ActionItemsList({ followups }: { followups: Followup[] }) {
  if (followups.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        No action items extracted.
      </section>
    );
  }
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <h3 className="text-sm font-semibold">Action items</h3>
        <span className="text-xs text-muted-foreground">
          {followups.length} item{followups.length === 1 ? "" : "s"}
        </span>
      </header>
      <ul className="divide-y divide-border">
        {followups.map((f) => (
          <li
            key={f.id}
            className="flex items-start gap-3 px-4 py-3 text-sm"
          >
            <input
              type="checkbox"
              defaultChecked={false}
              className="mt-1 h-4 w-4 rounded border-border accent-primary"
              aria-label={`Complete: ${f.text}`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-foreground">{f.text}</div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                {f.assigneeEmail && (
                  <span className="inline-flex items-center gap-1">
                    <IconUser size={12} />
                    {f.assigneeEmail}
                  </span>
                )}
                {f.dueDate && <span>Due {f.dueDate}</span>}
                {f.taskId && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <IconChecks size={12} />
                    Linked task
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
