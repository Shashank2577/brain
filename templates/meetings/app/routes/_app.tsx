import { Outlet, Link, useLocation } from "react-router";
import { IconUsersGroup } from "@tabler/icons-react";

export default function AppLayout() {
  const location = useLocation();
  const onList = location.pathname === "/" || location.pathname === "";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <IconUsersGroup size={20} className="text-primary" />
            <span>Meetings</span>
          </Link>
          {!onList && (
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to meetings
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
