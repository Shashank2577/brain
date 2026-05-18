export declare const EXTENSION_IFRAME_CSP = "default-src 'none'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self';";
export declare const EXTENSION_IFRAME_META_CSP: string;
/**
 * SECURITY — EXTENSION CONTENT IS UNTRUSTED.
 *
 * `${content}` (line ~Body) interpolates raw HTML/JS authored by a user. This
 * file is the boundary between framework-controlled HTML and user-controlled
 * HTML. Two non-negotiable invariants for every change here:
 *
 *   1. The iframe MUST be rendered with a `sandbox` attribute that does NOT
 *      include `allow-same-origin`. The viewer (`ExtensionViewer.tsx`,
 *      `EmbeddedExtension.tsx`) sets `sandbox="allow-scripts allow-forms"` —
 *      and that is the only acceptable shape. Adding `allow-same-origin`
 *      would give the extension full DOM access to the parent window via
 *      cross-frame script.
 *
 *   2. Every reachable parent action must treat the postMessage payload as
 *      hostile. The bridge in `iframe-bridge.ts` enforces a path allowlist,
 *      header sanitization, and method allowlist; do not relax those gates
 *      for "convenience" in this file or any caller.
 *
 * For the trust model rationale, see audit 05-tools-sandbox.md (C1) and the
 * `extensions` skill. When in doubt, fail closed.
 *
 * BACKWARDS COMPAT — the iframe injects helpers under both their canonical
 * `extension*` names (`extensionFetch`, `extensionData`, `extensionId`,
 * `extensionBinding`) AND legacy `tool*` aliases (`toolFetch`, `toolData`,
 * `toolId`, `toolBinding`) so existing user-authored extension bodies that
 * pre-date the rename keep working. Same for layout opt-ins:
 * `data-extension-layout="full-bleed"` / `data-extension-padding="none"` /
 * class `agent-native-extension-bleed` / CSS var
 * `--agent-native-extension-padding` are canonical; the `data-tool-*`,
 * `agent-native-tool-bleed`, and `--agent-native-tool-padding` variants are
 * accepted as aliases.
 */
export interface ExtensionRenderBinding {
    /** Email of the user who authored / owns the extension. */
    authorEmail: string;
    /** Email of the user currently viewing/running the extension. */
    viewerEmail: string;
    /** True when viewer === author. */
    isAuthor: boolean;
    /**
     * Resolved role for the viewer ("owner" | "admin" | "editor" | "viewer").
     *
     * TODO(security, audit H4): the host-side bridge does not yet gate any
     * helper based on this value — every viewer gets the same powers as the
     * author. The role is plumbed through so a follow-up PR can constrain
     * `appAction` / `dbExec` / `extensionFetch` for non-author viewers (and
     * eventually require an explicit consent step before running a shared
     * extension, audit C1). For now this is metadata only.
     */
    role: "owner" | "admin" | "editor" | "viewer";
}
export declare function buildExtensionHtml(content: string, themeVars: string, isDark: boolean, extensionId?: string, binding?: ExtensionRenderBinding): string;
//# sourceMappingURL=html-shell.d.ts.map