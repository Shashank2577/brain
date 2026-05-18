import { getH3App, awaitBootstrap, markDefaultPluginProvided, } from "./framework-request-handler.js";
import { autoMountAuth } from "./auth.js";
export function createAuthPlugin(options) {
    return async (nitroApp) => {
        markDefaultPluginProvided(nitroApp, "auth");
        // Wait for any other default plugins to finish mounting first.
        await awaitBootstrap(nitroApp);
        await autoMountAuth(getH3App(nitroApp), options);
    };
}
/**
 * Default auth plugin — email/password auth with optional Google OAuth.
 * Google sign-in button appears automatically on the login page when
 * GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars are set.
 */
export const defaultAuthPlugin = async (nitroApp) => {
    return createAuthPlugin()(nitroApp);
};
//# sourceMappingURL=auth-plugin.js.map