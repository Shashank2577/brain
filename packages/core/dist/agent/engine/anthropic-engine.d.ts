/**
 * AnthropicEngine — wraps @anthropic-ai/sdk for use as an AgentEngine.
 *
 * This is the default, best-in-class engine. It supports all Anthropic-native
 * features: extended thinking, prompt caching, vision, computer use, and
 * parallel tool calls.
 *
 * All providerOptions.anthropic fields are forwarded directly to the SDK.
 */
import type { AgentEngine, EngineCapabilities } from "./types.js";
export declare const ANTHROPIC_CAPABILITIES: EngineCapabilities;
export declare const ANTHROPIC_SUPPORTED_MODELS: readonly ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"];
export declare const ANTHROPIC_DEFAULT_MODEL: "claude-sonnet-4-6";
/**
 * Create an AnthropicEngine instance.
 * Falls back to the deployment Anthropic key if no key is provided.
 */
export declare function createAnthropicEngine(config?: Record<string, unknown>): AgentEngine;
//# sourceMappingURL=anthropic-engine.d.ts.map