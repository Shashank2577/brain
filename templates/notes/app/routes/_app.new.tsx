import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useCreateNote } from "@/hooks/use-notes";

// Creates a fresh draft note and navigates directly into its editor. The
// create-note action returns the persisted record; we navigate as soon as
// it succeeds so the user lands on /<id> and the editor binds to the new row.
export default function NewNoteRoute() {
  const navigate = useNavigate();
  const createNote = useCreateNote();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    createNote.mutate(
      { title: "Untitled", body: "" },
      {
        onSuccess: (note) => {
          navigate(`/${note.id}`, { replace: true });
        },
        onError: () => {
          navigate("/", { replace: true });
        },
      },
    );
  }, [createNote, navigate]);

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      Creating note…
    </div>
  );
}
