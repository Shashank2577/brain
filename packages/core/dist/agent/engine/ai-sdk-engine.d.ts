/**
 * AISDKEngine — wraps the Vercel AI SDK (ai package) for multi-provider support.
 *
 * Supports Anthropic, OpenAI, Google Gemini, Groq, and any provider with an
 * @ai-sdk/* package. Provider is selected via the `provider` config option.
 *
 * When provider is "anthropic", Anthropic-native features (thinking, cacheControl)
 * are forwarded through the AI SDK's providerOptions mechanism — no fidelity loss
 * compared to the native AnthropicEngine.
 *
 * The ai package is an OPTIONAL peer dependency. This engine uses dynamic import()
 * so the core package remains installable without the AI SDK.
 */
import type { AgentEngine, EngineCapabilities } from "./types.js";
import { type AISDKProvider } from "../model-config.js";
export type { AISDKProvider } from "../model-config.js";
export declare const BEDROCK_CAPABILITIES: EngineCapabilities;
declare const PROVIDER_CAPABILITIES: Record<AISDKProvider, EngineCapabilities>;
declare const PROVIDER_DEFAULT_MODELS: Record<AISDKProvider, string>;
declare const PROVIDER_SUPPORTED_MODELS: Record<AISDKProvider, readonly string[]>;
declare const PROVIDER_ENV_VARS: Record<AISDKProvider, string[]>;
declare const PROVIDER_PACKAGES: Record<AISDKProvider, string>;
/** Config accepted by every `ai-sdk:*` engine. */
export interface AISDKEngineConfig {
    /** Override the provider's default model (also becomes the engine's defaultModel). */
    model?: string;
    /** API key — falls back to the provider-specific env var if omitted. */
    apiKey?: string;
    /** Set false in request-scoped multi-tenant runs so provider packages cannot fall back to process.env. */
    allowEnvFallback?: boolean;
    /** Override the provider base URL (useful for proxies or OpenAI-compatible gateways). */
    baseUrl?: string;
    /** OpenRouter: `X-OpenRouter-Title` header for dashboard attribution. */
    appName?: string;
    /** OpenRouter: `HTTP-Referer` header for dashboard attribution. */
    appUrl?: string;
}
export declare function createAISDKEngine(provider: AISDKProvider, config?: Record<string, unknown>): AgentEngine;
export declare function createBedrockEngine(config?: Record<string, unknown>): AgentEngine;
export { PROVIDER_CAPABILITIES, PROVIDER_DEFAULT_MODELS, PROVIDER_SUPPORTED_MODELS, PROVIDER_ENV_VARS, PROVIDER_PACKAGES, };
//# sourceMappingURL=ai-sdk-engine.d.ts.map