export declare const AGENT_APP_MODEL_DEFAULT_KEY_PREFIX = "agent-app-model-default";
export type AgentAppModelDefaultScope = "org" | "user" | "default";
export type AgentAppModelDefaultSource = "org" | "user" | "default";
export interface AgentAppModelDefaultSelection {
    engine: string;
    model: string;
    updatedAt?: number;
    updatedBy?: string;
}
export interface AgentAppModelDefaultSettings {
    appId: string;
    engine: string | null;
    model: string | null;
    scope: AgentAppModelDefaultScope;
    source: AgentAppModelDefaultSource;
}
export declare function normalizeAgentAppModelDefaultAppId(appId: string | null | undefined): string | null;
export declare function agentAppModelDefaultSettingsKey(appId: string): string;
export declare function readAgentAppModelDefaultSettings(ctx: {
    userEmail?: string | null;
    orgId?: string | null;
}, appIdInput: string | null | undefined): Promise<AgentAppModelDefaultSettings>;
export declare function writeAgentAppModelDefaultSettings(ctx: {
    userEmail?: string | null;
    orgId?: string | null;
}, appIdInput: string | null | undefined, selection: {
    engine: string;
    model: string;
    updatedBy?: string | null;
}): Promise<AgentAppModelDefaultSettings>;
export declare function resetAgentAppModelDefaultSettings(ctx: {
    userEmail?: string | null;
    orgId?: string | null;
}, appIdInput: string | null | undefined): Promise<AgentAppModelDefaultSettings>;
export declare function canUpdateAgentAppModelDefaultSettings(userEmail: string | null | undefined, orgId: string | null | undefined): Promise<boolean>;
export declare function getAgentAppModelDefaultForCurrentRequest(appIdInput: string | null | undefined): Promise<AgentAppModelDefaultSelection | null>;
//# sourceMappingURL=app-model-defaults.d.ts.map