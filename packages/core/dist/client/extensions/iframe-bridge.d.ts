/**
 * Path allowlist for the extension postMessage bridge.
 *
 * Extensions can only call paths under `/_agent-native/*` (the framework's own
 * namespace). Template-defined `/api/*` routes are intentionally rejected:
 * those routes are written by app authors who may not consistently apply the
 * `accessFilter`/`assertAccess` access scoping helpers. A shared/org extension
 * running with the viewer's session should not be able to reach surfaces
 * outside the framework's own well-audited namespace.
 *
 * If a template needs a extension to reach a custom route, expose it via an
 * action (`defineAction` auto-mounts under `/_agent-native/actions/<name>`).
 */
export declare function isAllowedExtensionPath(path: string, extensionId: string): boolean;
export declare function sanitizeExtensionRequestOptions(value: unknown): RequestInit;
export type ExtensionBridgeRole = "owner" | "admin" | "editor" | "viewer";
export interface BridgePolicyContext {
    /** Resolved role of the viewer on this extension. */
    role: ExtensionBridgeRole;
    /** True when viewer is the extension's owner_email — equivalent to role "owner"
     *  but cheaper to plumb through from the render binding. */
    isAuthor: boolean;
}
export interface BridgePolicyResult {
    ok: boolean;
    /** Human-readable error to send back to the iframe when ok=false. */
    error?: string;
}
/**
 * Decide whether the iframe is allowed to proxy this request given the
 * viewer's role on the extension. Authors (and owner/admin/editor in general)
 * keep the full bridge surface; viewers get a strictly read-only subset.
 *
 * Called BEFORE the request leaves the parent — so a denial is local-only
 * and never reveals server state to the iframe.
 */
export declare function checkBridgePolicy(path: string, method: string, ctx: BridgePolicyContext): BridgePolicyResult;
//# sourceMappingURL=iframe-bridge.d.ts.map