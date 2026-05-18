import type { H3Event } from "h3";
import type { AuthOptions, AuthSession } from "./auth.js";
import { type AgentChatPluginOptions } from "./agent-chat-plugin.js";
import { type CoreRoutesPluginOptions } from "./core-routes-plugin.js";
import { type TerminalPluginOptions } from "../terminal/terminal-plugin.js";
import type { OnboardingPluginOptions } from "../onboarding/plugin.js";
import { type IntegrationsPluginOptions } from "../integrations/index.js";
type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
export interface AgentNativeEmbeddedHostSession {
    email?: string | null;
    userId?: string | null;
    token?: string | null;
    name?: string | null;
    orgId?: string | null;
    orgRole?: string | null;
    /** Alias accepted from host products that use organizationId naming. */
    organizationId?: string | null;
    /** Alias accepted from host products that use role naming. */
    role?: string | null;
    [key: string]: unknown;
}
export type AgentNativeEmbeddedGetSession = (event: H3Event) => AgentNativeEmbeddedHostSession | null | Promise<AgentNativeEmbeddedHostSession | null>;
export interface AgentNativeEmbeddedAuthOptions extends Omit<AuthOptions, "getSession"> {
    /**
     * Resolve the already-authenticated host user. Return null for anonymous
     * requests. No Agent-Native login is shown when this is supplied.
     */
    getSession: AgentNativeEmbeddedGetSession;
}
export interface AgentNativeEmbeddedPluginOptions {
    /**
     * Database used by Agent-Native managed tables. Defaults to the existing
     * DATABASE_URL environment variable. For embedded SaaS installs, prefer a
     * dedicated Agent-Native database/schema unless you explicitly want
     * framework-owned tables in the host product database.
     */
    databaseUrl?: string;
    /** Auth token for remote libsql/Turso databases. */
    databaseAuthToken?: string;
    /** Optional app name for per-app DATABASE_URL resolution and cookie scoping. */
    appName?: string;
    /**
     * Host auth adapter. Pass a function for the common case, or an object when
     * you need public path/auth-route options too.
     */
    auth?: AgentNativeEmbeddedGetSession | AgentNativeEmbeddedAuthOptions;
    /** Backend actions exposed to the agent and mounted under /_agent-native/actions. */
    actions?: AgentChatPluginOptions["actions"];
    /** Agent chat options. `actions` defaults to the top-level `actions`. */
    agentChat?: AgentChatPluginOptions | false;
    /** Core framework routes: poll, app-state, extensions, secrets, browser sessions. */
    coreRoutes?: CoreRoutesPluginOptions | false;
    /** Mount resource CRUD routes. Defaults to true. */
    resources?: boolean;
    /** Mount org-management routes. Defaults to false for host-auth embeds. */
    org?: boolean;
    /** Mount onboarding routes. Defaults to false for host-auth embeds. */
    onboarding?: boolean | OnboardingPluginOptions;
    /** Mount messaging integrations. Defaults to false. */
    integrations?: IntegrationsPluginOptions | false;
    /** Mount Sentry request/error hooks. Defaults to true. */
    sentry?: boolean;
    /** Mount terminal routes. Defaults to false for embedded SaaS installs. */
    terminal?: TerminalPluginOptions | false;
}
export declare function normalizeAgentNativeEmbeddedSession(session: AgentNativeEmbeddedHostSession | null | undefined): AuthSession | null;
export declare function configureAgentNativeEmbeddedEnvironment(options: Pick<AgentNativeEmbeddedPluginOptions, "appName" | "databaseAuthToken" | "databaseUrl">): void;
export declare function createAgentNativeEmbeddedAuthOptions(auth: AgentNativeEmbeddedPluginOptions["auth"]): AuthOptions | undefined;
export declare function mountAgentNativeEmbedded(nitroApp: any, options?: AgentNativeEmbeddedPluginOptions): Promise<void>;
export declare function createAgentNativeEmbeddedPlugin(options?: AgentNativeEmbeddedPluginOptions): NitroPluginDef;
export {};
//# sourceMappingURL=embedded.d.ts.map