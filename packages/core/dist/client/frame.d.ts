/**
 * Frame Communication (browser)
 *
 * Utilities for communicating with the parent frame via postMessage.
 * Provides typed request/response patterns and message sending.
 */
/**
 * Send a typed message to the parent frame.
 * No-op if running at top level (no parent frame).
 */
export declare function sendToFrame(type: string, data?: any): void;
/**
 * Listen for a specific message type from the parent frame.
 * Returns a cleanup function.
 */
export declare function onFrameMessage(type: string, handler: (data: any) => void): () => void;
export declare function isTrustedFrameMessage(event: MessageEvent): boolean;
/**
 * Get the frame origin (e.g. "http://localhost:3334").
 * Returns null if not running inside a frame iframe.
 */
export declare function getFrameOrigin(): string | null;
/**
 * Returns true if the app is running inside a frame iframe
 * (local dev frame, Builder.io, or any compatible frame).
 */
export declare function isInFrame(): boolean;
/**
 * Get the origin for OAuth callbacks.
 * Always uses the app's own origin (window.location.origin), NOT the frame
 * origin. The redirect URI registered in Google Cloud Console (or any OAuth
 * provider) must match the template app's direct URL, not the dev frame's
 * proxy URL, so this must be consistent regardless of how the app is accessed.
 */
export declare function getCallbackOrigin(): string;
/**
 * Build an OAuth redirect URI for a framework callback route.
 *
 * Workspace deploys use one provider-registered root callback URL and then
 * relay to the app-specific callback based on OAuth state. Standalone apps
 * keep using their mounted app callback path.
 */
export declare function oauthRedirectUri(callbackPath: string): string;
export interface UserInfo {
    name?: string;
    email?: string;
}
/**
 * Request user info (name + email) from the parent frame.
 * Falls back to empty object if frame doesn't respond within timeout.
 */
export declare function requestUserInfo(timeoutMs?: number): Promise<UserInfo>;
/**
 * Enter visual editing selection mode for a specific element.
 */
export declare function enterStyleEditing(selector: string): void;
/**
 * Enter text editing mode for a specific element.
 */
export declare function enterTextEditing(selector: string): void;
/**
 * Exit selection mode.
 */
export declare function exitSelectionMode(): void;
//# sourceMappingURL=frame.d.ts.map