import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AgentSidebar, agentNativePath } from "@agent-native/core/client";
import { SuperAppRail, type RegistryApp } from "@/components/SuperAppRail";
import { ShellContentHost } from "@/components/ShellContentHost";

/**
 * Phase 2 — Super-App Shell route.
 *
 * Three-column layout for the dispatch shell:
 *
 *   [SuperAppRail]   [ShellContentHost (iframe)]   [AgentSidebar]
 *      ~64px               flex 1                       ~360px
 *
 * URL contract: `?app=<id>&path=<encoded-iframe-path>`. The shell parses on
 * mount, drives the iframe `src` from those values, and reflects child
 * navigation back into the URL via a debounced `useNavigate` call.
 *
 * Mounted at `/shell` (file `app/routes/_shell.tsx` re-exports this). The root
 * landing route (`/_index.tsx`) redirects `/` here when at least one mini-app
 * is installed.
 */

const SIDEBAR_SUGGESTIONS = [
  "Open the calendar and find next week's free slots",
  "Show me my last 5 decks",
  "What's in my inbox today?",
];

export function meta() {
  return [{ title: "Dispatch — Workspace" }];
}

interface RegistryAppsResponse {
  apps: RegistryApp[];
}

async function fetchRegistryApps(): Promise<RegistryApp[]> {
  const res = await fetch(agentNativePath("/_agent-native/registry/apps"), {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Registry apps fetch failed (${res.status})`);
  }
  const body = (await res.json()) as RegistryAppsResponse;
  return body.apps ?? [];
}

export default function ShellRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apps, setApps] = useState<RegistryApp[] | null>(null);
  const [appsError, setAppsError] = useState<string | null>(null);

  // The registry list seeds the rail and lets us default to the first app
  // when the URL doesn't pin one. We use a plain fetch (instead of React
  // Query) here because the route component owns the URL contract and we
  // want a single source-of-truth for "what apps are available" without a
  // hook order dependency.
  useEffect(() => {
    let cancelled = false;
    fetchRegistryApps()
      .then((list) => {
        if (cancelled) return;
        setApps(list);
        setAppsError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setApps([]);
        setAppsError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeAppId = useMemo(() => {
    const fromUrl = searchParams.get("app");
    if (fromUrl) return fromUrl;
    if (apps && apps.length > 0) return apps[0]!.id;
    return null;
  }, [searchParams, apps]);

  const appPath = useMemo(() => {
    const raw = searchParams.get("path");
    if (!raw) return "/";
    try {
      return decodeURIComponent(raw);
    } catch {
      return "/";
    }
  }, [searchParams]);

  const writeShellUrl = useCallback(
    (nextAppId: string, nextPath: string) => {
      const params = new URLSearchParams();
      params.set("app", nextAppId);
      if (nextPath && nextPath !== "/") {
        params.set("path", nextPath);
      }
      // `replace: true` keeps switching apps from polluting browser history.
      navigate(`/shell?${params.toString()}`, { replace: true });
    },
    [navigate],
  );

  const handleSelect = useCallback(
    (appId: string) => {
      // When the user clicks an app the rail, reset path to root for that
      // app (we can't predict what deep link is sensible). The iframe will
      // load its own default landing.
      writeShellUrl(appId, "/");
    },
    [writeShellUrl],
  );

  // Debounce child URL changes — a single React Router navigate per click is
  // fine, but some templates fire several `notifyShellOfNavigation` calls in
  // quick succession during boot.
  const pendingRef = useRef<{ appId: string; path: string } | null>(null);
  const debounceRef = useRef<number | null>(null);
  const handleChildUrlChange = useCallback(
    (appId: string, path: string) => {
      // Only reflect URL changes from the currently-active iframe. Backgrounded
      // iframes might post on their own (HMR, etc.) and shouldn't move the URL.
      if (appId !== activeAppId) return;
      pendingRef.current = { appId, path };
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        const next = pendingRef.current;
        pendingRef.current = null;
        debounceRef.current = null;
        if (!next) return;
        writeShellUrl(next.appId, next.path);
      }, 80);
    },
    [activeAppId, writeShellUrl],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <SuperAppRail
        activeAppId={activeAppId}
        onSelect={handleSelect}
        apps={apps ?? undefined}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AgentSidebar
          position="right"
          defaultOpen={false}
          emptyStateText="Switch between apps with ⌘1..⌘9 or click the rail. Ask me anything."
          suggestions={SIDEBAR_SUGGESTIONS}
        >
          {appsError && apps && apps.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center p-8 text-sm text-muted-foreground">
              Could not load registry apps: {appsError}
            </div>
          ) : !activeAppId ? (
            <div className="flex h-full w-full items-center justify-center p-8 text-sm text-muted-foreground">
              {apps === null ? "Loading apps…" : "No apps installed yet."}
            </div>
          ) : (
            <ShellContentHost
              activeAppId={activeAppId}
              appPath={appPath}
              onChildUrlChange={handleChildUrlChange}
            />
          )}
        </AgentSidebar>
      </div>
    </div>
  );
}
