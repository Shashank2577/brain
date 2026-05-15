import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Workspace base URL — the dispatch host that mints the bearer JWT and
 * serves `/_agent-native/registry/apps`. Resolution order:
 *   1. `expo.extra.workspaceUrl` in `app.json` / EAS env
 *   2. `EXPO_PUBLIC_WORKSPACE_URL` env var (set via `EXPO_PUBLIC_*`)
 *   3. Platform-specific dev default:
 *      - Android: `http://10.0.2.2:8080` (emulator host loopback)
 *      - iOS / web: `http://localhost:8080`
 *
 * The dev defaults assume the dispatch shell is running locally on port 8080.
 * For real deployment, set `EXPO_PUBLIC_WORKSPACE_URL` to the prod hostname
 * (e.g. `https://workspace.example.com`).
 */
function resolveWorkspaceUrl(): string {
  const extra =
    (Constants.expoConfig?.extra as { workspaceUrl?: string } | undefined)
      ?.workspaceUrl;
  if (typeof extra === "string" && extra.length > 0) return extra;

  const envUrl = process.env.EXPO_PUBLIC_WORKSPACE_URL;
  if (typeof envUrl === "string" && envUrl.length > 0) return envUrl;

  // Local dev defaults. Android emulator routes the host's loopback to
  // 10.0.2.2; iOS simulator shares the host's network so `localhost` works.
  if (Platform.OS === "android") return "http://10.0.2.2:8080";
  return "http://localhost:8080";
}

export const WORKSPACE_URL = resolveWorkspaceUrl();

/** Strip a trailing slash so URL concatenation stays predictable. */
export function workspaceUrl(): string {
  return WORKSPACE_URL.replace(/\/$/, "");
}

/** Build an absolute URL for a framework-relative path. */
export function workspacePath(path: string): string {
  const base = workspaceUrl();
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
