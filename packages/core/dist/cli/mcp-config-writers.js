/**
 * Shared MCP client-config writers.
 *
 * Extracted so both `agent-native mcp install` (see `mcp.ts`) and
 * `agent-native connect` (see `connect.ts`) write the EXACT same on-disk
 * config file targets and formats for every supported client. `mcp.ts`
 * intentionally keeps its own hand-rolled copies of these writers (its
 * external behavior is unchanged); new code should import from here so the
 * formats never diverge.
 *
 * Supported clients and their config files:
 *   - claude-code / claude-code-cli → `.mcp.json` (project) or
 *     `~/.claude.json` (user). JSON `mcpServers[name] = entry`.
 *   - cowork                        → `~/.cowork/mcp.json`. Same JSON shape.
 *   - codex                         → `~/.codex/config.toml`.
 *     `[mcp_servers.<name>]` block.
 *
 * Node-only. No new npm deps — hand-rolled JSON merge + minimal TOML block
 * merge, mirroring `mcp.ts`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
export const CLIENTS = [
    "claude-code",
    "claude-code-cli",
    "codex",
    "cowork",
];
/** Build the HTTP MCP server entry for a deployed agent-native app. */
export function buildHttpMcpEntry(mcpUrl, token, headers) {
    const mergedHeaders = {
        ...(headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return {
        type: "http",
        url: mcpUrl,
        ...(Object.keys(mergedHeaders).length ? { headers: mergedHeaders } : {}),
    };
}
// ---------------------------------------------------------------------------
// Config file locations — kept identical to `mcp.ts`.
// ---------------------------------------------------------------------------
/**
 * Cowork consumes MCP exactly like Claude Code (same JSON server-entry
 * shape). Resolved lazily so `os.homedir()` reflects the current `$HOME`.
 */
export function coworkConfigPath() {
    return path.join(os.homedir(), ".cowork", "mcp.json");
}
export function claudeCodeProjectConfig(baseDir) {
    return path.join(baseDir, ".mcp.json");
}
export function claudeCodeUserConfig() {
    return path.join(os.homedir(), ".claude.json");
}
export function codexConfigPath() {
    return path.join(os.homedir(), ".codex", "config.toml");
}
/**
 * Resolve the on-disk config path for a client.
 *
 * `scope` only affects Claude Code / Claude Code CLI: `"user"` → the global
 * `~/.claude.json`, anything else → the project-local `.mcp.json` rooted at
 * `baseDir`.
 */
export function configPathFor(client, baseDir, scope) {
    switch (client) {
        case "claude-code":
        case "claude-code-cli":
            return scope === "user"
                ? claudeCodeUserConfig()
                : claudeCodeProjectConfig(baseDir);
        case "cowork":
            return coworkConfigPath();
        case "codex":
            return codexConfigPath();
    }
}
// ---------------------------------------------------------------------------
// JSON client configs (Claude Code, Claude Code CLI, Cowork)
// ---------------------------------------------------------------------------
function readJsonFile(file) {
    try {
        const raw = fs.readFileSync(file, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    }
    catch {
        return {};
    }
}
/**
 * Idempotently write `mcpServers[name] = entry` into a JSON config file.
 * Pass `entry === null` to delete the named entry. Re-running with the same
 * name replaces the existing entry in place — never duplicates.
 */
export function writeJsonMcpEntry(file, name, entry) {
    const config = readJsonFile(file);
    if (!config.mcpServers || typeof config.mcpServers !== "object") {
        config.mcpServers = {};
    }
    if (entry === null) {
        delete config.mcpServers[name];
    }
    else {
        config.mcpServers[name] = entry;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n", "utf-8");
}
export function hasJsonMcpEntry(file, name) {
    const config = readJsonFile(file);
    return !!config?.mcpServers && name in config.mcpServers;
}
// ---------------------------------------------------------------------------
// Codex TOML (hand-rolled minimal block merge, no new dep)
// ---------------------------------------------------------------------------
function tomlQuote(s) {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
function codexMcpHeader(name) {
    return `[mcp_servers.${tomlQuote(name)}]`;
}
function legacyCodexMcpHeader(name) {
    return /^[A-Za-z0-9_-]+$/.test(name) ? `[mcp_servers.${name}]` : null;
}
/** Build a `[mcp_servers.<name>]` block for an HTTP-type MCP server. */
export function buildCodexHttpBlock(name, mcpUrl, token, headers) {
    const lines = [codexMcpHeader(name)];
    lines.push(`url = ${tomlQuote(mcpUrl)}`);
    const mergedHeaders = {
        ...(headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const headerEntries = Object.entries(mergedHeaders);
    if (headerEntries.length) {
        lines.push(`http_headers = { ${headerEntries
            .map(([key, value]) => `${tomlQuote(key)} = ${tomlQuote(value)}`)
            .join(", ")} }`);
    }
    return lines.join("\n") + "\n";
}
/**
 * Replace (or append) the `[mcp_servers.<name>]` block in a TOML file
 * without disturbing other content. A block is the header line plus every
 * following line until the next top-level `[` table header or EOF. Pass
 * `block === null` to remove the block. Identical algorithm to `mcp.ts`'s
 * `writeCodexBlock` so the two never diverge.
 */
export function writeCodexBlock(file, name, block) {
    let content = "";
    try {
        content = fs.readFileSync(file, "utf-8");
    }
    catch {
        content = "";
    }
    const headers = new Set([codexMcpHeader(name), legacyCodexMcpHeader(name)].filter(Boolean));
    const lines = content.split(/\r?\n/);
    const out = [];
    let i = 0;
    let removed = false;
    while (i < lines.length) {
        const line = lines[i];
        if (headers.has(line.trim())) {
            // Skip this block entirely (header + body until next table header).
            removed = true;
            i++;
            while (i < lines.length && !/^\s*\[/.test(lines[i]))
                i++;
            continue;
        }
        out.push(line);
        i++;
    }
    let next = out
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\n*$/, "\n");
    if (block !== null) {
        next = next.replace(/\n*$/, "\n");
        if (next.trim().length)
            next += "\n";
        next += block;
    }
    if (block === null && !removed)
        return; // nothing to do
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, next, "utf-8");
}
export function codexHasBlock(file, name) {
    try {
        const content = fs.readFileSync(file, "utf-8");
        const headers = new Set([codexMcpHeader(name), legacyCodexMcpHeader(name)].filter(Boolean));
        return content.split(/\r?\n/).some((line) => headers.has(line.trim()));
    }
    catch {
        return false;
    }
}
// ---------------------------------------------------------------------------
// Unified write helper
// ---------------------------------------------------------------------------
/**
 * Idempotently write the HTTP MCP server entry for `serverName` into the
 * given client's config file and return the file path that was written.
 * Re-running replaces the same named entry — never duplicates.
 */
export function writeHttpEntryForClient(client, serverName, mcpUrl, token, baseDir, scope, headers) {
    const file = configPathFor(client, baseDir, scope);
    if (client === "codex") {
        writeCodexBlock(file, serverName, buildCodexHttpBlock(serverName, mcpUrl, token, headers));
    }
    else {
        writeJsonMcpEntry(file, serverName, buildHttpMcpEntry(mcpUrl, token, headers));
    }
    return file;
}
//# sourceMappingURL=mcp-config-writers.js.map