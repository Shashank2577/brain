/**
 * BuilderEngine — HTTP client for the Builder.io managed LLM gateway.
 *
 * The gateway accepts an Anthropic-shaped request body and streams events as
 * JSONL. This engine translates the framework's EngineStreamOptions into the
 * gateway request, parses the streamed events into EngineEvent items, and
 * maps gateway error responses (402 quota, 403 disabled, 401 auth, 429
 * concurrency) into structured stop events that carry an upgrade URL when
 * the chat UI needs to prompt the user to upgrade.
 *
 * Credentials come from BUILDER_PRIVATE_KEY + BUILDER_PUBLIC_KEY (set via the
 * Builder CLI-auth onboarding flow). Base URL is overridable via
 * BUILDER_GATEWAY_BASE_URL.
 */
import type { AgentEngine, EngineCapabilities } from "./types.js";
export declare const BUILDER_CAPABILITIES: EngineCapabilities;
export declare const BUILDER_SUPPORTED_MODELS: readonly ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5", string, "gpt-5-4", "gpt-5-4-mini", "gpt-5-1-codex-mini", "gemini-3-1-pro", "gemini-3-0-flash", "gemini-3-1-flash-lite", "grok-code-fast", "qwen3-coder", "kimi-k2-5", "deepseek-v3-1", "z-ai-glm-4-5", "z-ai-glm-5-1"];
export declare const BUILDER_DEFAULT_MODEL: "claude-sonnet-4-6";
export declare function createBuilderEngine(_config?: Record<string, unknown>): AgentEngine;
//# sourceMappingURL=builder-engine.d.ts.map