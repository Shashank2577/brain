import { awaitBootstrap, markDefaultPluginProvided, trackPluginInit, } from "./framework-request-handler.js";
import { createAgentChatPlugin, } from "./agent-chat-plugin.js";
import { createAuthPlugin } from "./auth-plugin.js";
import { createCoreRoutesPlugin, } from "./core-routes-plugin.js";
import { createResourcesPlugin } from "./resources-plugin.js";
import { createSentryPlugin } from "./sentry-plugin.js";
import { createTerminalPlugin, } from "../terminal/terminal-plugin.js";
import { createOrgPlugin } from "../org/plugin.js";
import { createOnboardingPlugin } from "../onboarding/plugin.js";
import { createIntegrationsPlugin, } from "../integrations/index.js";
const EMBEDDED_PLUGIN_STEMS = [
    "auth",
    "sentry",
    "org",
    "core-routes",
    "resources",
    "onboarding",
    "integrations",
    "terminal",
    "agent-chat",
];
function readString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
export function normalizeAgentNativeEmbeddedSession(session) {
    if (!session)
        return null;
    const userId = readString(session.userId);
    const email = readString(session.email) ?? userId;
    if (!email)
        return null;
    return {
        email,
        userId,
        token: readString(session.token),
        name: readString(session.name),
        orgId: readString(session.orgId) ??
            readString(session.organizationId) ??
            undefined,
        orgRole: readString(session.orgRole) ?? readString(session.role) ?? undefined,
    };
}
export function configureAgentNativeEmbeddedEnvironment(options) {
    if (options.appName) {
        process.env.APP_NAME = options.appName; // guard:allow-env-mutation — embedded plugin boot-time configuration, not request-scoped state
    }
    if (options.databaseUrl) {
        process.env.DATABASE_URL = options.databaseUrl; // guard:allow-env-mutation — embedded plugin boot-time configuration, not request-scoped state
    }
    if (options.databaseAuthToken) {
        process.env.DATABASE_AUTH_TOKEN = options.databaseAuthToken; // guard:allow-env-mutation — embedded plugin boot-time configuration, not request-scoped state
    }
}
export function createAgentNativeEmbeddedAuthOptions(auth) {
    if (!auth)
        return undefined;
    const authOptions = typeof auth === "function"
        ? { getSession: auth }
        : auth;
    return {
        mountGoogleOAuthRoutes: false,
        ...authOptions,
        getSession: async (event) => normalizeAgentNativeEmbeddedSession(await authOptions.getSession(event)),
    };
}
function markEmbeddedPluginStems(nitroApp) {
    for (const stem of EMBEDDED_PLUGIN_STEMS) {
        markDefaultPluginProvided(nitroApp, stem);
    }
}
export async function mountAgentNativeEmbedded(nitroApp, options = {}) {
    configureAgentNativeEmbeddedEnvironment(options);
    markEmbeddedPluginStems(nitroApp);
    await awaitBootstrap(nitroApp);
    await createAuthPlugin(createAgentNativeEmbeddedAuthOptions(options.auth))(nitroApp);
    if (options.sentry !== false) {
        await createSentryPlugin()(nitroApp);
    }
    if (options.org === true) {
        await createOrgPlugin()(nitroApp);
    }
    if (options.coreRoutes !== false) {
        await createCoreRoutesPlugin(options.coreRoutes ?? undefined)(nitroApp);
    }
    if (options.resources !== false) {
        await createResourcesPlugin()(nitroApp);
    }
    if (options.onboarding) {
        await createOnboardingPlugin(typeof options.onboarding === "object" ? options.onboarding : undefined)(nitroApp);
    }
    if (options.integrations) {
        await createIntegrationsPlugin(options.integrations)(nitroApp);
    }
    if (options.terminal) {
        await createTerminalPlugin(options.terminal)(nitroApp);
    }
    if (options.agentChat !== false) {
        const hostResolveOrgId = options.agentChat?.resolveOrgId ??
            (options.auth
                ? async (event) => {
                    const session = await createAgentNativeEmbeddedAuthOptions(options.auth)?.getSession?.(event);
                    return session?.orgId ?? null;
                }
                : undefined);
        await createAgentChatPlugin({
            ...(options.agentChat ?? {}),
            actions: options.agentChat?.actions ?? options.actions,
            resolveOrgId: hostResolveOrgId,
        })(nitroApp);
    }
}
export function createAgentNativeEmbeddedPlugin(options = {}) {
    return (nitroApp) => {
        const init = mountAgentNativeEmbedded(nitroApp, options);
        trackPluginInit(nitroApp, init);
        return init;
    };
}
//# sourceMappingURL=embedded.js.map