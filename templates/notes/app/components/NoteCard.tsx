import { Link } from "react-router";
import { IconPin, IconNote } from "@tabler/icons-react";
import type { NoteListEntry } from "@/hooks/use-notes";

interface NoteCardProps {
  note: NoteListEntry;
  active?: boolean;
}

export function NoteCard({ note, active = false }: NoteCardProps) {
  const updated = new Date(note.updatedAt);
  const dateLabel = isNaN(updated.getTime())
    ? ""
    : updated.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

  return (
    <Link
      to={`/${note.id}`}
      className={`block border-b border-border px-4 py-3 transition-colors hover:bg-accent ${
        active ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium">
              {note.title || "Untitled"}
            </h3>
            {note.pinned ? (
              <IconPin size={14} className="shrink-0 text-primary" />
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {note.snippet || <span className="italic">Empty note</span>}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{dateLabel}</span>
            {note.sourceApp ? (
              <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">
                <IconNote size={10} />
                {note.sourceApp}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
