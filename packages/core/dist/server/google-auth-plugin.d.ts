import { type GoogleAuthMode } from "./google-auth-mode.js";
type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
export interface GoogleAuthPluginOptions {
    /** Additional paths accessible without authentication */
    publicPaths?: string[];
    /**
     * Google sign-in flow: `'popup'`, `'redirect'`, or `'auto'` (default).
     * Falls back to `GOOGLE_AUTH_MODE` env var, then `'auto'`. Builder
     * iframes use popup; top-level Builder preview/editor surfaces use
     * redirect.
     */
    googleAuthMode?: GoogleAuthMode;
}
/**
 * Create an auth plugin that uses Google OAuth for authentication.
 *
 * When a user visits the app unauthenticated, they see a "Sign in with Google"
 * page. The Google OAuth callback (handled by the template) creates a session
 * tied to the user's Google email. `getSession()` then returns `{ email }` for
 * all subsequent requests.
 *
 * Better Auth handles Google OAuth internally when GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET are set. The template's callback route at
 * /_agent-native/google/callback handles mobile deep linking.
 *
 * Usage in a template's `server/plugins/auth.ts`:
 * ```ts
 * import { createGoogleAuthPlugin } from "@agent-native/core/server";
 * export default createGoogleAuthPlugin();
 * ```
 */
export declare function createGoogleAuthPlugin(options?: GoogleAuthPluginOptions): NitroPluginDef;
export {};
//# sourceMappingURL=google-auth-plugin.d.ts.map