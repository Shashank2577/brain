import { agentNativePath } from "./api-path.js";

/**
 * Frame Communication (browser)
 *
 * Utilities for communicating with the parent frame via postMessage.
 * Provides typed request/response patterns and message sending.
 */

// ---------------------------------------------------------------------------
// Low-level parent messaging
// ---------------------------------------------------------------------------

/**
 * Send a typed message to the parent frame.
 * No-op if running at top level (no parent frame).
 */
export function sendToFrame(type: string, data?: any): void {
  if (typeof window === "undefined") return;
  const target = window.parent !== window ? window.parent : window;
  const targetOrigin = getFrameOrigin() || window.location.origin;
  target.postMessage({ type, data }, targetOrigin);
}

/**
 * Listen for a specific message type from the parent frame.
 * Returns a cleanup function.
 */
export function onFrameMessage(
  type: string,
  handler: (data: any) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const listener = (event: MessageEvent) => {
    if (!isTrustedFrameMessage(event)) return;
    if (event.data?.type === type) {
      handler(event.data.data ?? event.data.detail ?? event.data);
    }
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

// ---------------------------------------------------------------------------
// Frame Origin
// ---------------------------------------------------------------------------

let _frameOrigin: string | null = null;

function normalizeOrigin(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isTrustedFrameMessage(event: MessageEvent): boolean {
  if (typeof window === "undefined") return false;

  const ownOrigin = window.location.origin;
  if (event.origin === ownOrigin) return true;

  const frameOrigin = getFrameOrigin();
  if (!frameOrigin || event.origin !== frameOrigin) return false;

  return event.source === window.parent || event.source === window;
}

// Listen for frame origin message and cache it.
// Only accept from the direct parent frame, and only set once.
if (typeof window !== "undefined") {
  window.addEventListener("message", (event: MessageEvent) => {
    const origin = normalizeOrigin(event.data?.origin);
    if (
      event.data?.type === "agentNative.frameOrigin" &&
      origin &&
      origin === event.origin &&
      !_frameOrigin &&
      event.source === window.parent
    ) {
      _frameOrigin = origin;
    }
  });
}

/**
 * Get the frame origin (e.g. "http://localhost:3334").
 * Returns null if not running inside a frame iframe.
 */
export function getFrameOrigin(): string | null {
  return _frameOrigin;
}

/**
 * Returns true if the app is running inside a frame iframe
 * (local dev frame, Builder.io, or any compatible frame).
 */
export function isInFrame(): boolean {
  return _frameOrigin !== null;
}

/**
 * Get the origin for OAuth callbacks.
 * Always uses the app's own origin (window.location.origin), NOT the frame
 * origin. The redirect URI registered in Google Cloud Console (or any OAuth
 * provider) must match the template app's direct URL, not the dev frame's
 * proxy URL, so this must be consistent regardless of how the app is accessed.
 */
export function getCallbackOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

function envFlag(name: string): boolean {
  const value = runtimeEnvValue(name);
  return value === "1" || value === "true" || value === true;
}

function runtimeEnvValue(name: string): string | boolean | undefined {
  const importMetaEnv = (
    import.meta as unknown as {
      env?: Record<string, string | boolean | undefined>;
    }
  ).env;
  if (importMetaEnv?.[name] !== undefined) return importMetaEnv[name];
  return typeof process !== "undefined"
    ? (process.env as Record<string, string | undefined>)?.[name]
    : undefined;
}

function workspaceOAuthOrigin(): string | null {
  const raw =
    runtimeEnvValue("VITE_WORKSPACE_OAUTH_ORIGIN") ||
    runtimeEnvValue("WORKSPACE_OAUTH_ORIGIN") ||
    runtimeEnvValue("VITE_APP_URL") ||
    runtimeEnvValue("APP_URL") ||
    runtimeEnvValue("VITE_BETTER_AUTH_URL") ||
    runtimeEnvValue("BETTER_AUTH_URL") ||
    runtimeEnvValue("VITE_WORKSPACE_GATEWAY_URL") ||
    runtimeEnvValue("WORKSPACE_GATEWAY_URL");
  if (typeof raw !== "string" || !raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function shouldUseWorkspaceCallbackRelay(path: string): boolean {
  return (
    envFlag("VITE_AGENT_NATIVE_WORKSPACE") &&
    path.startsWith("/_agent-native/") &&
    (path.endsWith("/callback") || path.includes("/callback/"))
  );
}

/**
 * Build an OAuth redirect URI for a framework callback route.
 *
 * Workspace deploys use one provider-registered root callback URL and then
 * relay to the app-specific callback based on OAuth state. Standalone apps
 * keep using their mounted app callback path.
 */
export function oauthRedirectUri(callbackPath: string): string {
  const normalized = callbackPath.startsWith("/")
    ? callbackPath
    : `/${callbackPath}`;
  const path = shouldUseWorkspaceCallbackRelay(normalized)
    ? normalized
    : agentNativePath(normalized);
  const oauthOrigin = shouldUseWorkspaceCallbackRelay(normalized)
    ? workspaceOAuthOrigin()
    : null;
  const origin = oauthOrigin ?? getCallbackOrigin();
  return `${origin}${path}`;
}

// ---------------------------------------------------------------------------
// User Info
// ---------------------------------------------------------------------------

export interface UserInfo {
  name?: string;
  email?: string;
}

/**
 * Request user info (name + email) from the parent frame.
 * Falls back to empty object if frame doesn't respond within timeout.
 */
export function requestUserInfo(timeoutMs = 1500): Promise<UserInfo> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || window.parent === window) {
      resolve({});
      return;
    }

    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        window.removeEventListener("message", handler);
        resolve({});
      }
    }, timeoutMs);

    function handler(event: MessageEvent) {
      if (!event.data || event.data.type !== "agentNative.userInfo") return;
      if (event.source !== window.parent) return;
      const frameOrigin = getFrameOrigin();
      if (frameOrigin && event.origin !== frameOrigin) return;
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener("message", handler);
      const { name, email } = event.data.data ?? {};
      resolve({ name: name || undefined, email: email || undefined });
    }

    window.addEventListener("message", handler);
    window.parent.postMessage(
      { type: "agentNative.getUserInfo" },
      getFrameOrigin() ?? window.location.origin,
    );
  });
}

// ---------------------------------------------------------------------------
// Selection Mode (visual editing)
// ---------------------------------------------------------------------------

/**
 * Enter visual editing selection mode for a specific element.
 */
export function enterStyleEditing(selector: string): void {
  sendToFrame("agentNative.enterStyleEditing", { selector });
}

/**
 * Enter text editing mode for a specific element.
 */
export function enterTextEditing(selector: string): void {
  sendToFrame("agentNative.enterTextEditing", { selector });
}

/**
 * Exit selection mode.
 */
export function exitSelectionMode(): void {
  sendToFrame("agentNative.exitSelectionMode");
}

// ---------------------------------------------------------------------------
// Dispatch Super-App Shell Bridge
// ---------------------------------------------------------------------------
//
// When a mini-app is loaded inside the dispatch shell iframe, it needs two
// things:
//
//   1. A way to tell the parent shell "my internal URL just changed to X" so
//      the parent can reflect the deep link in the browser URL bar.
//   2. A way to detect that it's running inside the dispatch shell so its own
//      layout can hide the per-template AgentSidebar (the shell renders one
//      sidebar for the whole workspace).
//
// We keep this distinct from the existing `isInFrame()` check, which only
// returns true after the parent has explicitly posted an
// `agentNative.frameOrigin` handshake (used by Builder.io and the dev frame).
// The dispatch shell loads mini-apps in a same-origin iframe without that
// handshake, so we detect via `window.parent !== window` plus an explicit URL
// sentinel set by the shell when it constructs the iframe src.

/**
 * URL query parameter the shell adds to every iframe src so child apps know
 * for certain they're running inside the dispatch shell. We avoid relying on
 * `window.parent !== window` alone because devtools or third-party embeds can
 * iframe a mini-app without being the dispatch shell.
 */
export const DISPATCH_SHELL_SENTINEL_PARAM = "__shell";
export const DISPATCH_SHELL_SENTINEL_VALUE = "dispatch";

/**
 * Returns true when this app is running inside the dispatch super-app shell
 * iframe. Detection is by URL sentinel (set by ShellContentHost when it
 * constructs the iframe src) — most reliable signal we have for a same-origin
 * iframe without a postMessage handshake.
 *
 * Falls back to `false` on the server. Templates use this in their root layout
 * to hide their own AgentSidebar when the shell is rendering its own.
 */
export function isInsideDispatchShell(): boolean {
  if (typeof window === "undefined") return false;
  // Cheapest first: if we're top-level, we're not inside any shell.
  try {
    if (window.parent === window) return false;
  } catch {
    // Cross-origin parent access throws in some sandboxed contexts. Same-origin
    // (dispatch shell) never throws. If we can't read window.parent we can't
    // be inside dispatch, so bail out.
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get(DISPATCH_SHELL_SENTINEL_PARAM) === DISPATCH_SHELL_SENTINEL_VALUE) {
    return true;
  }
  // Secondary signal: the shell may have already rewritten the URL via
  // history.replaceState to remove the sentinel from the user-visible path.
  // In that case we fall back to a body-level data attribute the shell sets.
  if (typeof document !== "undefined") {
    return document.documentElement.hasAttribute("data-dispatch-shell");
  }
  return false;
}

/**
 * Mark the current document as embedded inside the dispatch shell. Called by
 * the child mini-app's root layout once it's confirmed via
 * `isInsideDispatchShell()` so subsequent reads (after a `history.replaceState`
 * that strips the URL sentinel) still return true.
 */
export function markEmbeddedInsideDispatchShell(): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-dispatch-shell", "true");
}

/**
 * Notify the parent dispatch shell that the child mini-app navigated to a new
 * internal path. The shell reflects this in the browser URL so deep-links and
 * back-button navigation work even when the iframe owns its own router.
 *
 * No-op when not embedded in the shell. Safe to call from any client-side
 * router-change handler — the shell only listens when it sees a known appId
 * mounted in the iframe.
 */
export function notifyShellOfNavigation(path: string): void {
  if (typeof window === "undefined") return;
  if (!isInsideDispatchShell()) return;
  try {
    window.parent.postMessage(
      { kind: "url-change", path },
      window.location.origin,
    );
  } catch {
    // postMessage to a cross-origin parent throws; we shouldn't be here in
    // that case (isInsideDispatchShell requires same-origin), but stay quiet
    // anyway.
  }
}
