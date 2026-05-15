/**
 * BedrockEngine — wraps `@aws-sdk/client-bedrock-runtime` for use as an
 * AgentEngine. Targets Anthropic Claude models hosted on Amazon Bedrock.
 *
 * Bedrock proxies the Anthropic Messages API verbatim under the
 * `bedrock-2023-05-31` body shape, so this engine reuses the existing
 * Anthropic translation helpers (`engineMessagesToAnthropic`,
 * `engineToolsToAnthropic`, `anthropicChunkToEngineEvents`) and only swaps
 * the transport — `InvokeModelWithResponseStreamCommand` instead of
 * `@anthropic-ai/sdk`'s native streaming.
 *
 * Auth uses the AWS SDK's default credential provider chain:
 *   1. Process env (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
 *   2. Shared credentials file (`~/.aws/credentials`, profile from `AWS_PROFILE`)
 *   3. ECS / EKS task role, then EC2 instance metadata (IMDSv2)
 *
 * The `@aws-sdk/client-bedrock-runtime` package is an OPTIONAL peer
 * dependency — imports happen via dynamic `import()` inside `stream()` so
 * core remains installable on hosts that never use Bedrock.
 */

import type {
  AgentEngine,
  EngineCapabilities,
  EngineContentPart,
  EngineEvent,
  EngineStreamOptions,
} from "../types.js";
import {
  engineMessagesToAnthropic,
  engineToolsToAnthropic,
  anthropicChunkToEngineEvents,
} from "../translate-anthropic.js";
import { readDeployCredentialEnv } from "../../../server/credential-provider.js";
import { BEDROCK_MODEL_CONFIG } from "../../model-config.js";

export const BEDROCK_CAPABILITIES: EngineCapabilities = {
  // Extended thinking is supported on Bedrock for opus/sonnet variants and
  // forwarded under the same shape the native Anthropic SDK uses, so leave
  // the flag on. Templates that target a Claude model without thinking
  // simply won't pass `providerOptions.anthropic.thinking`.
  thinking: true,
  // Anthropic-style prompt caching is honored by Bedrock for the active
  // Claude models.
  promptCaching: true,
  // All Claude-on-Bedrock models we surface accept image input.
  vision: true,
  // Computer use is gated to Anthropic-direct in this framework today.
  computerUse: false,
  parallelToolCalls: true,
};

export const BEDROCK_SUPPORTED_MODELS = BEDROCK_MODEL_CONFIG.supportedModels;
export const BEDROCK_DEFAULT_MODEL = BEDROCK_MODEL_CONFIG.defaultModel;

const BEDROCK_DEFAULT_REGION = "us-east-1";
const BEDROCK_ANTHROPIC_VERSION = "bedrock-2023-05-31";

// Match Anthropic engine's default — large enough for long-form generation
// without hitting Bedrock's per-model max-token caps.
const BEDROCK_DEFAULT_MAX_TOKENS = 32_768;

export interface BedrockEngineConfig {
  /** AWS region for the BedrockRuntimeClient. Defaults to us-east-1. */
  region?: string;
  /**
   * Optional explicit model ID. The engine still honors the per-request
   * `opts.model` first; this is only used as a label/default fallback.
   */
  modelId?: string;
  /**
   * Optional AWS shared-credentials profile name. When set, the engine
   * uses `@aws-sdk/credential-provider-ini` against the named profile;
   * otherwise the default credential chain handles resolution.
   */
  profile?: string;
  /**
   * Static AWS access key. Prefer leaving unset and letting the credential
   * chain resolve from env / shared credentials / instance role.
   */
  accessKeyId?: string;
  /** Static AWS secret access key, paired with `accessKeyId`. */
  secretAccessKey?: string;
  /** Optional STS session token to accompany temporary credentials. */
  sessionToken?: string;
}

class BedrockEngine implements AgentEngine {
  readonly name = "bedrock";
  readonly label = "Amazon Bedrock (Claude)";
  readonly defaultModel: string;
  readonly supportedModels = BEDROCK_SUPPORTED_MODELS;
  readonly capabilities = BEDROCK_CAPABILITIES;

  private readonly region: string;
  private readonly profile: string | undefined;
  private readonly accessKeyId: string | undefined;
  private readonly secretAccessKey: string | undefined;
  private readonly sessionToken: string | undefined;

  constructor(config: BedrockEngineConfig) {
    this.region = config.region ?? BEDROCK_DEFAULT_REGION;
    this.defaultModel = config.modelId ?? BEDROCK_DEFAULT_MODEL;
    this.profile = config.profile;
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.sessionToken = config.sessionToken;
  }

  async *stream(opts: EngineStreamOptions): AsyncIterable<EngineEvent> {
    let BedrockRuntimeClient: typeof import("@aws-sdk/client-bedrock-runtime").BedrockRuntimeClient;
    let InvokeModelWithResponseStreamCommand: typeof import("@aws-sdk/client-bedrock-runtime").InvokeModelWithResponseStreamCommand;
    try {
      const mod = await import("@aws-sdk/client-bedrock-runtime");
      BedrockRuntimeClient = mod.BedrockRuntimeClient;
      InvokeModelWithResponseStreamCommand =
        mod.InvokeModelWithResponseStreamCommand;
    } catch (err) {
      yield {
        type: "stop",
        reason: "error",
        error:
          "Amazon Bedrock engine requires '@aws-sdk/client-bedrock-runtime'. Install it as a peer dependency to use this provider.",
      };
      return;
    }

    const clientConfig: Record<string, unknown> = { region: this.region };
    if (this.accessKeyId && this.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
        ...(this.sessionToken ? { sessionToken: this.sessionToken } : {}),
      };
    } else if (this.profile) {
      // Profile-based auth: load fromIni dynamically. The
      // @aws-sdk/credential-provider-ini package ships with the AWS SDK
      // monorepo and is pulled in transitively by client-bedrock-runtime,
      // so the import resolves whenever Bedrock itself is installed — but
      // we still wrap it in try/catch so a non-standard install can fall
      // through to the default credential chain instead of crashing.
      // Use a variable identifier so TypeScript treats this as a runtime
      // module reference and does not require @aws-sdk/credential-provider-ini
      // type declarations at compile time.
      const credIniPkg = "@aws-sdk/credential-provider-ini";
      try {
        const credMod: any = await import(/* @vite-ignore */ credIniPkg);
        if (typeof credMod.fromIni === "function") {
          clientConfig.credentials = credMod.fromIni({
            profile: this.profile,
          });
        }
      } catch {
        // Fall through to the default credential chain. The SDK reads
        // AWS_PROFILE from process.env on its own when the caller has
        // set it before invoking the framework.
      }
    }
    // Otherwise leave `credentials` unset — the SDK falls through to its
    // default provider chain (env → shared credentials file → IMDS/role).
    const client = new BedrockRuntimeClient(clientConfig as any);

    const tools = engineToolsToAnthropic(opts.tools);
    const messages = engineMessagesToAnthropic(opts.messages);
    const anthropicOpts = opts.providerOptions?.anthropic;

    const body: Record<string, unknown> = {
      anthropic_version: BEDROCK_ANTHROPIC_VERSION,
      max_tokens: opts.maxOutputTokens ?? BEDROCK_DEFAULT_MAX_TOKENS,
      system: opts.systemPrompt,
      messages,
      ...(tools.length > 0 ? { tools } : {}),
      ...(opts.temperature !== undefined
        ? { temperature: opts.temperature }
        : {}),
      ...(anthropicOpts?.thinking
        ? {
            thinking: {
              type: anthropicOpts.thinking.type,
              budget_tokens: anthropicOpts.thinking.budgetTokens,
            },
          }
        : {}),
      ...(anthropicOpts?.topK !== undefined
        ? { top_k: anthropicOpts.topK }
        : {}),
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: opts.model,
      contentType: "application/json",
      accept: "application/json",
      body: new TextEncoder().encode(JSON.stringify(body)),
    });

    let response: { body?: AsyncIterable<unknown> } | undefined;
    try {
      // The AWS SDK's `client.send` is heavily overloaded — narrow to the
      // shape we care about (`{ body }`) via `as any` so TypeScript picks
      // a matching overload without us having to import the full union of
      // command/output types from the SDK.
      response = (await (client.send as any)(command, {
        abortSignal: opts.abortSignal,
      })) as { body?: AsyncIterable<unknown> };
    } catch (err) {
      yield {
        type: "stop",
        reason: "error",
        error: bedrockErrorMessage(err),
      };
      return;
    }

    const stream = response?.body;
    if (!stream) {
      yield {
        type: "stop",
        reason: "error",
        error: "Bedrock returned no response stream body.",
      };
      return;
    }

    // Accumulators for assembling the final assistant content. Bedrock
    // streams raw Anthropic events: message_start → content_block_start →
    // content_block_delta… → content_block_stop → message_delta →
    // message_stop. We can't rely on `finalMessage()` like the native
    // Anthropic engine does, so we reconstruct the assistant message here.
    const parts: EngineContentPart[] = [];
    type PendingBlock =
      | { kind: "text"; text: string }
      | { kind: "thinking"; text: string; signature?: string }
      | { kind: "tool_use"; id: string; name: string; partialJson: string };
    const pendingBlocks = new Map<number, PendingBlock>();

    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheWriteTokens = 0;
    let stopReason: string | undefined;
    let usageEmitted = false;

    const decoder = new TextDecoder();

    try {
      for await (const evt of stream as AsyncIterable<any>) {
        const chunkBytes = evt?.chunk?.bytes;
        if (!chunkBytes) {
          // Bedrock surfaces stream-level errors as named union members
          // (modelStreamErrorException, throttlingException, etc.). Any of
          // those terminates the stream — surface a single error stop.
          const streamErr = pickBedrockStreamError(evt);
          if (streamErr) {
            yield {
              type: "stop",
              reason: "error",
              error: streamErr,
            };
            return;
          }
          continue;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(decoder.decode(chunkBytes));
        } catch {
          yield {
            type: "stop",
            reason: "error",
            error: "Bedrock returned an unparseable chunk payload.",
          };
          return;
        }

        // text-delta + thinking-delta deltas are already covered by the
        // shared translator — forward whatever events it yields.
        for (const e of anthropicChunkToEngineEvents(parsed)) {
          yield e;
        }

        // Now handle the structural events the shared translator doesn't
        // turn into EngineEvents but that we need to assemble the final
        // assistant content + propagate tool-input deltas.
        const type = parsed?.type;

        if (type === "message_start") {
          const usage = parsed?.message?.usage;
          if (usage) {
            inputTokens = usage.input_tokens ?? inputTokens;
            outputTokens = usage.output_tokens ?? outputTokens;
            cacheReadTokens = usage.cache_read_input_tokens ?? cacheReadTokens;
            cacheWriteTokens =
              usage.cache_creation_input_tokens ?? cacheWriteTokens;
          }
          continue;
        }

        if (type === "content_block_start") {
          const idx = parsed.index ?? 0;
          const block = parsed.content_block ?? {};
          if (block.type === "text") {
            pendingBlocks.set(idx, { kind: "text", text: "" });
          } else if (block.type === "thinking") {
            pendingBlocks.set(idx, {
              kind: "thinking",
              text: block.thinking ?? "",
            });
          } else if (block.type === "tool_use") {
            pendingBlocks.set(idx, {
              kind: "tool_use",
              id: block.id,
              name: block.name,
              partialJson: "",
            });
            yield {
              type: "tool-input-start",
              id: block.id,
              name: block.name,
            };
          }
          continue;
        }

        if (type === "content_block_delta") {
          const idx = parsed.index ?? 0;
          const delta = parsed.delta ?? {};
          const block = pendingBlocks.get(idx);
          if (!block) continue;
          if (delta.type === "text_delta" && block.kind === "text") {
            block.text += delta.text ?? "";
          } else if (
            delta.type === "thinking_delta" &&
            block.kind === "thinking"
          ) {
            block.text += delta.thinking ?? "";
          } else if (
            delta.type === "signature_delta" &&
            block.kind === "thinking"
          ) {
            if (typeof delta.signature === "string") {
              block.signature = delta.signature;
            }
          } else if (
            delta.type === "input_json_delta" &&
            block.kind === "tool_use"
          ) {
            const text =
              typeof delta.partial_json === "string" ? delta.partial_json : "";
            block.partialJson += text;
            yield {
              type: "tool-input-delta",
              id: block.id,
              name: block.name,
              text,
            };
          }
          continue;
        }

        if (type === "content_block_stop") {
          const idx = parsed.index ?? 0;
          const block = pendingBlocks.get(idx);
          if (!block) continue;
          if (block.kind === "text") {
            parts.push({ type: "text", text: block.text });
          } else if (block.kind === "thinking") {
            parts.push({
              type: "thinking",
              text: block.text,
              ...(block.signature ? { signature: block.signature } : {}),
            });
          } else if (block.kind === "tool_use") {
            let input: unknown = {};
            if (block.partialJson) {
              try {
                input = JSON.parse(block.partialJson);
              } catch {
                input = {};
              }
            }
            const toolCallPart = {
              type: "tool-call" as const,
              id: block.id,
              name: block.name,
              input,
            };
            parts.push(toolCallPart);
            yield toolCallPart;
          }
          pendingBlocks.delete(idx);
          continue;
        }

        if (type === "message_delta") {
          const usage = parsed.usage;
          if (usage) {
            // Bedrock emits the final output_tokens on message_delta.
            outputTokens = usage.output_tokens ?? outputTokens;
            cacheReadTokens = usage.cache_read_input_tokens ?? cacheReadTokens;
            cacheWriteTokens =
              usage.cache_creation_input_tokens ?? cacheWriteTokens;
          }
          if (parsed.delta?.stop_reason) {
            stopReason = parsed.delta.stop_reason;
          }
          continue;
        }

        if (type === "message_stop") {
          // Some Bedrock chunks attach an amazon-bedrock-invocationMetrics
          // payload with final token counts. Honor it when present.
          const metrics =
            parsed?.["amazon-bedrock-invocationMetrics"] ??
            parsed?.amazonBedrockInvocationMetrics;
          if (metrics) {
            inputTokens = metrics.inputTokenCount ?? inputTokens;
            outputTokens = metrics.outputTokenCount ?? outputTokens;
          }
          continue;
        }
      }
    } catch (err) {
      yield {
        type: "stop",
        reason: "error",
        error: bedrockErrorMessage(err),
      };
      return;
    }

    // Flush any blocks that never received an explicit content_block_stop
    // (defensive — Bedrock should always terminate them, but the spec
    // doesn't promise it for partial responses on the wire).
    for (const block of pendingBlocks.values()) {
      if (block.kind === "text") {
        parts.push({ type: "text", text: block.text });
      } else if (block.kind === "thinking") {
        parts.push({
          type: "thinking",
          text: block.text,
          ...(block.signature ? { signature: block.signature } : {}),
        });
      } else if (block.kind === "tool_use") {
        let input: unknown = {};
        if (block.partialJson) {
          try {
            input = JSON.parse(block.partialJson);
          } catch {
            input = {};
          }
        }
        parts.push({
          type: "tool-call",
          id: block.id,
          name: block.name,
          input,
        });
      }
    }

    if (!usageEmitted) {
      yield {
        type: "usage",
        inputTokens,
        outputTokens,
        ...(cacheReadTokens ? { cacheReadTokens } : {}),
        ...(cacheWriteTokens ? { cacheWriteTokens } : {}),
      };
      usageEmitted = true;
    }

    yield { type: "assistant-content", parts };

    yield {
      type: "stop",
      reason:
        stopReason === "tool_use"
          ? "tool_use"
          : stopReason === "max_tokens"
            ? "max_tokens"
            : stopReason === "stop_sequence"
              ? "stop_sequence"
              : "end_turn",
    };
  }
}

/**
 * Pretty-print a Bedrock SDK error. The AWS SDK throws errors with `name`
 * matching the wire fault (e.g. AccessDeniedException, ValidationException,
 * ThrottlingException, ResourceNotFoundException) and a usable `message`.
 * We pass both up to the chat UI so users can act on AWS-side fixes
 * (request model access, choose a different region, etc.).
 */
function bedrockErrorMessage(err: unknown): string {
  if (!err) return "Unknown Bedrock error";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const name = (err as { name?: string }).name ?? "Error";
    return name === "Error" ? err.message : `${name}: ${err.message}`;
  }
  return String(err);
}

/**
 * Bedrock's `ResponseStream` is a union — chunks normally arrive under the
 * `chunk` member, but throttling, validation, model-stream-error etc. show
 * up as their own named members. Return a printable message if any is set.
 */
function pickBedrockStreamError(evt: unknown): string | undefined {
  if (!evt || typeof evt !== "object") return undefined;
  const candidates: Array<[string, string]> = [
    ["modelStreamErrorException", "ModelStreamErrorException"],
    ["internalServerException", "InternalServerException"],
    ["throttlingException", "ThrottlingException"],
    ["validationException", "ValidationException"],
    ["serviceUnavailableException", "ServiceUnavailableException"],
    ["modelTimeoutException", "ModelTimeoutException"],
  ];
  for (const [key, label] of candidates) {
    const e = (evt as Record<string, unknown>)[key];
    if (e && typeof e === "object") {
      const msg = (e as { message?: unknown }).message;
      return `${label}: ${typeof msg === "string" && msg ? msg : "no detail"}`;
    }
  }
  return undefined;
}

/**
 * Create a BedrockEngine instance. Honors config from
 * `manage-agent-engine`-style records (`region`, `modelId`, `profile`,
 * `accessKeyId`/`secretAccessKey`) and falls back to the deployment env
 * vars when fallback is permitted.
 */
export function createBedrockEngine(
  config: Record<string, unknown> = {},
): AgentEngine {
  const allowEnvFallback = config.allowEnvFallback !== false;

  const region =
    (config.region as string | undefined) ??
    (allowEnvFallback
      ? (readDeployCredentialEnv("AWS_REGION") ??
        readDeployCredentialEnv("AWS_DEFAULT_REGION"))
      : undefined) ??
    BEDROCK_DEFAULT_REGION;

  const profile =
    (config.profile as string | undefined) ??
    (allowEnvFallback ? readDeployCredentialEnv("AWS_PROFILE") : undefined);

  const accessKeyId =
    (config.accessKeyId as string | undefined) ??
    (allowEnvFallback
      ? readDeployCredentialEnv("AWS_ACCESS_KEY_ID")
      : undefined);
  const secretAccessKey =
    (config.secretAccessKey as string | undefined) ??
    (allowEnvFallback
      ? readDeployCredentialEnv("AWS_SECRET_ACCESS_KEY")
      : undefined);
  const sessionToken =
    (config.sessionToken as string | undefined) ??
    (allowEnvFallback
      ? readDeployCredentialEnv("AWS_SESSION_TOKEN")
      : undefined);

  return new BedrockEngine({
    region,
    modelId: config.modelId as string | undefined,
    profile,
    accessKeyId,
    secretAccessKey,
    sessionToken,
  });
}
