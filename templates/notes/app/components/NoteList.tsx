import { Link, useParams } from "react-router";
import { IconPlus } from "@tabler/icons-react";
import { useNotes } from "@/hooks/use-notes";
import { NoteCard } from "./NoteCard";

export function NoteList() {
  const { id: activeId } = useParams<{ id?: string }>();
  const { data, isLoading } = useNotes();
  const notes = data?.notes ?? [];

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Notes
        </h2>
        <Link
          to="/new"
          aria-label="New note"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90"
        >
          <IconPlus size={14} />
        </Link>
      </header>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            Loading notes…
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No notes yet.</p>
            <Link
              to="/new"
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <IconPlus size={14} />
              New note
            </Link>
          </div>
        ) : (
          notes.map((note) => (
            <NoteCard key={note.id} note={note} active={note.id === activeId} />
          ))
        )}
      </div>
    </aside>
  );
}
