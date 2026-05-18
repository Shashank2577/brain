/**
 * `agent-native connect <url>` — wire your local Claude Code / Codex / Cowork
 * to a DEPLOYED agent-native app using a browser device-code flow. No token
 * copying: open the verification URL, approve in the browser, and the minted
 * HTTP MCP server entry is written into your client config(s) idempotently.
 *
 *   agent-native connect <url> [--client all|claude-code|claude-code-cli|
 *                               codex|cowork] [--scope user|project]
 *                               [--name <serverName>]
 *   agent-native connect <url> --token <token>   (no-browser fallback)
 *   agent-native connect --all  [--client ...]   (every first-party app)
 *
 * Server contract (implemented by another agent on `<url>`):
 *   POST <url>/_agent-native/mcp/connect/device/start  (no auth)
 *     body { client?, app? }
 *     → { device_code, user_code, verification_uri,
 *         verification_uri_complete, interval, expires_in }
 *   POST <url>/_agent-native/mcp/connect/device/poll   (no auth)
 *     body { device_code }
 *     → { status: "pending" }
 *     | { status: "approved", token, mcpUrl, serverName, mcpServerEntry }
 *     | { status: "expired" }
 *     | { status: "consumed" }
 *     | { status: "error" | "not_found", message? }
 *
 * Node-only CLI module. No new npm deps (Node built-ins + global fetch only).
 */
import { ClientId } from "./mcp-config-writers.js";
export interface ParsedConnectArgs {
    /** Positional URL (the deployed app origin). Undefined for `--all`. */
    url?: string;
    /** all | claude-code | claude-code-cli | codex | cowork (default "all"). */
    client: string;
    /** user | project (default "user"). */
    scope: string;
    /** Override the minted MCP server name. */
    name?: string;
    /** No-browser fallback: skip device flow, use this token directly. */
    token?: string;
    /** Connect every first-party hosted app. */
    all: boolean;
}
export declare function parseConnectArgs(argv: string[]): ParsedConnectArgs;
/**
 * Normalize a user-supplied app URL: trim, require http/https, strip the
 * trailing slash. Throws a friendly Error otherwise.
 */
export declare function normalizeUrl(raw: string): string;
/** Resolve the requested clients list. "all" → every supported client. */
export declare function resolveClients(client: string): ClientId[];
/** Injectable hooks so the poll state machine is unit-testable. */
export interface ConnectDeps {
    /** Defaults to global fetch. */
    fetchImpl?: typeof fetch;
    /** Sleep between polls (ms). Defaults to real setTimeout. */
    sleep?: (ms: number) => Promise<void>;
    /** Open the verification URL. Defaults to the platform browser opener. */
    openBrowser?: (url: string) => void;
    /** Override "now" for the expiry cap (ms epoch). Defaults to Date.now. */
    now?: () => number;
}
/**
 * Run the device-code flow against `baseUrl` and return the approved grant.
 * Resolves with `null` (and prints a clear message) on expired/consumed or
 * other terminal failure — the caller maps that to a non-zero exit.
 */
export declare function runDeviceFlow(baseUrl: string, appSlug: string, clientArg: string, deps?: ConnectDeps): Promise<{
    token?: string;
    mcpUrl: string;
    serverName: string;
    headers?: Record<string, string>;
} | null>;
/**
 * Write the HTTP MCP entry into every requested client config idempotently.
 * Returns the list of files written so the caller can print them.
 */
export declare function writeConfigs(clients: ClientId[], serverName: string, mcpUrl: string, token: string | undefined, scope: string, baseDir?: string, headers?: Record<string, string>): {
    client: ClientId;
    file: string;
}[];
/** Hosted first-party apps: visible (non-hidden) templates with a prodUrl. */
export declare function hostedApps(): {
    name: string;
    url: string;
}[];
/**
 * `agent-native connect` entry point. `deps` is injectable for tests; the
 * dispatcher in index.ts calls it with just `args`.
 *
 * Sets `process.exitCode = 1` on failure (so the process exits non-zero
 * once the event loop drains) rather than calling `process.exit`, keeping
 * the function testable — same pattern as `audit-agent-web`.
 */
export declare function runConnect(args: string[], deps?: ConnectDeps): Promise<void>;
//# sourceMappingURL=connect.d.ts.map