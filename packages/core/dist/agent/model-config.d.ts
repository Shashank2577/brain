/**
 * Central model catalog for built-in agent engines.
 *
 * To bump the framework's managed default, update
 * FRAMEWORK_DEFAULT_OPENAI_MODEL. Builder gateway and OpenRouter IDs are
 * derived from that provider-native OpenAI ID so the usual default bump stays
 * in this one file.
 */
export declare const AGENT_MODEL_CONFIG: {
    readonly builder: {
        readonly defaultModel: "claude-sonnet-4-6";
        readonly supportedModels: readonly ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5", string, "gpt-5-4", "gpt-5-4-mini", "gpt-5-1-codex-mini", "gemini-3-1-pro", "gemini-3-0-flash", "gemini-3-1-flash-lite", "grok-code-fast", "qwen3-coder", "kimi-k2-5", "deepseek-v3-1", "z-ai-glm-4-5", "z-ai-glm-5-1"];
    };
    readonly anthropic: {
        readonly defaultModel: "claude-sonnet-4-6";
        readonly supportedModels: readonly ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"];
    };
    readonly aiSdk: {
        readonly anthropic: {
            readonly defaultModel: "claude-sonnet-4-6";
            readonly supportedModels: readonly ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"];
        };
        readonly openai: {
            readonly defaultModel: "gpt-5.5";
            readonly supportedModels: readonly ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini"];
        };
        readonly openrouter: {
            readonly defaultModel: string;
            readonly supportedModels: readonly ["anthropic/claude-opus-4.7", "anthropic/claude-sonnet-4.6", string, "openai/gpt-5.4", "google/gemini-2.5-flash"];
        };
        readonly google: {
            readonly defaultModel: "gemini-3-flash-preview";
            readonly supportedModels: readonly ["gemini-3-flash-preview", "gemini-3.1-pro-preview"];
        };
        readonly groq: {
            readonly defaultModel: "llama-3.3-70b-versatile";
            readonly supportedModels: readonly ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"];
        };
        readonly mistral: {
            readonly defaultModel: "mistral-large-latest";
            readonly supportedModels: readonly ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"];
        };
        readonly cohere: {
            readonly defaultModel: "command-r-plus";
            readonly supportedModels: readonly ["command-r-plus", "command-r"];
        };
        readonly ollama: {
            readonly defaultModel: "llama3.1";
            readonly supportedModels: readonly ["llama3.1", "llama3.2", "mistral", "codestral"];
        };
    };
};
export declare const BUILDER_MODEL_CONFIG: {
    readonly defaultModel: "claude-sonnet-4-6";
    readonly supportedModels: readonly ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5", string, "gpt-5-4", "gpt-5-4-mini", "gpt-5-1-codex-mini", "gemini-3-1-pro", "gemini-3-0-flash", "gemini-3-1-flash-lite", "grok-code-fast", "qwen3-coder", "kimi-k2-5", "deepseek-v3-1", "z-ai-glm-4-5", "z-ai-glm-5-1"];
};
export declare const ANTHROPIC_MODEL_CONFIG: {
    readonly defaultModel: "claude-sonnet-4-6";
    readonly supportedModels: readonly ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"];
};
export declare const AI_SDK_MODEL_CONFIG: {
    readonly anthropic: {
        readonly defaultModel: "claude-sonnet-4-6";
        readonly supportedModels: readonly ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"];
    };
    readonly openai: {
        readonly defaultModel: "gpt-5.5";
        readonly supportedModels: readonly ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini"];
    };
    readonly openrouter: {
        readonly defaultModel: string;
        readonly supportedModels: readonly ["anthropic/claude-opus-4.7", "anthropic/claude-sonnet-4.6", string, "openai/gpt-5.4", "google/gemini-2.5-flash"];
    };
    readonly google: {
        readonly defaultModel: "gemini-3-flash-preview";
        readonly supportedModels: readonly ["gemini-3-flash-preview", "gemini-3.1-pro-preview"];
    };
    readonly groq: {
        readonly defaultModel: "llama-3.3-70b-versatile";
        readonly supportedModels: readonly ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"];
    };
    readonly mistral: {
        readonly defaultModel: "mistral-large-latest";
        readonly supportedModels: readonly ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"];
    };
    readonly cohere: {
        readonly defaultModel: "command-r-plus";
        readonly supportedModels: readonly ["command-r-plus", "command-r"];
    };
    readonly ollama: {
        readonly defaultModel: "llama3.1";
        readonly supportedModels: readonly ["llama3.1", "llama3.2", "mistral", "codestral"];
    };
};
export declare const BEDROCK_MODEL_CONFIG: {
    readonly defaultModel: "apac.anthropic.claude-sonnet-4-20250514-v1:0";
    readonly supportedModels: readonly ["apac.anthropic.claude-sonnet-4-20250514-v1:0", "apac.anthropic.claude-3-7-sonnet-20250219-v1:0", "apac.anthropic.claude-3-5-sonnet-20241022-v2:0", "apac.anthropic.claude-3-5-sonnet-20240620-v1:0", "apac.anthropic.claude-3-sonnet-20240229-v1:0", "apac.anthropic.claude-3-haiku-20240307-v1:0"];
};
export type AISDKProvider = keyof typeof AI_SDK_MODEL_CONFIG;
export declare const DEFAULT_MODEL: "claude-sonnet-4-6";
export declare const DEFAULT_OPENAI_MODEL: "gpt-5.5";
export declare const DEFAULT_ANTHROPIC_MODEL: "claude-sonnet-4-6";
//# sourceMappingURL=model-config.d.ts.map