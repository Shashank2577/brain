import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { IconArrowLeft, IconLink } from "@tabler/icons-react";
import { useActionQuery, useActionMutation } from "@agent-native/core/client";
import type { Task } from "@/components/TaskRow";
import { cn } from "@/lib/utils";

/**
 * Detail / edit view for a single task. The list view writes
 * `navigation.selectedTaskId` here so the agent knows which task the user is
 * editing.
 */
export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [draftText, setDraftText] = useState<string>("");

  // We pull from the list view's cache rather than introducing a get-task
  // action: the list returns rows with full data and the cache is already
  // warm.
  const { data: rows } = useActionQuery<Task[]>(
    "list" as any,
    {
      filter: "all",
      limit: 500,
    } as any,
  );
  const task = (rows ?? []).find((r) => r.id === id);
  const update = useActionMutation("update" as any, { method: "PUT" });

  useEffect(() => {
    if (task) setDraftText(task.text);
  }, [task?.id, task?.text]);

  if (!task) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="h-3.5 w-3.5" /> All tasks
        </button>
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  function saveText() {
    if (!task) return;
    const trimmed = draftText.trim();
    if (trimmed && trimmed !== task.text) {
      update.mutate({ id: task.id, text: trimmed } as any);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <IconArrowLeft className="h-3.5 w-3.5" /> All tasks
      </button>

      <div className="mt-6 space-y-4">
        <input
          type="text"
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          onBlur={saveText}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className={cn(
            "w-full border-0 bg-transparent text-2xl font-semibold tracking-tight outline-none",
            task.completed && "line-through text-muted-foreground",
          )}
        />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="mt-1 font-medium">
              {task.completed ? "Completed" : "Active"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Priority</p>
            <p className="mt-1 font-medium capitalize">
              {task.priority ?? "normal"}
            </p>
          </div>
          {task.dueDate && (
            <div>
              <p className="text-xs text-muted-foreground">Due</p>
              <p className="mt-1 font-medium">
                {new Date(task.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
          {task.linkedNoteId && (
            <div>
              <p className="text-xs text-muted-foreground">Linked note</p>
              <a
                href={`/notes/${task.linkedNoteId}`}
                className="mt-1 flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <IconLink className="h-3.5 w-3.5" /> Open note
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
