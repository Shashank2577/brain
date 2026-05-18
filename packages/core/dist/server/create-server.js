import { createApp, createRouter, defineEventHandler, getMethod, getRequestHeader, setResponseHeader, setResponseStatus, } from "h3";
import path from "path";
import { agentEnv } from "../shared/agent-env.js";
import { readBody } from "../server/h3-helpers.js";
import { getAllowedCorsOrigin, readCorsAllowedOrigins, } from "./cors-origins.js";
import { isEnvVarWriteAllowed } from "./env-var-writes.js";
/**
 * Parse a .env file into key-value pairs, preserving comments and empty lines for roundtrip.
 */
function parseEnvFile(content) {
    const vars = new Map();
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1)
            continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        // Strip surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        vars.set(key, value);
    }
    return vars;
}
/**
 * Upsert vars into a .env file, preserving existing structure.
 */
export async function upsertEnvFile(envPath, vars) {
    // Sanitize: reject values that could inject additional env vars
    for (const { key, value } of vars) {
        if (/[\n\r\0]/.test(value)) {
            throw new Error(`Invalid env var value for ${key}: must not contain newlines or control characters`);
        }
    }
    const fs = await import("fs");
    let content = "";
    try {
        content = fs.readFileSync(envPath, "utf-8");
    }
    catch {
        // File doesn't exist yet
    }
    const lines = content.split("\n");
    const remaining = new Map(vars.map((v) => [v.key, v.value]));
    // Update existing lines in place
    const updated = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            return line;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1)
            return line;
        const key = trimmed.slice(0, eqIndex).trim();
        if (remaining.has(key)) {
            const value = remaining.get(key);
            remaining.delete(key);
            return `${key}=${value}`;
        }
        return line;
    });
    // Append new vars
    for (const [key, value] of remaining) {
        updated.push(`${key}=${value}`);
    }
    // Ensure trailing newline
    let result = updated.join("\n");
    if (!result.endsWith("\n"))
        result += "\n";
    try {
        fs.mkdirSync(path.dirname(envPath), { recursive: true });
        fs.writeFileSync(envPath, result);
    }
    catch {
        // Edge runtimes don't have writable filesystem — skip silently
    }
}
/**
 * Create a pre-configured H3 app with standard agent-native setup:
 * - CORS headers via middleware
 * - /_agent-native/ping health check
 * - /_agent-native/env-status and /_agent-native/env-vars (when envKeys is provided)
 *
 * Returns { app, router } — mount routes on `router`.
 */
export function createServer(options = {}) {
    const app = createApp({
        onError(error, event) {
            // Suppress connection-reset errors — client disconnected mid-request (tab close, reload)
            const err = error;
            const code = err?.code || err?.cause?.code;
            if (code === "ECONNRESET" || code === "ECONNABORTED")
                return;
            if (err?.message === "aborted")
                return;
            console.error(`[agent-native] Server error: ${event.method} ${event.path}`, error);
        },
    });
    // CORS middleware
    if (options.cors !== false) {
        const allowedOrigins = readCorsAllowedOrigins();
        const isProduction = process.env.NODE_ENV === "production";
        /**
         * When CORS_ALLOWED_ORIGINS is unset, production only allows trusted
         * localhost/native desktop origins. Development keeps the legacy "echo
         * any origin" behavior so local tools and docs previews keep working.
         */
        app.use(defineEventHandler((event) => {
            const requestOrigin = getRequestHeader(event, "origin");
            const method = getMethod(event);
            /**
             * Decide whether the requesting origin is allowed. We never fall back
             * to "the first allowlist entry" when the origin isn't in the list —
             * that previously sent `Access-Control-Allow-Origin: <other-origin>`
             * with credentials enabled to attacker-controlled origins, which was
             * permissive enough that some clients followed through with the
             * credentialed request.
             */
            const allowedOrigin = getAllowedCorsOrigin(requestOrigin, {
                allowedOrigins,
                allowAnyOriginWhenNoAllowlist: !isProduction,
                allowLocalhostWhenNoAllowlist: true,
            });
            // No origin header at all (same-origin fetch, server-to-server) and
            // no allowlist → fall through with `*`-equivalent behaviour: omit
            // ACAO entirely and let the browser apply its same-origin default.
            if (allowedOrigin) {
                setResponseHeader(event, "Access-Control-Allow-Origin", allowedOrigin);
                setResponseHeader(event, "Vary", "Origin");
                // A specific origin means we can honor credentialed requests
                // (fetch with `credentials: "include"` — used by desktop tray
                // apps that share a same-site cookie with the web app). The
                // wildcard `*` is spec-incompatible with credentials, so only
                // set this when we're echoing a concrete origin.
                setResponseHeader(event, "Access-Control-Allow-Credentials", "true");
            }
            else if (!requestOrigin) {
                // No origin header — preserve the legacy permissive behaviour for
                // tools/scripts that hit the API directly (no credentialed CORS
                // semantics apply when there's no Origin).
                setResponseHeader(event, "Access-Control-Allow-Origin", "*");
            }
            setResponseHeader(event, "Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
            setResponseHeader(event, "Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,X-Request-Source,X-Agent-Native-CSRF");
            if (method === "OPTIONS") {
                // Reject preflights from disallowed cross-origin callers. We only
                // 204 if either (a) there was no Origin header (same-origin or
                // direct script invocation) or (b) the origin was in the allowlist
                // / dev fallback above. Otherwise we 403 so the browser surfaces
                // a hard CORS failure rather than blindly retrying with credentials.
                if (requestOrigin && !allowedOrigin) {
                    return new Response(null, { status: 403 });
                }
                return new Response(null, { status: 204 });
            }
        }));
    }
    const router = createRouter();
    app.use(router);
    // Health check
    if (!options.disablePing) {
        router.get("/_agent-native/ping", defineEventHandler(() => {
            const message = options.pingMessage ?? process.env.PING_MESSAGE ?? "pong";
            return { message };
        }));
    }
    // Env key management routes
    if (options.envKeys) {
        const envKeys = options.envKeys;
        router.get("/_agent-native/env-status", defineEventHandler(() => {
            return envKeys.map((cfg) => ({
                key: cfg.key,
                label: cfg.label,
                required: cfg.required ?? false,
                configured: !!process.env[cfg.key],
                ...(cfg.helpText ? { helpText: cfg.helpText } : {}),
            }));
        }));
        router.post("/_agent-native/env-vars", defineEventHandler(async (event) => {
            // Env vars are deployment-wide globals — see isEnvVarWriteAllowed
            // above. Disable the endpoint on any multi-tenant deploy.
            if (!isEnvVarWriteAllowed()) {
                setResponseStatus(event, 403);
                return {
                    error: "env-vars endpoint disabled on multi-tenant deployments. Use saveCredential(key, value, { userEmail, orgId, scope: 'org' }) to store per-org credentials.",
                };
            }
            const body = await readBody(event);
            const { vars } = body;
            if (!Array.isArray(vars) || vars.length === 0) {
                setResponseStatus(event, 400);
                return { error: "vars array required" };
            }
            // Only allow keys that are in the env config
            const allowedKeys = new Set(envKeys.map((k) => k.key));
            const filtered = vars.filter((v) => allowedKeys.has(v.key));
            if (filtered.length === 0) {
                setResponseStatus(event, 400);
                return { error: "No recognized env keys in request" };
            }
            // Write to .env file
            const envPath = path.join(process.cwd(), ".env");
            await upsertEnvFile(envPath, filtered);
            // Update process.env so the app picks up the new values immediately
            for (const { key, value } of filtered) {
                process.env[key] = value;
            }
            // Notify parent (Builder or frame) via postMessage
            agentEnv.setVars(filtered);
            return { saved: filtered.map((v) => v.key) };
        }));
    }
    return { app, router };
}
//# sourceMappingURL=create-server.js.map