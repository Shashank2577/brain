/**
 * Guard MCP tools against cross-user access in shared-process deployments.
 *
 * - Tools with no merged-key prefix (e.g. `mcp__claude-in-chrome__navigate`
 *   from a file-based stdio config) are visible to everyone — those are
 *   process-wide by design.
 * - User-scope tools are only visible to the user whose email hashes to the
 *   tool's owner component.
 * - Org-scope tools are only visible to requests whose active org matches.
 *
 * SECURITY: when there is no request context (CLI scripts, MCP server
 * endpoint without `runWithRequestContext`, etc.) we DENY by default in
 * production — the runtime gate elsewhere is not a safe substitute when
 * the gate runs without a context either. In development we still allow
 * for ergonomics (tool enumeration at startup, ad-hoc CLI runs).
 *
 * See finding #5 in /tmp/security-audit/12-mcp-a2a-agent.md.
 */
export declare function isMcpToolAllowedForRequest(toolName: string): boolean;
//# sourceMappingURL=visibility.d.ts.map