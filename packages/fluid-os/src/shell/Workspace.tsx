import { useEffect, useMemo, useState } from "react";
import {
  IconLayoutGrid,
  IconLogout,
  IconMessageCircle,
  IconArrowsRightLeft,
} from "@tabler/icons-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { CapabilityCard } from "./CapabilityCard";
import { fetchApps, fetchCapabilities } from "./api";
import type { AppSummary, CapabilityEntry, FluidUser } from "./types";
import { cn } from "./lib/cn";

interface Props {
  user: FluidUser;
}

export function Workspace({ user }: Props) {
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [capabilities, setCapabilities] = useState<CapabilityEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchApps(), fetchCapabilities()])
      .then(([a, c]) => {
        setApps(a);
        setCapabilities(c);
        if (a.length > 0) setActiveId(a[0].id);
      })
      .catch((err) => console.error(err));
  }, []);

  const capsByApp = useMemo(() => {
    const map = new Map<string, CapabilityEntry[]>();
    for (const c of capabilities) {
      if (!map.has(c.appId)) map.set(c.appId, []);
      map.get(c.appId)!.push(c);
    }
    return map;
  }, [capabilities]);

  const active = apps.find((a) => a.id === activeId) ?? null;
  const activeCaps = active ? capsByApp.get(active.id) ?? [] : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <div className="flex-1 grid grid-cols-[280px_1fr] min-h-0">
        <Sidebar apps={apps} capsByApp={capsByApp} activeId={activeId} onSelect={setActiveId} />
        <main className="overflow-y-auto px-8 py-7">
          {active ? <AppDetail app={active} capabilities={activeCaps} /> : <EmptyState />}
        </main>
      </div>
    </div>
  );
}

function Header({ user }: { user: FluidUser }) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-sidebar">
      <div className="flex items-center gap-2 font-semibold tracking-wide">
        <IconLayoutGrid size={18} className="text-muted-foreground" />
        Fluid OS
      </div>
      <div className="flex items-center gap-3 text-sm">
        {user.avatarUrl && (
          <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full border border-border" />
        )}
        <div className="flex flex-col items-end leading-tight">
          <div className="font-medium">{user.name ?? user.email}</div>
          <div className="text-[11px] text-muted-foreground">
            {user.email}
            {user.github ? `  ·  github: ${user.github.login}` : ""}
          </div>
        </div>
        <Button asChild variant="ghost" size="sm">
          <a href="/_fluid-os/auth/logout" className="inline-flex items-center gap-1">
            <IconLogout size={14} />
            Sign out
          </a>
        </Button>
      </div>
    </header>
  );
}

interface SidebarProps {
  apps: AppSummary[];
  capsByApp: Map<string, CapabilityEntry[]>;
  activeId: string | null;
  onSelect: (id: string) => void;
}

function Sidebar({ apps, capsByApp, activeId, onSelect }: SidebarProps) {
  return (
    <aside className="border-r border-sidebar-border bg-sidebar overflow-y-auto p-3">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">
        Apps
      </div>
      <ul className="flex flex-col gap-0.5">
        {apps.map((app) => {
          const count = (capsByApp.get(app.id) ?? []).length;
          const active = app.id === activeId;
          return (
            <li key={app.id}>
              <button
                onClick={() => onSelect(app.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md flex items-center justify-between gap-2 transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-accent/50 hover:text-accent-foreground",
                )}
              >
                <div className="flex flex-col min-w-0">
                  <div className="text-sm font-medium truncate">{app.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{app.description}</div>
                </div>
                <Badge>{count}</Badge>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="text-sm text-muted-foreground">
      Pick an app from the sidebar to see its capabilities and invoke them.
    </div>
  );
}

function AppDetail({ app, capabilities }: { app: AppSummary; capabilities: CapabilityEntry[] }) {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold">{app.name}</h1>
          <span className="text-[11px] font-mono text-muted-foreground">
            {app.id} · {app.url}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{app.description}</p>
        {app.routes && app.routes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Routes:</span>
            {app.routes.map((r) => (
              <code key={r.path} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">
                {r.path}
              </code>
            ))}
          </div>
        )}
      </div>

      {app.consumes && app.consumes.length > 0 && (
        <section>
          <SectionTitle icon={<IconArrowsRightLeft size={12} />}>Consumes from other apps</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {app.consumes.map((c) => (
              <code key={c} className="rounded bg-secondary px-2 py-1 font-mono text-[11px]">
                {c}
              </code>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle icon={<IconMessageCircle size={12} />}>Capabilities</SectionTitle>
        <div className="flex flex-col gap-2">
          {capabilities.map((c) => (
            <CapabilityCard key={c.id} capability={c} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {icon}
      {children}
    </div>
  );
}
