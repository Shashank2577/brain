import type { AgentNativeBrowserSessionRecord, AgentNativeBrowserSessionRequest, CreateAgentNativeBrowserSessionRequestInput, RegisterAgentNativeBrowserSessionInput } from "./types.js";
export declare const DEFAULT_BROWSER_SESSION_TTL_MS = 45000;
export declare const DEFAULT_BROWSER_SESSION_REQUEST_TIMEOUT_MS = 30000;
export declare const DEFAULT_BROWSER_SESSION_REQUEST_POLL_MS = 250;
export declare function registerBrowserSession(ownerEmailInput: string, input: RegisterAgentNativeBrowserSessionInput): Promise<AgentNativeBrowserSessionRecord>;
export declare function listBrowserSessions(ownerEmailInput: string, options?: {
    includeExpired?: boolean;
    limit?: number;
}): Promise<AgentNativeBrowserSessionRecord[]>;
export declare function getBrowserSession(ownerEmailInput: string, sessionIdInput: string, options?: {
    includeExpired?: boolean;
}): Promise<AgentNativeBrowserSessionRecord | null>;
export declare function disconnectBrowserSession(ownerEmailInput: string, sessionIdInput: string): Promise<boolean>;
export declare function createBrowserSessionRequest(ownerEmailInput: string, sessionIdInput: string, input: CreateAgentNativeBrowserSessionRequestInput): Promise<AgentNativeBrowserSessionRequest>;
export declare function getBrowserSessionRequest(ownerEmailInput: string, requestIdInput: string): Promise<AgentNativeBrowserSessionRequest | null>;
export declare function claimBrowserSessionRequest(ownerEmailInput: string, sessionIdInput: string): Promise<AgentNativeBrowserSessionRequest | null>;
export declare function completeBrowserSessionRequest(ownerEmailInput: string, sessionIdInput: string, requestIdInput: string, result: {
    ok: true;
    result?: unknown;
} | {
    ok: false;
    error?: string;
    result?: unknown;
}): Promise<AgentNativeBrowserSessionRequest>;
export declare function waitForBrowserSessionRequest(ownerEmailInput: string, requestIdInput: string, options?: {
    timeoutMs?: number;
    pollMs?: number;
}): Promise<unknown>;
export declare function callBrowserSession(ownerEmailInput: string, sessionIdInput: string, input: CreateAgentNativeBrowserSessionRequestInput, options?: {
    timeoutMs?: number;
    pollMs?: number;
}): Promise<unknown>;
//# sourceMappingURL=store.d.ts.map