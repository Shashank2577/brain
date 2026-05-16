import { useEffect, useMemo, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconAddressBook,
  IconApps,
  IconBrandJira,
  IconBrush,
  IconCalendarMonth,
  IconCalendarTime,
  IconChartBar,
  IconCheckbox,
  IconClipboardList,
  IconCode,
  IconFileText,
  IconLayoutDashboard,
  IconMail,
  IconMessageCircle,
  IconMicrophone,
  IconNote,
  IconPhone,
  IconPhoto,
  IconPresentation,
  IconScreenShare,
  IconSparkles,
  IconUsers,
  IconUsersGroup,
  IconVideo,
} from "@tabler/icons-react";
import { agentNativePath } from "@agent-native/core/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Phase 2 — Super-App Rail
 *
 * Vertical icon strip on the far-left of the dispatch shell. Lists every
 * installed mini-app fetched from `/_agent-native/registry/apps` (registered
 * in Phase 1 by `capability-registry.ts`). Clicking an icon switches the
 * iframe content host (managed by ShellContentHost) to that mini-app.
 *
 * Keyboard shortcuts: `Cmd+1` .. `Cmd+9` activate rail positions 1..9.
 *
 * Tooltip + active state per spec. We don't depend on registry runtime types
 * here because they live behind `@agent-native/dispatch/server` (a server-only
 * subpath); we re-declare the slim shape we actually use.
 */

export interface RegistryApp {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  url?: string | null;
  capabilities?: number;
}

interface RegistryAppsResponse {
  apps: RegistryApp[];
}

export interface SuperAppRailProps {
  activeAppId: string | null;
  onSelect: (appId: string) => void;
  /**
   * When set, overrides the registry fetch. Used by tests and storybook to
   * avoid spinning up a backend.
   */
  apps?: RegistryApp[];
  className?: string;
}

type RailIcon = ComponentType<{
  size?: number | string;
  className?: string;
}>;

const ICON_BY_NAME: Record<string, RailIcon> = {
  // Direct keys from `shared-app-config/templates.ts` + the mirrored
  // `@agent-native/core/cli/templates-meta` registry's `icon` field. Keep
  // both sources in sync — when a new template adds a Tabler icon name, also
  // add it here so the rail renders it instead of falling back to the
  // collision-prone deterministic pool.
  AddressBook: IconAddressBook,
  Apps: IconApps,
  BarChart2: IconChartBar,
  BrandJira: IconBrandJira,
  Brush: IconBrush,
  CalendarDays: IconCalendarMonth,
  CalendarMonth: IconCalendarMonth,
  CalendarTime: IconCalendarTime,
  ChartBar: IconChartBar,
  Checkbox: IconCheckbox,
  ClipboardList: IconClipboardList,
  Code: IconCode,
  FileText: IconFileText,
  GalleryHorizontal: IconPresentation,
  LayoutDashboard: IconLayoutDashboard,
  Mail: IconMail,
  MessageCircle: IconMessageCircle,
  Microphone: IconMicrophone,
  Note: IconNote,
  Phone: IconPhone,
  Photo: IconPhoto,
  Presentation: IconPresentation,
  ScreenShare: IconScreenShare,
  Sparkles: IconSparkles,
  Users: IconUsers,
  UsersGroup: IconUsersGroup,
  Video: IconVideo,
};

function iconFor(app: RegistryApp) {
  const fromHint = app.icon ? ICON_BY_NAME[app.icon] : null;
  if (fromHint) return fromHint;
  // Fall back to a deterministic per-app fallback keyed on the app id so
  // unknown manifests still get a distinct icon.
  const stable = (app.id || "").charCodeAt(0) || 0;
  const pool = [
    IconApps,
    IconLayoutDashboard,
    IconFileText,
    IconBrush,
    IconChartBar,
    IconPresentation,
    IconMail,
    IconCalendarMonth,
    IconScreenShare,
    IconVideo,
  ];
  return pool[stable % pool.length] ?? IconApps;
}

async function fetchRegistryApps(): Promise<RegistryAppsResponse> {
  const res = await fetch(agentNativePath("/_agent-native/registry/apps"), {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Registry apps fetch failed (${res.status})`);
  }
  return res.json() as Promise<RegistryAppsResponse>;
}

export function SuperAppRail({
  activeAppId,
  onSelect,
  apps,
  className,
}: SuperAppRailProps) {
  const query = useQuery<RegistryAppsResponse>({
    queryKey: ["super-app-rail", "registry-apps"],
    queryFn: fetchRegistryApps,
    // Static-ish list — refetch occasionally so newly installed apps show up,
    // but don't hammer the registry.
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !apps,
  });

  const resolvedApps = useMemo(() => {
    if (apps) return apps;
    return query.data?.apps ?? [];
  }, [apps, query.data?.apps]);

  // Cmd+1 .. Cmd+9 — switch to rail position N. We bind on the document so
  // the shortcut works regardless of focus (matching VS Code / Slack super-app
  // muscle memory).
  useEffect(() => {
    if (resolvedApps.length === 0) return;
    function handler(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.shiftKey || event.altKey) return;
      const idx = "123456789".indexOf(event.key);
      if (idx === -1) return;
      const app = resolvedApps[idx];
      if (!app) return;
      event.preventDefault();
      onSelect(app.id);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [resolvedApps, onSelect]);

  return (
    <nav
      aria-label="Super-app switcher"
      className={cn(
        "flex h-full w-16 shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-3",
        className,
      )}
      data-testid="super-app-rail"
    >
      {resolvedApps.map((app, index) => {
        const Icon = iconFor(app);
        const isActive = app.id === activeAppId;
        const shortcut = index < 9 ? `${index + 1}` : null;
        return (
          <Tooltip key={app.id} delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelect(app.id)}
                data-app-id={app.id}
                data-active={isActive ? "true" : "false"}
                aria-current={isActive ? "page" : undefined}
                aria-label={app.name}
                className={cn(
                  "relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon size={20} />
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute -left-px top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                  />
                ) : null}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={6}>
              <div className="text-xs font-medium">{app.name}</div>
              {shortcut ? (
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  ⌘{shortcut}
                </div>
              ) : null}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
