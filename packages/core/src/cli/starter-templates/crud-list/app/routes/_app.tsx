import { Outlet } from "react-router";
import { ItemList } from "@/components/ItemList";

export function meta() {
  return [{ title: "<Name>" }];
}

export default function AppLayoutRoute() {
  return (
    <div className="flex h-screen overflow-hidden">
      <ItemList />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
