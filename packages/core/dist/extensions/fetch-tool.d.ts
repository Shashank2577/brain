/**
 * Fetch tool — outbound HTTP for automations and agent use.
 *
 * NOTE: this is an *agent* tool (LLM function call), not an *extension* (the
 * sandboxed Alpine.js mini-app primitive). It lives in this directory because
 * it shares SSRF-safe URL/proxy helpers with the extension iframe proxy.
 *
 * Supports ${keys.NAME} reference substitution in URL, headers, and body.
 * Values are resolved server-side AFTER the model emits the tool call —
 * the raw secret never enters the model's context.
 */
import type { ActionEntry } from "../agent/production-agent.js";
export interface FetchToolOptions {
    /** Resolve ${keys.NAME} references. Injected by the plugin at setup time. */
    resolveKeys?: (text: string) => Promise<{
        resolved: string;
        usedKeys: string[];
        secretValues?: string[];
    }>;
    /** Validate URL against per-key allowlists. */
    validateUrl?: (url: string, usedKeys: string[]) => Promise<boolean>;
}
/**
 * Create the fetch tool entry for the agent tool registry.
 */
export declare function createFetchToolEntry(opts?: FetchToolOptions): Record<string, ActionEntry>;
//# sourceMappingURL=fetch-tool.d.ts.map