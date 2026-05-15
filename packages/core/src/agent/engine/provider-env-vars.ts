/**
 * Single source of truth for every built-in LLM provider's env var name and
 * UI metadata. Imported by both server and client code — keep it free of
 * runtime imports so it stays tree-shakeable into the browser bundle.
 *
 * Add a new provider here when adding it to builtin.ts; all three UI gates
 * (AssistantChat composer, settings env-var list, settings key form) pick
 * it up automatically.
 */

export interface ProviderEnvMeta {
  envVar: string;
  /** Shown next to the env var in the settings "framework env keys" list */
  label: string;
  /** Input placeholder hint shown in the LLM picker's key field */
  placeholder: string;
  /**
   * Whether this provider needs a single pasteable API key. False for
   * providers like Amazon Bedrock that resolve credentials via their own
   * SDK chain (env vars, shared credentials file, instance role). Defaults
   * to true so existing single-key providers don't need to declare it.
   */
  requiresApiKey?: boolean;
}

export const PROVIDER_ENV_META: Record<string, ProviderEnvMeta> = {
  anthropic: {
    envVar: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    placeholder: "sk-ant-...",
    requiresApiKey: true,
  },
  openai: {
    envVar: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    placeholder: "sk-...",
    requiresApiKey: true,
  },
  google: {
    envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
    label: "Google Gemini API Key",
    placeholder: "AI...",
    requiresApiKey: true,
  },
  openrouter: {
    envVar: "OPENROUTER_API_KEY",
    label: "OpenRouter API Key",
    placeholder: "sk-or-...",
    requiresApiKey: true,
  },
  groq: {
    envVar: "GROQ_API_KEY",
    label: "Groq API Key",
    placeholder: "gsk_...",
    requiresApiKey: true,
  },
  mistral: {
    envVar: "MISTRAL_API_KEY",
    label: "Mistral API Key",
    placeholder: "...",
    requiresApiKey: true,
  },
  cohere: {
    envVar: "COHERE_API_KEY",
    label: "Cohere API Key",
    placeholder: "...",
    requiresApiKey: true,
  },
};

/**
 * Bedrock metadata is deliberately kept out of PROVIDER_ENV_META because
 * Bedrock uses the AWS SDK credential chain (env vars, profiles, IMDS) —
 * there is no single pasteable API key, and surfaces driven off
 * PROVIDER_ENV_META expect that pattern. UIs and the settings panel can
 * import BEDROCK_PROVIDER_META directly when they need to render a Bedrock
 * row.
 */
export const BEDROCK_PROVIDER_META: ProviderEnvMeta = {
  envVar: "AWS_REGION",
  label: "AWS Region",
  placeholder: "us-east-1",
  requiresApiKey: false,
};

/**
 * All AWS env vars consumed by the Bedrock provider. Mirrors the
 * @aws-sdk/client-bedrock-runtime default credential chain. AWS_REGION has
 * a built-in default; the rest are optional and only used when present.
 */
export interface BedrockEnvVar {
  envVar: string;
  label: string;
  placeholder: string;
  /** Default applied by the engine when the env var is unset. */
  defaultValue?: string;
  /**
   * Whether the engine works without this value. AWS_REGION defaults to
   * us-east-1, AWS_PROFILE is optional, AWS_ACCESS_KEY_ID + SECRET only
   * apply when not using a profile / instance role.
   */
  required: boolean;
}

export const BEDROCK_ENV_VARS: readonly BedrockEnvVar[] = [
  {
    envVar: "AWS_REGION",
    label: "AWS Region",
    placeholder: "us-east-1",
    defaultValue: "us-east-1",
    required: false,
  },
  {
    envVar: "AWS_PROFILE",
    label: "AWS Profile",
    placeholder: "default",
    required: false,
  },
  {
    envVar: "AWS_ACCESS_KEY_ID",
    label: "AWS Access Key ID",
    placeholder: "AKIA...",
    required: false,
  },
  {
    envVar: "AWS_SECRET_ACCESS_KEY",
    label: "AWS Secret Access Key",
    placeholder: "••••••••",
    required: false,
  },
  {
    envVar: "AWS_SESSION_TOKEN",
    label: "AWS Session Token (optional)",
    placeholder: "Optional — for temporary STS credentials",
    required: false,
  },
];

export const PROVIDER_TO_ENV: Record<string, string> = Object.fromEntries(
  Object.entries(PROVIDER_ENV_META).map(([k, v]) => [k, v.envVar]),
);

export const PROVIDER_ENV_VARS: readonly string[] =
  Object.values(PROVIDER_TO_ENV);

export const PROVIDER_ENV_PLACEHOLDERS: Record<string, string> =
  Object.fromEntries(
    Object.values(PROVIDER_ENV_META).map((m) => [m.envVar, m.placeholder]),
  );
