export { mountMCP } from "./server.js";
// Shared MCP server builder (also re-exported from ./server.js for back-compat).
export { createMCPServerForRequest, verifyAuth, getAccessTokens, resolveOrgIdFromDomain, buildLinkArtifacts, } from "./build-server.js";
// stdio transport for `agent-native mcp serve` (Node-only).
export { runMCPStdio } from "./stdio.js";
// Generic cross-app builtin tools (merged into the registry, template wins).
export { getBuiltinCrossAppTools } from "./builtin-tools.js";
// Workspace / app resolution helpers (Node-only).
export { resolveWorkspace, resolveLocalAppOrigin, findWorkspaceRoot, } from "./workspace-resolve.js";
//# sourceMappingURL=index.js.map