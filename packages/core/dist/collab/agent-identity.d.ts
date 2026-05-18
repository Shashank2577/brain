/**
 * Canonical agent identity constants for collaborative editing.
 *
 * Centralizes the agent's client ID, name, email, and cursor color
 * so templates don't hardcode these values.
 */
export declare const AGENT_CLIENT_ID = 2147483647;
export interface AgentIdentity {
    clientId: number;
    name: string;
    email: string;
    color: string;
}
export declare const DEFAULT_AGENT_IDENTITY: AgentIdentity;
//# sourceMappingURL=agent-identity.d.ts.map