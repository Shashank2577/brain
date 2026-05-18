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
import { engineToolsToAISDK, engineMessagesToAISDK, aiSdkPartToEngineEvents, aiSdkStepToAssistantContent, } from "./translate-ai-sdk.js";
import { AI_SDK_MODEL_CONFIG, BEDROCK_MODEL_CONFIG, } from "../model-config.js";
import { readDeployCredentialEnv } from "../../server/credential-provider.js";
import { normalizeReasoningEffortForModel } from "../../shared/reasoning-effort.js";
// ---------------------------------------------------------------------------
// Provider definitions
// ---------------------------------------------------------------------------
export const BEDROCK_CAPABILITIES = {
    thinking: true,
    promptCaching: false,
    vision: true,
    computerUse: false,
    parallelToolCalls: true,
};
const PROVIDER_CAPABILITIES = {
    anthropic: {
        thinking: true,
        promptCaching: true,
        vision: true,
        computerUse: false, // not exposed through AI SDK yet
        parallelToolCalls: true,
    },
    openai: {
        thinking: true,
        promptCaching: false,
        vision: true,
        computerUse: false,
        parallelToolCalls: true,
    },
    openrouter: {
        thinking: true,
        promptCaching: true,
        vision: true,
        computerUse: false,
        parallelToolCalls: true,
    },
    google: {
        thinking: true,
        promptCaching: false,
        vision: true,
        computerUse: false,
        parallelToolCalls: true,
    },
    groq: {
        thinking: false,
        promptCaching: false,
        vision: false,
        computerUse: false,
        parallelToolCalls: true,
    },
    mistral: {
        thinking: false,
        promptCaching: false,
        vision: false,
        computerUse: false,
        parallelToolCalls: true,
    },
    cohere: {
        thinking: false,
        promptCaching: false,
        vision: false,
        computerUse: false,
        parallelToolCalls: true,
    },
    ollama: {
        thinking: false,
        promptCaching: false,
        vision: false,
        computerUse: false,
        parallelToolCalls: false,
    },
};
const providerModelEntries = Object.entries(AI_SDK_MODEL_CONFIG);
const PROVIDER_DEFAULT_MODELS = Object.fromEntries(providerModelEntries.map(([provider, config]) => [
    provider,
    config.defaultModel,
]));
const PROVIDER_SUPPORTED_MODELS = Object.fromEntries(providerModelEntries.map(([provider, config]) => [
    provider,
    config.supportedModels,
]));
const PROVIDER_ENV_VARS = {
    anthropic: ["ANTHROPIC_API_KEY"],
    openai: ["OPENAI_API_KEY"],
    openrouter: ["OPENROUTER_API_KEY"],
    google: ["GOOGLE_GENERATIVE_AI_API_KEY"],
    groq: ["GROQ_API_KEY"],
    mistral: ["MISTRAL_API_KEY"],
    cohere: ["COHERE_API_KEY"],
    ollama: [], // runs locally
};
const PROVIDER_PACKAGES = {
    anthropic: "@ai-sdk/anthropic",
    openai: "@ai-sdk/openai",
    openrouter: "@openrouter/ai-sdk-provider",
    google: "@ai-sdk/google",
    groq: "@ai-sdk/groq",
    mistral: "@ai-sdk/mistral",
    cohere: "@ai-sdk/cohere",
    ollama: "ai-sdk-ollama",
};
/** Factory export name per provider (not all follow `create<Provider>`). */
const PROVIDER_FACTORIES = {
    anthropic: "createAnthropic",
    openai: "createOpenAI",
    openrouter: "createOpenRouter",
    google: "createGoogleGenerativeAI",
    groq: "createGroq",
    mistral: "createMistral",
    cohere: "createCohere",
    ollama: "createOllama",
};
function googleThinkingBudget(effort) {
    if (effort === "low")
        return 1024;
    if (effort === "high")
        return 8000;
    if (effort === "xhigh")
        return 16_000;
    if (effort === "max")
        return 32_000;
    return -1;
}
class AISDKEngine {
    name;
    label;
    defaultModel;
    supportedModels;
    capabilities;
    provider;
    apiKey;
    baseUrl;
    appName;
    appUrl;
    constructor(provider, config) {
        this.provider = provider;
        this.name = `ai-sdk:${provider}`;
        this.label = `${capitalize(provider)} (AI SDK)`;
        this.defaultModel = config.model ?? PROVIDER_DEFAULT_MODELS[provider];
        this.supportedModels = PROVIDER_SUPPORTED_MODELS[provider];
        this.capabilities = PROVIDER_CAPABILITIES[provider];
        this.apiKey =
            config.apiKey ??
                (config.allowEnvFallback === false ? "" : getProviderApiKey(provider));
        this.baseUrl = config.baseUrl;
        this.appName = config.appName;
        this.appUrl = config.appUrl;
    }
    async *stream(opts) {
        let aiModule;
        try {
            aiModule = await import("ai");
        }
        catch {
            yield {
                type: "stop",
                reason: "error",
                error: `The "ai" package is not installed. Run: pnpm add ai ${PROVIDER_PACKAGES[this.provider]}`,
            };
            return;
        }
        const { streamText, jsonSchema } = aiModule;
        let providerModel;
        try {
            providerModel = await this.createProviderModel(opts.model);
        }
        catch (err) {
            yield {
                type: "stop",
                reason: "error",
                error: err?.message ?? String(err),
            };
            return;
        }
        const aiSdkTools = opts.tools.length > 0
            ? engineToolsToAISDK(opts.tools, jsonSchema)
            : undefined;
        const messages = engineMessagesToAISDK(opts.messages);
        // Build providerOptions for Anthropic-native features when using Anthropic provider
        const providerOpts = {};
        if (this.provider === "anthropic" && opts.providerOptions?.anthropic) {
            const anthropicOpts = opts.providerOptions.anthropic;
            if (anthropicOpts.thinking) {
                providerOpts.anthropic = {
                    ...(providerOpts.anthropic ?? {}),
                    thinking: {
                        type: "enabled",
                        budgetTokens: anthropicOpts.thinking.budgetTokens,
                    },
                };
            }
            if (anthropicOpts.cacheControl) {
                providerOpts.anthropic = {
                    ...(providerOpts.anthropic ?? {}),
                    cacheControl: anthropicOpts.cacheControl,
                };
            }
        }
        const reasoningEffort = normalizeReasoningEffortForModel(opts.model, opts.reasoningEffort);
        if (reasoningEffort) {
            if (this.provider === "anthropic") {
                providerOpts.anthropic = {
                    ...(providerOpts.anthropic ?? {}),
                    thinking: providerOpts.anthropic?.thinking ?? { type: "adaptive" },
                    outputConfig: { effort: reasoningEffort },
                };
            }
            else if (this.provider === "openai") {
                providerOpts.openai = {
                    ...(providerOpts.openai ?? {}),
                    reasoningEffort,
                };
            }
            else if (this.provider === "openrouter") {
                providerOpts.openrouter = {
                    ...(providerOpts.openrouter ?? {}),
                    reasoning: { effort: reasoningEffort },
                };
            }
            else if (this.provider === "google") {
                providerOpts.google = {
                    ...(providerOpts.google ?? {}),
                    thinkingConfig: {
                        thinkingBudget: googleThinkingBudget(reasoningEffort),
                    },
                };
            }
        }
        let assistantContent = [];
        try {
            const result = streamText({
                model: providerModel,
                system: opts.systemPrompt,
                messages,
                tools: aiSdkTools,
                maxOutputTokens: opts.maxOutputTokens ?? 32768,
                ...(opts.temperature !== undefined
                    ? { temperature: opts.temperature }
                    : {}),
                abortSignal: opts.abortSignal,
                onStepFinish: (step) => {
                    assistantContent = aiSdkStepToAssistantContent(step);
                },
                ...(Object.keys(providerOpts).length > 0
                    ? { providerOptions: providerOpts }
                    : {}),
            });
            // Buffer the terminal stop so assistant-content can be emitted just
            // before it, regardless of where `finish` arrives in the stream.
            let bufferedStop;
            for await (const part of result.fullStream) {
                for (const event of aiSdkPartToEngineEvents(part)) {
                    if (event.type === "stop") {
                        bufferedStop = event;
                    }
                    else {
                        yield event;
                    }
                }
            }
            yield { type: "assistant-content", parts: assistantContent };
            yield bufferedStop ?? { type: "stop", reason: "end_turn" };
        }
        catch (err) {
            yield {
                type: "stop",
                reason: "error",
                error: err?.message ?? String(err),
            };
            throw err;
        }
    }
    async createProviderModel(model) {
        const pkg = PROVIDER_PACKAGES[this.provider];
        let providerModule;
        try {
            providerModule = await importProviderPackage(this.provider);
        }
        catch {
            throw new Error(`Provider package "${pkg}" is not installed. Run: pnpm add ai ${pkg}`);
        }
        const fnName = PROVIDER_FACTORIES[this.provider];
        const createFn = providerModule[fnName] ?? providerModule.default;
        if (typeof createFn !== "function") {
            throw new Error(`"${pkg}" does not export ${fnName} or default`);
        }
        const config = {};
        if (this.apiKey !== undefined)
            config.apiKey = this.apiKey;
        if (this.baseUrl)
            config.baseURL = this.baseUrl;
        // Scoped to openrouter — other providers' factories may reject unknown keys.
        if (this.provider === "openrouter") {
            if (this.appName)
                config.appName = this.appName;
            if (this.appUrl)
                config.appUrl = this.appUrl;
        }
        const provider = createFn(config);
        // Let first-party OpenAI use the AI SDK's default Responses path so newer
        // GPT reasoning models get the API OpenAI recommends. If someone points
        // the OpenAI provider at an OpenAI-compatible gateway, keep using Chat
        // Completions because many gateway base URLs do not implement Responses.
        return this.provider === "openai" && this.baseUrl
            ? provider.chat(model)
            : provider(model);
    }
}
// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------
export function createAISDKEngine(provider, config = {}) {
    return new AISDKEngine(provider, config);
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Static string-literal imports so bundlers (Nitro/Rollup/Vercel) can analyze
// and include provider packages. A variable-based `import(pkg)` gets skipped.
async function importProviderPackage(provider) {
    switch (provider) {
        case "anthropic":
            return import("@ai-sdk/anthropic");
        case "openai":
            return import("@ai-sdk/openai");
        case "openrouter":
            return import("@openrouter/ai-sdk-provider");
        case "google":
            return import("@ai-sdk/google");
        case "groq":
            return import("@ai-sdk/groq");
        case "mistral":
            return import("@ai-sdk/mistral");
        case "cohere":
            return import("@ai-sdk/cohere");
        case "ollama":
            return import("ai-sdk-ollama");
    }
}
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function getProviderApiKey(provider) {
    const envVars = PROVIDER_ENV_VARS[provider];
    for (const v of envVars) {
        const value = readDeployCredentialEnv(v);
        if (value)
            return value;
    }
    return undefined;
}
// ---------------------------------------------------------------------------
// BedrockEngine — AWS Bedrock via @ai-sdk/amazon-bedrock
// ---------------------------------------------------------------------------
class BedrockEngine {
    name = "ai-sdk:bedrock";
    label = "Claude on AWS Bedrock";
    defaultModel = BEDROCK_MODEL_CONFIG.defaultModel;
    supportedModels = BEDROCK_MODEL_CONFIG.supportedModels;
    capabilities = BEDROCK_CAPABILITIES;
    region;
    accessKeyId;
    secretAccessKey;
    constructor(config) {
        // Read from BEDROCK_* names first (Netlify-safe), fall back to AWS_* (local dev / EC2)
        this.region =
            config.region ??
                readDeployCredentialEnv("BEDROCK_REGION") ??
                readDeployCredentialEnv("AWS_REGION") ??
                "us-east-1";
        this.accessKeyId =
            config.accessKeyId ??
                readDeployCredentialEnv("BEDROCK_ACCESS_KEY_ID") ??
                readDeployCredentialEnv("AWS_ACCESS_KEY_ID");
        this.secretAccessKey =
            config.secretAccessKey ??
                readDeployCredentialEnv("BEDROCK_SECRET_ACCESS_KEY") ??
                readDeployCredentialEnv("AWS_SECRET_ACCESS_KEY");
    }
    async *stream(opts) {
        let aiModule;
        try {
            aiModule = await import("ai");
        }
        catch {
            yield {
                type: "stop",
                reason: "error",
                error: 'The "ai" package is not installed. Run: pnpm add ai @ai-sdk/amazon-bedrock',
            };
            return;
        }
        let bedrockModule;
        try {
            bedrockModule = await import("@ai-sdk/amazon-bedrock");
        }
        catch {
            yield {
                type: "stop",
                reason: "error",
                error: 'The "@ai-sdk/amazon-bedrock" package is not installed. Run: pnpm add @ai-sdk/amazon-bedrock',
            };
            return;
        }
        const { streamText, jsonSchema } = aiModule;
        const { createAmazonBedrock } = bedrockModule;
        const bedrock = createAmazonBedrock({
            region: this.region,
            ...(this.accessKeyId && this.secretAccessKey
                ? {
                    accessKeyId: this.accessKeyId,
                    secretAccessKey: this.secretAccessKey,
                }
                : {}),
        });
        const providerModel = bedrock(opts.model);
        const aiSdkTools = opts.tools.length > 0 ? engineToolsToAISDK(opts.tools, jsonSchema) : undefined;
        const messages = engineMessagesToAISDK(opts.messages);
        let assistantContent = [];
        try {
            const result = streamText({
                model: providerModel,
                system: opts.systemPrompt,
                messages,
                tools: aiSdkTools,
                maxOutputTokens: opts.maxOutputTokens ?? 32768,
                ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
                abortSignal: opts.abortSignal,
                onStepFinish: (step) => {
                    assistantContent = aiSdkStepToAssistantContent(step);
                },
            });
            let bufferedStop;
            for await (const part of result.fullStream) {
                for (const event of aiSdkPartToEngineEvents(part)) {
                    if (event.type === "stop") {
                        bufferedStop = event;
                    }
                    else {
                        yield event;
                    }
                }
            }
            yield { type: "assistant-content", parts: assistantContent };
            yield bufferedStop ?? { type: "stop", reason: "end_turn" };
        }
        catch (err) {
            yield {
                type: "stop",
                reason: "error",
                error: err?.message ?? String(err),
            };
            throw err;
        }
    }
}
export function createBedrockEngine(config = {}) {
    return new BedrockEngine(config);
}
// ---------------------------------------------------------------------------
// Exports for registry registration
// ---------------------------------------------------------------------------
export { PROVIDER_CAPABILITIES, PROVIDER_DEFAULT_MODELS, PROVIDER_SUPPORTED_MODELS, PROVIDER_ENV_VARS, PROVIDER_PACKAGES, };
//# sourceMappingURL=ai-sdk-engine.js.map