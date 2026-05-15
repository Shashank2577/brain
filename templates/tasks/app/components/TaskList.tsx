import { useActionQuery } from "@agent-native/core/client";
import { IconChecks } from "@tabler/icons-react";
import { TaskRow, type Task } from "./TaskRow";

export type Filter = "active" | "completed" | "all";

/**
 * Renders the list of rows for the active filter. The query key includes
 * `filter` so React Query refetches when the user changes tabs.
 */
export function TaskList({ filter }: { filter: Filter }) {
  const { data, isLoading } = useActionQuery<Task[]>(
    "list" as any,
    {
      filter,
      limit: 200,
    } as any,
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded-md bg-muted/40"
            aria-hidden
          />
        ))}
      </div>
    );
  }

  const rows = (data ?? []) as Task[];
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <IconChecks className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">
          {filter === "completed"
            ? "Nothing completed yet"
            : filter === "all"
              ? "No tasks yet"
              : "Inbox zero"}
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Add a task above, or ask the agent to capture one for you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rows.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </div>
  );
}
