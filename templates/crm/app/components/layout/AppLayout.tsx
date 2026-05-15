import { AgentSidebar } from "@agent-native/core/client";
import { Link, useLocation } from "react-router";
import {
  IconAddressBook,
  IconChartBar,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <AgentSidebar
        position="right"
        defaultOpen
        emptyStateText="Ask me about contacts, deals, or activities"
        suggestions={[
          "Create a contact for Carol at Acme",
          "Move the Acme deal to qualified",
          "Email Carol about next steps",
          "Schedule a 30-min sync with Carol next Tuesday",
        ]}
      >
        <div className="flex h-full w-full">
          <NavRail />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </AgentSidebar>
    </div>
  );
}

function NavRail() {
  const location = useLocation();
  const items = [
    { to: "/", label: "Dashboard", icon: IconLayoutDashboard },
    { to: "/contacts", label: "Contacts", icon: IconAddressBook },
    { to: "/deals", label: "Deals", icon: IconChartBar },
  ];
  return (
    <nav className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-muted/30 p-3">
      <div className="px-2 pb-4 pt-1 text-sm font-semibold tracking-tight">
        CRM
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
