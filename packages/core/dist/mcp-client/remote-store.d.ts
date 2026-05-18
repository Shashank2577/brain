/**
 * Persistent store for user-added remote MCP servers.
 *
 * Servers added through the settings UI live in the framework's `settings`
 * table, keyed by scope:
 *   - User scope: `u:<email>:mcp-servers-remote`
 *   - Org scope:  `o:<orgId>:mcp-servers-remote`
 *
 * Both scopes store the same shape — a list of `StoredRemoteMcpServer`
 * records. The running MCP manager merges this list with the file-based
 * `mcp.config.json` on startup and after every mutation.
 *
 * SECURITY: HTTP MCP servers commonly require a bearer token in the
 * `Authorization` header. Those values are written to the encrypted
 * `app_secrets` table (AES-256-GCM via writeAppSecret). The settings row
 * stores only the secret-key reference (`headerSecretKey`), not the raw
 * value. Callers retrieving headers must call `materializeHeaders` to
 * fetch the cleartext at request time. Legacy rows that wrote headers
 * cleartext into `headers` continue to work read-only — they should be
 * re-saved to migrate.
 */
import type { McpHttpServerConfig } from "./config.js";
export type RemoteMcpScope = "user" | "org";
export interface StoredRemoteMcpServer {
    /** Stable unique id — used for removal / URLs. */
    id: string;
    /** Human-readable name. Also used as the MCP server id (prefixed with scope). */
    name: string;
    /** Streamable HTTP MCP server URL. */
    url: string;
    /**
     * Optional non-secret headers to pass to the MCP server. SECURITY: secret
     * material (Authorization, X-Api-Key, …) is moved out of this field at
     * write time and stored encrypted in `app_secrets`; see
     * `headerSecretKey`. Legacy rows may still contain cleartext headers and
     * are honored read-only.
     */
    headers?: Record<string, string>;
    /**
     * Reference to the encrypted secret holding the JSON-stringified secret
     * headers map (e.g. `{"Authorization":"Bearer …"}`). Resolved at request
     * time via `readAppSecret`. Undefined when no secret-class headers were
     * supplied (or for legacy cleartext rows).
     */
    headerSecretKey?: string;
    /** Optional description shown in the UI. */
    description?: string;
    /** ms since epoch. */
    createdAt: number;
}
/**
 * Validate a candidate MCP server name — used as a key in the merged config
 * and as part of the prefixed tool name (`mcp__<merged-key>__<tool>`).
 *
 * Allowed: letters, digits, hyphen; 1–40 chars. Lowercased. Underscores are
 * excluded on purpose — the merged-key format uses `_` as a separator between
 * `<scope>`, `<owner>`, and `<name>`, so allowing `_` in names would make the
 * parse ambiguous.
 */
export declare function normalizeServerName(input: string): string;
/**
 * Short, deterministic, URL-safe hash of an email. Used as the owner
 * discriminator in user-scope merged keys so two users with the same server
 * name don't collide in the global MCP manager.
 */
export declare function hashEmail(email: string): string;
/** Reject obviously-wrong URLs. Allows http only for localhost. */
export declare function validateRemoteUrl(raw: string): {
    ok: boolean;
    url?: URL;
    error?: string;
};
export declare function listRemoteServers(scope: RemoteMcpScope, scopeId: string): Promise<StoredRemoteMcpServer[]>;
export declare function addRemoteServer(scope: RemoteMcpScope, scopeId: string, input: {
    name: string;
    url: string;
    headers?: Record<string, string>;
    description?: string;
}): Promise<{
    ok: true;
    server: StoredRemoteMcpServer;
} | {
    ok: false;
    error: string;
}>;
export declare function removeRemoteServer(scope: RemoteMcpScope, scopeId: string, id: string): Promise<boolean>;
/**
 * Resolve the full headers map (cleartext + decrypted secret headers) for a
 * stored MCP server. Used when projecting the stored record into the
 * runtime `McpHttpServerConfig` shape that `McpClientManager` consumes.
 *
 * For legacy rows that wrote secrets cleartext into `headers`, this
 * returns those cleartext values unchanged — they should be re-saved
 * through `addRemoteServer` to migrate to encrypted storage.
 */
export declare function materializeHeaders(scope: RemoteMcpScope, scopeId: string, stored: StoredRemoteMcpServer): Promise<Record<string, string> | undefined>;
/**
 * Project a stored server into the runtime `McpHttpServerConfig` shape that
 * `McpClientManager` consumes. The merged-config key is the scope + name
 * so a user-scope and org-scope server can both share a readable name
 * without clobbering each other.
 *
 * SECURITY: when the stored row references encrypted headers
 * (`headerSecretKey`), callers should use `toHttpServerConfigAsync`
 * instead — this synchronous variant returns ONLY the cleartext headers
 * already present on the row. Returning the row's literal headers without
 * the secret material means the runtime client would call the MCP server
 * without auth (request will fail), but never leaks the encrypted secret.
 */
export declare function toHttpServerConfig(stored: StoredRemoteMcpServer): McpHttpServerConfig;
/**
 * Async variant of `toHttpServerConfig` that resolves any encrypted
 * `headerSecretKey` reference from `app_secrets` and returns the full
 * cleartext headers map for use at runtime. Use this when actually
 * configuring an MCP client; use the sync variant only when serializing
 * stored data (e.g. for read-only listings that shouldn't disclose
 * secrets).
 */
export declare function toHttpServerConfigAsync(scope: RemoteMcpScope, scopeId: string, stored: StoredRemoteMcpServer): Promise<McpHttpServerConfig>;
/**
 * Build the merged-config key for a stored server.
 *
 * The key encodes the owning scope + owner identity so two users adding a
 * server called `zapier` produce distinct ids (`user_ab12cd34ef_zapier` vs
 * `user_99aa88bb77_zapier`) and Alice's tool calls never route through Bob's
 * credentials in a shared-process deployment.
 *
 * - User scope: `user_<emailhash>_<name>`
 * - Org scope:  `org_<orgId>_<name>`
 *
 * `ownerId` is the raw email for user scope, and the org id for org scope.
 */
export declare function mergedConfigKey(scope: RemoteMcpScope, stored: StoredRemoteMcpServer, ownerId: string): string;
/**
 * Parse a merged key (or a full prefixed tool name like
 * `mcp__user_abcd1234ef_zapier__run-task`) back into its scope + owner + name
 * components. Returns null for non-merged keys (e.g. stdio file-config servers
 * like `claude-in-chrome`) so callers can treat them as always-visible.
 *
 * `hub_<orgId>_<name>` entries (pulled from a remote hub via
 * `hub-client.ts`) project to `scope: "org"` so they pass through the same
 * per-request visibility gate as locally-stored org servers — the tool is
 * only visible to requests whose active org matches the hub entry's org.
 */
export declare function parseMergedKey(keyOrToolName: string): {
    scope: RemoteMcpScope;
    owner: string;
    name: string;
} | null;
//# sourceMappingURL=remote-store.d.ts.map