import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconLink, IconLinkOff } from "@tabler/icons-react";
import { useActionMutation } from "@agent-native/core/client";
import { cn } from "@/lib/utils";

/**
 * Single-line input that creates a task on Enter. The link-2 icon toggle
 * flips `alsoNote` so the next task also creates a notes row owned by the
 * caller (the actual `notes.create-note` dispatch happens server-side in the
 * `create` action via the Phase 1 capability registry).
 */
export function TaskCreateBar() {
  const [text, setText] = useState("");
  const [alsoNote, setAlsoNote] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const qc = useQueryClient();
  const create = useActionMutation("create" as any, {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action", "list"] });
      setText("");
    },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    create.mutate({ text: trimmed, alsoNote } as any);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
      <IconPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Add a task and press Enter"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={() => setAlsoNote((v) => !v)}
        aria-label="Also create a note"
        title={alsoNote ? "Will also create a linked note" : "Just a task"}
        className={cn(
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors",
          alsoNote
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent",
        )}
      >
        {alsoNote ? (
          <IconLink className="h-4 w-4" />
        ) : (
          <IconLinkOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
