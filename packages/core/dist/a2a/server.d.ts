import type { A2AConfig } from "./types.js";
/**
 * Mount A2A protocol endpoints on an H3/Nitro app.
 *
 * - GET /.well-known/agent-card.json — public agent card (no auth)
 * - POST /_agent-native/a2a — JSON-RPC endpoint (with optional auth)
 *
 * When A2A_SECRET is set, inbound Bearer tokens are verified as JWTs
 * and the caller's email is extracted from the `sub` claim. This provides
 * cryptographic identity verification for cross-app A2A calls.
 */
export declare function mountA2A(nitroApp: any, config: A2AConfig, routePrefix?: string): void;
export declare function filterPublicAgentCardSkills(config: A2AConfig): import("./types.js").AgentSkill[];
//# sourceMappingURL=server.d.ts.map