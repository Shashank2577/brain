import { useState } from "react";
import { useNavigate } from "react-router";
import {
  IconCheck,
  IconCircle,
  IconLink,
  IconDots,
  IconPencil,
  IconTrash,
  IconExternalLink,
} from "@tabler/icons-react";
import { useActionMutation } from "@agent-native/core/client";
import { cn } from "@/lib/utils";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  completedAt: string | null;
  linkedNoteId: string | null;
  dueDate: string | null;
  priority: "low" | "normal" | "high" | "urgent" | null;
}

const PRIORITY_DOT: Record<NonNullable<Task["priority"]>, string> = {
  low: "bg-muted-foreground/40",
  normal: "bg-sky-500/70",
  high: "bg-amber-500/80",
  urgent: "bg-red-500/90",
};

function formatDueDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function TaskRow({ task }: { task: Task }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const complete = useActionMutation("complete" as any);
  const uncomplete = useActionMutation("uncomplete" as any);
  const del = useActionMutation("delete" as any, { method: "DELETE" });

  const toggle = () => {
    if (task.completed) {
      uncomplete.mutate({ id: task.id } as any);
    } else {
      complete.mutate({ id: task.id } as any);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-md border border-transparent px-3 py-2 transition-colors hover:bg-accent/40",
        task.completed && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={task.completed ? "Mark active" : "Mark complete"}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
          task.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input hover:border-primary",
        )}
      >
        {task.completed ? (
          <IconCheck className="h-3.5 w-3.5" />
        ) : (
          <IconCircle className="h-3 w-3 opacity-0" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-sm",
              task.completed && "line-through text-muted-foreground",
            )}
          >
            {task.text}
          </p>
          {task.priority && (
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                PRIORITY_DOT[task.priority],
              )}
              aria-label={`Priority: ${task.priority}`}
              title={`Priority: ${task.priority}`}
            />
          )}
          {task.linkedNoteId && (
            <IconLink
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              aria-label="Linked note"
            />
          )}
        </div>
        {task.dueDate && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Due {formatDueDate(task.dueDate)}
          </p>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="More"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 focus:opacity-100"
        >
          <IconDots className="h-4 w-4" />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-md border border-border bg-popover py-1 text-sm text-popover-foreground shadow-md">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/${task.id}`);
                }}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left hover:bg-accent"
              >
                <IconPencil className="h-3.5 w-3.5" /> Edit
              </button>
              {task.linkedNoteId && (
                <a
                  href={`/notes/${task.linkedNoteId}`}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  <IconExternalLink className="h-3.5 w-3.5" /> Open linked note
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (confirm("Delete this task?")) {
                    del.mutate({ id: task.id } as any);
                  }
                }}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-destructive hover:bg-accent"
              >
                <IconTrash className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
