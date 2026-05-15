import { useState } from "react";
import { IconCheckbox } from "@tabler/icons-react";
import { TaskCreateBar } from "@/components/TaskCreateBar";
import { TaskList, type Filter } from "@/components/TaskList";
import { cn } from "@/lib/utils";

export function meta() {
  return [
    { title: "Agent-Native Tasks" },
    {
      name: "description",
      content:
        "A lightweight todo app the agent can fill, complete, and link to notes.",
    },
  ];
}

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

export default function IndexPage() {
  const [filter, setFilter] = useState<Filter>("active");

  return (
    <div className="mx-auto flex h-screen w-full max-w-2xl flex-col overflow-y-auto px-6 py-10">
      <header className="mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconCheckbox className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Tasks</h1>
          <p className="text-xs text-muted-foreground">
            Capture, complete, link to notes.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <TaskCreateBar />

        <div
          role="tablist"
          aria-label="Filter tasks"
          className="flex items-center gap-1 border-b border-border"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "relative cursor-pointer px-3 py-2 text-xs font-medium transition-colors",
                filter === f.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              {filter === f.id && (
                <span className="absolute inset-x-0 -bottom-px h-px bg-foreground" />
              )}
            </button>
          ))}
        </div>

        <TaskList filter={filter} />
      </div>
    </div>
  );
}
