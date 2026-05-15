import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import { IconPlus, IconNotebook } from "@tabler/icons-react";
import { useNotes } from "@/hooks/use-notes";

export function meta() {
  return [
    { title: "Notes" },
    {
      name: "description",
      content: "Capture, search, and share quick text snippets with the agent.",
    },
  ];
}

// Default landing pane — surfaces the most-recent note when one exists so the
// user lands directly in the editor; otherwise shows the empty state CTA.
export default function NotesIndex() {
  const navigate = useNavigate();
  const { data } = useNotes();
  const notes = data?.notes ?? [];

  useEffect(() => {
    if (notes.length > 0) {
      const target = notes.find((n) => n.pinned) ?? notes[0];
      navigate(`/${target.id}`, { replace: true });
    }
  }, [notes, navigate]);

  if (notes.length > 0) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <IconNotebook size={48} className="text-muted-foreground" />
      <div>
        <h1 className="text-xl font-semibold">No notes yet</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Capture a thought, paste a meeting jot, or ask the agent to write
          one for you.
        </p>
      </div>
      <Link
        to="/new"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <IconPlus size={16} />
        New note
      </Link>
    </div>
  );
}
