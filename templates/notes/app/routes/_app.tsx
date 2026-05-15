import { Outlet } from "react-router";
import { NoteList } from "@/components/NoteList";

export function meta() {
  return [{ title: "Notes" }];
}

// Pathless layout — the left rail (NoteList) persists across navigations so
// React Router does not unmount it when the user opens a different note.
export default function AppLayoutRoute() {
  return (
    <div className="flex h-screen overflow-hidden">
      <NoteList />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
