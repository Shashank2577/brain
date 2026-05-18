/**
 * Canonical agent identity constants for collaborative editing.
 *
 * Centralizes the agent's client ID, name, email, and cursor color
 * so templates don't hardcode these values.
 */
export const AGENT_CLIENT_ID = 2147483647; // Max 32-bit signed int, reserved for agent
export const DEFAULT_AGENT_IDENTITY = {
    clientId: AGENT_CLIENT_ID,
    name: "AI Assistant",
    email: "agent@system",
    color: "#00B5FF", // agent-native blue
};
//# sourceMappingURL=agent-identity.js.map