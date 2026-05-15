import { useParams } from "react-router";
import { NoteEditor } from "@/components/NoteEditor";

export function meta() {
  return [{ title: "Note" }];
}

export default function NoteDetailRoute() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Missing note id.
      </div>
    );
  }
  return <NoteEditor noteId={id} />;
}
