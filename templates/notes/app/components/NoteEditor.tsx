import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { IconTrash, IconPin, IconPinned } from "@tabler/icons-react";
import {
  useNote,
  useUpdateNote,
  useDeleteNote,
  type NoteDetail,
} from "@/hooks/use-notes";

interface NoteEditorProps {
  noteId: string;
}

// Debounced inline editor. Saves are optimistic — the title and body are
// updated locally on every keystroke and pushed to the server after a 500ms
// quiet period.
export function NoteEditor({ noteId }: NoteEditorProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useNote(noteId);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const lastSyncedRef = useRef<{ title: string; body: string; pinned: boolean } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setBody(data.body);
    setPinned(data.pinned);
    lastSyncedRef.current = {
      title: data.title,
      body: data.body,
      pinned: data.pinned,
    };
  }, [data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data) return;
    const last = lastSyncedRef.current;
    if (!last) return;
    if (last.title === title && last.body === body && last.pinned === pinned) {
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateNote.mutate(
        { id: noteId, title: title || "Untitled", body, pinned },
        {
          onSuccess: (updated: NoteDetail) => {
            lastSyncedRef.current = {
              title: updated.title,
              body: updated.body,
              pinned: updated.pinned,
            };
          },
        },
      );
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, body, pinned, noteId, data, updateNote]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading note…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Note not found.
      </div>
    );
  }

  return (
    <section className="flex h-full flex-1 flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <input
          aria-label="Note title"
          className="flex-1 bg-transparent text-xl font-semibold focus:outline-none"
          placeholder="Untitled"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={pinned ? "Unpin note" : "Pin note"}
            onClick={() => setPinned((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          >
            {pinned ? (
              <IconPinned size={16} className="text-primary" />
            ) : (
              <IconPin size={16} className="text-muted-foreground" />
            )}
          </button>
          {data.canManage ? (
            <button
              type="button"
              aria-label="Delete note"
              onClick={() => {
                deleteNote.mutate(
                  { id: noteId },
                  {
                    onSuccess: () => navigate("/", { replace: true }),
                  },
                );
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <IconTrash size={16} />
            </button>
          ) : null}
        </div>
      </header>

      <textarea
        aria-label="Note body"
        className="flex-1 resize-none bg-transparent px-6 py-4 font-mono text-sm leading-relaxed focus:outline-none"
        placeholder="Start writing…"
        value={body}
        readOnly={!data.canEdit}
        onChange={(e) => setBody(e.target.value)}
      />

      <footer className="border-t border-border px-6 py-2 text-xs text-muted-foreground">
        {data.sourceApp ? (
          <span>
            Linked from{" "}
            <span className="font-medium text-foreground">{data.sourceApp}</span>
            {data.sourceType ? ` · ${data.sourceType}` : ""}
          </span>
        ) : (
          <span>
            Updated {new Date(data.updatedAt).toLocaleString()} ·{" "}
            {data.accessRole}
          </span>
        )}
      </footer>
    </section>
  );
}
