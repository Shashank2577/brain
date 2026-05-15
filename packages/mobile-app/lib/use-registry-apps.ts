/**
 * Hook that fetches the registry-driven app list from the dispatch host.
 *
 * `GET /_agent-native/registry/apps` returns the list of mini-apps the
 * workspace knows about (driven by the capability registry scan). For each
 * app we get `{ id, name, description, icon, url, capabilities }`. The
 * mobile shell uses this list to drive the apps grid and WebView routing,
 * replacing the static `DEFAULT_APPS` import in Phase 8.
 *
 * The cached static `TEMPLATE_APPS` config is used as a fallback during
 * the very first load (before the network request resolves) so the UI is
 * never blank.
 */
import { useState, useEffect, useCallback } from "react";
import { authedFetch } from "./auth";
import { workspacePath } from "./config";

export interface RegistryApp {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  url: string;
  capabilities: number;
}

export interface RegistryAppsHook {
  apps: RegistryApp[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useRegistryApps(): RegistryAppsHook {
  const [apps, setApps] = useState<RegistryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch(workspacePath("/_agent-native/registry/apps"));
      if (!res.ok) {
        setError(`Registry request failed (${res.status})`);
        return;
      }
      const body = (await res.json()) as { apps?: RegistryApp[] };
      setApps(Array.isArray(body.apps) ? body.apps : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { apps, loading, error, reload };
}
