import { useEffect, useMemo, useRef } from "react";
import {
  DISPATCH_SHELL_SENTINEL_PARAM,
  DISPATCH_SHELL_SENTINEL_VALUE,
} from "@agent-native/core/client";
import { cn } from "@/lib/utils";

/**
 * Phase 2 — Shell Content Host (iframe manager)
 *
 * Renders the active mini-app inside a same-origin iframe. The iframe `src`
 * maps to the mini-app's existing standalone URL (`/calendar`, `/slides`,
 * etc.) under the workspace gateway, so the framework's session cookie travels
 * through without any cross-origin gymnastics. See ADR-002.
 *
 * Three things this component does:
 *
 *  1. **Switch the active app** by computing the iframe `src` from
 *     `activeAppId` + `appPath`. Per the pivot trigger in the phase doc, we
 *     keep iframes for the 3 most-recently-used apps mounted (display:none) so
 *     switching back to a recent app doesn't re-boot.
 *
 *  2. **Listen for url-change postMessages** from the child mini-app so the
 *     dispatch shell can reflect the iframe's internal navigation in the
 *     browser URL bar (deep-linking + back-button support).
 *
 *  3. **Tag the iframe src** with a sentinel query param so the child's
 *     `isInsideDispatchShell()` reliably returns true without a postMessage
 *     handshake. The child can strip the param via `history.replaceState`
 *     once it's done its detection (handled by `markEmbeddedInsideDispatchShell`).
 */

export interface ShellContentHostProps {
  activeAppId: string | null;
  appPath: string;
  /**
   * Called when the child mini-app posts a `{ kind: "url-change", path }`
   * message. Parent reflects this in the browser URL.
   */
  onChildUrlChange?: (appId: string, path: string) => void;
  /**
   * Maximum number of iframes to keep mounted (warm) at once. Once the LRU
   * exceeds this the oldest is unmounted. Defaults to 3.
   */
  maxWarmApps?: number;
  className?: string;
}

interface WarmEntry {
  appId: string;
  /** Last time this entry was activated (Date.now()). */
  lastActiveAt: number;
}

const DEFAULT_WARM_LIMIT = 3;

/**
 * Build the same-origin iframe src for a given mini-app. The dispatch shell
 * is hosted on the workspace gateway, so `/<appId>` already routes to the
 * mini-app's UI. We append the sentinel param so the child can detect it's
 * embedded.
 */
export function buildIframeSrc(appId: string, appPath: string): string {
  const cleanPath = appPath.startsWith("/") ? appPath : `/${appPath || ""}`;
  const search = new URLSearchParams();
  search.set(DISPATCH_SHELL_SENTINEL_PARAM, DISPATCH_SHELL_SENTINEL_VALUE);
  const qs = search.toString();
  // Base path is `/<appId>` (workspace gateway convention). The mini-app's
  // own router will resolve `cleanPath` after that.
  return `/${appId}${cleanPath === "/" ? "" : cleanPath}${qs ? `?${qs}` : ""}`;
}

export function ShellContentHost({
  activeAppId,
  appPath,
  onChildUrlChange,
  maxWarmApps = DEFAULT_WARM_LIMIT,
  className,
}: ShellContentHostProps) {
  // Track which apps currently have a live iframe + when each was last
  // activated, so we can unmount the LRU when the limit is hit.
  const warmRef = useRef<Map<string, WarmEntry>>(new Map());
  // Force a re-render when warmRef changes — we drive the rendered list from
  // a derived snapshot.
  const renderedApps = useMemo(() => {
    if (!activeAppId) return [] as string[];
    const map = warmRef.current;
    // Promote/refresh the active app.
    map.set(activeAppId, { appId: activeAppId, lastActiveAt: Date.now() });
    // Evict LRU until we're within the warm-limit.
    if (map.size > maxWarmApps) {
      const sorted = [...map.values()].sort(
        (a, b) => a.lastActiveAt - b.lastActiveAt,
      );
      while (map.size > maxWarmApps) {
        const oldest = sorted.shift();
        if (!oldest) break;
        map.delete(oldest.appId);
      }
    }
    return [...map.keys()];
  }, [activeAppId, maxWarmApps]);

  // postMessage bridge: listen for child → parent URL changes.
  useEffect(() => {
    if (!onChildUrlChange) return;
    function handler(event: MessageEvent) {
      // Same-origin only.
      if (event.origin !== window.location.origin) return;
      const data = event.data as
        | { kind?: string; path?: string }
        | null
        | undefined;
      if (!data || data.kind !== "url-change" || typeof data.path !== "string") {
        return;
      }
      // Figure out which iframe the message came from by comparing
      // event.source against our rendered iframes.
      const sourceWin = event.source as Window | null;
      if (!sourceWin) return;
      const iframes = document.querySelectorAll<HTMLIFrameElement>(
        '[data-shell-iframe="true"]',
      );
      let originatingAppId: string | null = null;
      iframes.forEach((iframe) => {
        if (iframe.contentWindow === sourceWin) {
          originatingAppId = iframe.dataset.appId ?? null;
        }
      });
      if (!originatingAppId) return;
      onChildUrlChange(originatingAppId, data.path);
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onChildUrlChange]);

  if (!activeAppId) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center text-sm text-muted-foreground",
          className,
        )}
      >
        No app selected.
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-full w-full", className)}
      data-testid="shell-content-host"
    >
      {renderedApps.map((appId) => {
        const isActive = appId === activeAppId;
        // Only the active iframe gets an updated `src` so navigation away
        // from a backgrounded iframe doesn't reset it. The src is captured at
        // mount time via the initial path for all warmed apps.
        const src =
          isActive
            ? buildIframeSrc(appId, appPath)
            : // Background iframes keep their previously-loaded URL. Setting
              // src to undefined here would cause the iframe to reload to the
              // default page; we read the existing dom attribute instead.
              undefined;
        return (
          <iframe
            key={appId}
            data-shell-iframe="true"
            data-app-id={appId}
            title={appId}
            // Same-origin iframe: no sandbox needed (per ADR-002).
            src={src ?? buildIframeSrc(appId, "/")}
            className={cn(
              "absolute inset-0 h-full w-full border-0",
              isActive ? "block" : "hidden",
            )}
          />
        );
      })}
    </div>
  );
}
