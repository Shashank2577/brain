import type { AuthOptions } from "./auth.js";
type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
export declare function createAuthPlugin(options?: AuthOptions): NitroPluginDef;
/**
 * Default auth plugin — email/password auth with optional Google OAuth.
 * Google sign-in button appears automatically on the login page when
 * GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars are set.
 */
export declare const defaultAuthPlugin: NitroPluginDef;
export {};
//# sourceMappingURL=auth-plugin.d.ts.map