export declare const AGENT_LOOP_SETTINGS_KEY = "agent-loop";
export declare const DEFAULT_AGENT_MAX_ITERATIONS = 100;
export declare const MIN_AGENT_MAX_ITERATIONS = 1;
export declare const MAX_AGENT_MAX_ITERATIONS = 1000;
export type AgentLoopSettingsScope = "org" | "user" | "default";
export type AgentLoopSettingsSource = "org" | "user" | "env" | "default";
export interface AgentLoopSettings {
    maxIterations: number;
    defaultMaxIterations: number;
    minMaxIterations: number;
    maxMaxIterations: number;
    scope: AgentLoopSettingsScope;
    source: AgentLoopSettingsSource;
}
export declare function normalizeMaxIterations(value: unknown, fallback?: number): number;
export declare function validateMaxIterationsInput(value: unknown): {
    ok: true;
    value: number;
} | {
    ok: false;
    error: string;
};
export declare function getDefaultMaxIterations(): number;
export declare function readAgentLoopSettings(ctx: {
    userEmail?: string | null;
    orgId?: string | null;
}): Promise<AgentLoopSettings>;
export declare function writeAgentLoopSettings(ctx: {
    userEmail?: string | null;
    orgId?: string | null;
}, maxIterations: number): Promise<AgentLoopSettings>;
export declare function resetAgentLoopSettings(ctx: {
    userEmail?: string | null;
    orgId?: string | null;
}): Promise<AgentLoopSettings>;
export declare function canUpdateAgentLoopSettings(userEmail: string | null | undefined, orgId: string | null | undefined): Promise<boolean>;
//# sourceMappingURL=loop-settings.d.ts.map