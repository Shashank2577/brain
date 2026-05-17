/**
 * Central model catalog for built-in agent engines.
 *
 * To bump the framework's managed default, update
 * FRAMEWORK_DEFAULT_OPENAI_MODEL. Builder gateway and OpenRouter IDs are
 * derived from that provider-native OpenAI ID so the usual default bump stays
 * in this one file.
 */

const ANTHROPIC_DEFAULT_MODEL_ID = "claude-sonnet-4-6";

function builderGatewayModelId(model: string): string {
  return model.replace(/\./g, "-");
}

function openRouterModelId(provider: string, model: string): string {
  return `${provider}/${model}`;
}

const FRAMEWORK_DEFAULT_OPENAI_MODEL = "gpt-5.5";
const FRAMEWORK_DEFAULT_BUILDER_MODEL = ANTHROPIC_DEFAULT_MODEL_ID;
const FRAMEWORK_DEFAULT_BUILDER_OPENAI_MODEL = builderGatewayModelId(
  FRAMEWORK_DEFAULT_OPENAI_MODEL,
);
const FRAMEWORK_DEFAULT_OPENROUTER_MODEL = openRouterModelId(
  "openai",
  FRAMEWORK_DEFAULT_OPENAI_MODEL,
);

export const AGENT_MODEL_CONFIG = {
  builder: {
    defaultModel: FRAMEWORK_DEFAULT_BUILDER_MODEL,
    supportedModels: [
      "claude-opus-4-7",
      FRAMEWORK_DEFAULT_BUILDER_MODEL,
      "claude-haiku-4-5",
      FRAMEWORK_DEFAULT_BUILDER_OPENAI_MODEL,
      "gpt-5-4",
      "gpt-5-4-mini",
      "gpt-5-1-codex-mini",
      "gemini-3-1-pro",
      "gemini-3-0-flash",
      "gemini-3-1-flash-lite",
      "grok-code-fast",
      "qwen3-coder",
      "kimi-k2-5",
      "deepseek-v3-1",
      "z-ai-glm-4-5",
      "z-ai-glm-5-1",
    ],
  },
  anthropic: {
    defaultModel: ANTHROPIC_DEFAULT_MODEL_ID,
    supportedModels: [
      "claude-opus-4-7",
      ANTHROPIC_DEFAULT_MODEL_ID,
      "claude-haiku-4-5-20251001",
    ],
  },
  aiSdk: {
    anthropic: {
      defaultModel: ANTHROPIC_DEFAULT_MODEL_ID,
      supportedModels: [
        "claude-opus-4-7",
        ANTHROPIC_DEFAULT_MODEL_ID,
        "claude-haiku-4-5-20251001",
      ],
    },
    openai: {
      defaultModel: FRAMEWORK_DEFAULT_OPENAI_MODEL,
      supportedModels: [
        FRAMEWORK_DEFAULT_OPENAI_MODEL,
        "gpt-5.4",
        "gpt-5.4-mini",
      ],
    },
    openrouter: {
      defaultModel: FRAMEWORK_DEFAULT_OPENROUTER_MODEL,
      supportedModels: [
        "anthropic/claude-opus-4.7",
        "anthropic/claude-sonnet-4.6",
        FRAMEWORK_DEFAULT_OPENROUTER_MODEL,
        "openai/gpt-5.4",
        "google/gemini-2.5-flash",
      ],
    },
    google: {
      defaultModel: "gemini-3-flash-preview",
      supportedModels: ["gemini-3-flash-preview", "gemini-3.1-pro-preview"],
    },
    groq: {
      defaultModel: "llama-3.3-70b-versatile",
      supportedModels: [
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "mixtral-8x7b-32768",
      ],
    },
    mistral: {
      defaultModel: "mistral-large-latest",
      supportedModels: [
        "mistral-large-latest",
        "mistral-medium-latest",
        "mistral-small-latest",
      ],
    },
    cohere: {
      defaultModel: "command-r-plus",
      supportedModels: ["command-r-plus", "command-r"],
    },
    ollama: {
      defaultModel: "llama3.1",
      supportedModels: ["llama3.1", "llama3.2", "mistral", "codestral"],
    },
  },
} as const;

export const BUILDER_MODEL_CONFIG = AGENT_MODEL_CONFIG.builder;
export const ANTHROPIC_MODEL_CONFIG = AGENT_MODEL_CONFIG.anthropic;
export const AI_SDK_MODEL_CONFIG = AGENT_MODEL_CONFIG.aiSdk;

// Bedrock cross-region inference profile IDs.
// Use the region-prefix variant that matches your AWS_REGION:
//   us.*  → AWS_REGION=us-east-1 / us-west-2
//   apac.* → AWS_REGION=ap-south-1 / ap-southeast-1 / ap-northeast-1
//   eu.*  → AWS_REGION=eu-central-1 / eu-west-1
// Direct model IDs (no prefix) require on-demand throughput provisioning.
// Defaults here use apac.* because that matches the configured AWS_REGION.
export const BEDROCK_MODEL_CONFIG = {
  defaultModel: "apac.anthropic.claude-sonnet-4-20250514-v1:0",
  supportedModels: [
    "apac.anthropic.claude-sonnet-4-20250514-v1:0",
    "apac.anthropic.claude-3-7-sonnet-20250219-v1:0",
    "apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
    "apac.anthropic.claude-3-5-sonnet-20240620-v1:0",
    "apac.anthropic.claude-3-sonnet-20240229-v1:0",
    "apac.anthropic.claude-3-haiku-20240307-v1:0",
  ],
} as const;

export type AISDKProvider = keyof typeof AI_SDK_MODEL_CONFIG;

export const DEFAULT_MODEL = BUILDER_MODEL_CONFIG.defaultModel;
export const DEFAULT_OPENAI_MODEL = AI_SDK_MODEL_CONFIG.openai.defaultModel;
export const DEFAULT_ANTHROPIC_MODEL = ANTHROPIC_MODEL_CONFIG.defaultModel;
