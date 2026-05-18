/**
 * Agent Engine Registry.
 *
 * Mirrors the CLI_REGISTRY pattern (packages/core/src/terminal/cli-registry.ts)
 * but is open — anyone can register a custom engine via registerAgentEngine()
 * from a server plugin at startup.
 *
 * Built-in engines (anthropic, ai-sdk) are auto-registered by builtin.ts.
 */
import type { AgentEngine, EngineCapabilities } from "./types.js";
export interface AgentEngineEntry {
    /** Unique name, e.g. "anthropic", "ai-sdk:anthropic", "ai-sdk:openai" */
    name: string;
    /** Human-readable label for UI */
    label: string;
    /** Short description for engine picker */
    description: string;
    /** npm package hint displayed in UI when package is missing */
    installPackage?: string;
    /** Engine capabilities */
    capabilities: EngineCapabilities;
    /** Default model string */
    defaultModel: string;
    /** All supported models (shown in model picker) */
    supportedModels: readonly string[];
    /** Environment variables required for this engine to work */
    requiredEnvVars: string[];
    /** Create an engine instance from config */
    create(config: Record<string, unknown>): AgentEngine;
}
/**
 * Register a custom agent engine. Called at server startup (e.g., from a
 * server plugin or builtin.ts). Throws if name is already registered.
 */
export declare function registerAgentEngine(entry: AgentEngineEntry): void;
/** Get a registered engine entry by name, or undefined if not found */
export declare function getAgentEngineEntry(name: string): AgentEngineEntry | undefined;
/** List all registered engine entries */
export declare function listAgentEngines(): AgentEngineEntry[];
/**
 * First registered engine whose requiredEnvVars are all set. Registration
 * order controls priority — the Builder gateway is registered first so it
 * wins when the Builder private key is present.
 *
 * Escape hatch: AGENT_ENGINE_PREFER_BYO_KEY=true skips the Builder engine
 * on the first pass, so an explicit provider key (ANTHROPIC_API_KEY etc.)
 * is picked instead. Builder is still used as the fallback when no other
 * provider key is set.
 */
export declare function detectEngineFromEnv(): AgentEngineEntry | null;
/**
 * Detect a usable engine from the current request user's accessible
 * `app_secrets` rows. Mirrors `detectEngineFromEnv` but consults the
 * encrypted secret store instead of `process.env`, including org-scoped
 * credentials shared with the active organization.
 *
 * Required because the Builder OAuth callback (and the settings UI's
 * "paste your own key" flow) writes credentials to app_secrets, not env.
 * Without this check, a user who connected Builder would see status
 * "configured" but the next chat turn would fall through to the default
 * Anthropic engine and hit `missing_api_key` — exactly Brent's symptom
 * on the docs site (Loom 2026-04-28: "It doesn't seem to realize I'm
 * connected once I do a chat").
 *
 * Includes the local dev session (`local@localhost`): the Builder
 * OAuth flow writes credentials scoped to that email when run from
 * `pnpm dev`, so detection has to consult those rows or the dev user
 * sees the same "Connect your AI" card after they've already connected
 * (Sami, 2026-04-30). Org-scoped Builder credentials must also count here:
 * `/builder/status` resolves them via the same request org context, and the
 * chat engine picker must not disagree with that card.
 */
export declare function detectEngineFromUserSecrets(): Promise<AgentEngineEntry | null>;
/**
 * Legacy inline API keys on the global `agent-engine` settings row are
 * intentionally ignored. That row is deployment-wide, so treating
 * `{ apiKey }` or `{ config: { apiKey } }` as configured would let one
 * user's pasted key power every other user. Per-user keys live in
 * `app_secrets` and are resolved separately.
 */
export declare function isAgentEngineSettingConfigured(stored: unknown): boolean;
/**
 * True when the stored `agent-engine` row points at a registered engine
 * AND an API key for it is reachable via the engine's required env vars.
 * Inline keys on the global settings row are ignored; see
 * `isAgentEngineSettingConfigured`.
 */
export declare function isStoredEngineUsable(stored: unknown, entry: AgentEngineEntry): boolean;
/**
 * Request-aware version of `isStoredEngineUsable`.
 *
 * The settings row stores the selected engine/model, while credentials may
 * live in per-user/org `app_secrets`. The sync helper intentionally only sees
 * deploy env vars; this async helper is what request-time routes should use
 * when deciding whether a stored engine can actually run for the current user.
 */
export declare function isStoredEngineUsableForRequest(stored: unknown, entry: AgentEngineEntry): Promise<boolean>;
export interface ResolveEngineConfig {
    /** Explicit engine name or instance from createAgentChatPlugin options */
    engineOption?: string | AgentEngine | {
        name: string;
        config: Record<string, unknown>;
    };
    /** API key (used as config for the resolved engine) */
    apiKey?: string;
    /** Model override (used as part of engine config) */
    model?: string;
}
/**
 * Resolve an AgentEngine from options → explicit env → request credentials →
 * settings → env → default.
 *
 * Resolution order:
 * 1. Explicit `engineOption` from plugin options (string name, instance, or {name, config})
 * 2. Env var AGENT_ENGINE
 * 3. Current request's app_secrets; Builder wins by default when connected
 * 4. Settings store key "agent-engine" → { engine: string }, when usable
 * 5. Auto-detect deployment env credentials
 * 6. Default "anthropic" (requires ANTHROPIC_API_KEY)
 */
export declare function resolveEngine(config: ResolveEngineConfig): Promise<AgentEngine>;
/**
 * Read the user-selected model for an engine from the `agent-engine` setting.
 *
 * The settings UI writes `{engine, model}` via the `manage-agent-engine` action="set",
 * but `resolveEngine` only uses the stored engine (the model is a separate
 * per-request concern). Call this helper alongside `resolveEngine` to honor
 * the user's model choice without requiring a process restart.
 *
 * Returns the stored model only when the stored engine name matches `engine`
 * — otherwise returns `undefined` to avoid applying an Anthropic model string
 * to, say, an OpenRouter engine.
 */
export declare function getStoredModelForEngine(engine: AgentEngine | string): Promise<string | undefined>;
//# sourceMappingURL=registry.d.ts.map