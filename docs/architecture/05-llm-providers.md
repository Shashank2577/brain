# 05 — LLM Providers (Amazon Bedrock Integration)

Status: spec / proposed. Owners: agent runtime. Last updated: 2026-05-16.

This document specifies how Amazon Bedrock plugs into the agent-native LLM provider
abstraction. The integration adds a new `bedrock` engine alongside the existing
`anthropic`, `ai-sdk:*`, and `builder` engines without changing any caller.

---

## 1. Provider abstraction (current state)

LLM access is funneled through a single interface, `AgentEngine`, defined in
`packages/core/src/agent/engine/types.ts`. Every chat turn, sub-agent, A2A call,
MCP-driven action, and background job consumes the same shape:

```ts
interface AgentEngine {
  readonly name: string;
  readonly label: string;
  readonly defaultModel: string;
  readonly supportedModels: readonly string[];
  readonly capabilities: EngineCapabilities; // thinking, promptCaching, vision, ...
  stream(opts: EngineStreamOptions): AsyncIterable<EngineEvent>;
}
```

`EngineEvent` is a normalized stream of `text-delta | thinking-delta | tool-input-* | tool-call | tool-call-error | usage | assistant-content | stop`. Engines yield one `usage` and exactly one terminal `stop` event per call. `runAgentLoop` sits above the engine and drives the tool dispatch loop.

The registry (`packages/core/src/agent/engine/registry.ts`) is open:

- `registerAgentEngine(entry: AgentEngineEntry)` adds a new engine at startup.
- `AgentEngineEntry` carries `name`, `label`, `description`, `installPackage`, `capabilities`, `defaultModel`, `supportedModels`, `requiredEnvVars`, and a `create(config)` factory.
- `resolveEngine()` follows: explicit option → `AGENT_ENGINE` env → request-scoped `app_secrets` (Builder wins) → `agent-engine` setting → deploy env autodetect → default `anthropic`.

Built-ins are registered by `packages/core/src/agent/engine/builtin.ts`:

| name              | required env vars                                          | notes                          |
| ----------------- | ---------------------------------------------------------- | ------------------------------ |
| `builder`         | `BUILDER_PRIVATE_KEY`, `BUILDER_PUBLIC_KEY`                | managed gateway (Anthropic-compatible) |
| `anthropic`       | `ANTHROPIC_API_KEY`                                        | native `@anthropic-ai/sdk`     |
| `ai-sdk:openai`   | `OPENAI_API_KEY`                                           | Vercel AI SDK                  |
| `ai-sdk:google`   | `GOOGLE_GENERATIVE_AI_API_KEY`                             | Vercel AI SDK                  |
| `ai-sdk:openrouter` | `OPENROUTER_API_KEY`                                     | Vercel AI SDK                  |
| `ai-sdk:groq` / `mistral` / `cohere` / `ollama`            | provider-specific              |

Per-provider metadata (env var, label, placeholder) lives in `packages/core/src/agent/engine/provider-env-vars.ts`. The model catalog is centralized in `packages/core/src/agent/model-config.ts`.

User configures the active engine via the consolidated `manage-agent-engine` action (`action: "list" | "set" | "test"`, implemented in `packages/core/src/scripts/agent-engines/`). The settings panel (`packages/core/src/client/settings/SettingsPanel.tsx`, line ~662) calls `/_agent-native/actions/manage-agent-engine` to render the picker and persists `{engine, model}` to the global `agent-engine` settings row. Per-user / per-org API keys live in encrypted `app_secrets` via `resolveSecret()` (`packages/core/src/server/credential-provider.ts`).

---

## 2. Bedrock-specific design

### 2.1 SDK and surface

- Package: `@aws-sdk/client-bedrock-runtime` (verified current major: `^3`). Add as an **optional peer dependency** of `@agent-native/core`, mirroring the `@ai-sdk/*` pattern, so the framework remains installable on hosts that do not need Bedrock.
- Imports use dynamic `import()` inside `BedrockEngine.stream()` so users without the dep can keep using other engines.
- Two SDK commands are used: `InvokeModelWithResponseStreamCommand` for chat turns (always — Bedrock supports streaming for every active Claude model in this region) and `InvokeModelCommand` only inside `test` for the `manage-agent-engine` connectivity probe.

### 2.2 Auth — credential resolution

Use the AWS SDK's default credential provider chain — never embed a static `accessKeyId` literal anywhere in the framework. The chain resolves, in order:

1. Process env: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, optionally `AWS_SESSION_TOKEN`.
2. Shared credentials file: `~/.aws/credentials`, profile selected by `AWS_PROFILE` (default `default`).
3. ECS / EKS task role, then EC2 instance metadata (IMDSv2). Useful for hosted deploys (Fargate, K8s, EC2).

`BedrockEngine` constructor:

```ts
const region =
  config.region ??
  readDeployCredentialEnv("AWS_REGION") ??
  readDeployCredentialEnv("AWS_DEFAULT_REGION") ??
  "us-east-1"; // ap-south-1 has limited Claude coverage — pin default to us-east-1.

const client = new BedrockRuntimeClient({
  region,
  // No `credentials` field — fall through to default provider chain.
});
```

The framework should declare the following env vars in `provider-env-vars.ts` (new `bedrock` entry) and document them in onboarding:

- `AWS_REGION` (defaulted to `us-east-1`)
- `AWS_PROFILE` (optional — only used when `~/.aws/credentials` has multiple profiles)
- `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` (only required if not using a profile or instance role)

`requiredEnvVars` for the registry entry is intentionally **empty** (like `ollama`). The registry's `detectEngineFromEnv()` skips entries with no required vars, so Bedrock will only be picked when a user explicitly selects it (via settings or `AGENT_ENGINE=bedrock`). This prevents Bedrock being silently chosen on machines that happen to have AWS creds set for unrelated reasons.

### 2.3 Model whitelist (verified 2026-05-16, region `us-east-1`)

Active Claude models returned by `aws bedrock list-foundation-models --region us-east-1`:

- `anthropic.claude-opus-4-7` — default for the engine (mirrors framework `claude-opus-4-7`).
- `anthropic.claude-opus-4-5-20251101-v1:0`
- `anthropic.claude-opus-4-6-v1`
- `anthropic.claude-sonnet-4-6` — mirrors the framework default Sonnet.
- `anthropic.claude-sonnet-4-5-20250929-v1:0`
- `anthropic.claude-opus-4-1-20250805-v1:0`
- `anthropic.claude-haiku-4-5-20251001-v1:0`

Legacy (still callable, do not surface in picker by default): `anthropic.claude-sonnet-4-20250514-v1:0`, the four `claude-3-*` Sonnet/Haiku variants, and `claude-opus-4-20250514-v1:0`.

All seven active models above support `streaming=true` and `inputModalities=[TEXT, IMAGE]`, so the engine sets `capabilities.vision = true` for the whole list.

> **Access requests:** the seven active models above are callable from the verified account with no additional access request. Cross-region inference profiles (`us.anthropic.*`) are out of scope for v1 — add later if higher throughput is needed.

### 2.4 InvokeModel call shape (Claude messages API on Bedrock)

Bedrock proxies the Anthropic Messages API verbatim under the `bedrock-2023-05-31` body. The engine translates `EngineStreamOptions` exactly the way `AnthropicEngine` does (reuses `engineToolsToAnthropic` / `engineMessagesToAnthropic` from `translate-anthropic.ts`), then wraps the result in Bedrock's bytes envelope:

```ts
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  engineToolsToAnthropic,
  engineMessagesToAnthropic,
  anthropicChunkToEngineEvents,
} from "./translate-anthropic.js";

async function* streamBedrock(
  client: BedrockRuntimeClient,
  opts: EngineStreamOptions,
): AsyncIterable<EngineEvent> {
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: opts.maxOutputTokens ?? 32768,
    system: opts.systemPrompt,
    messages: engineMessagesToAnthropic(opts.messages),
    tools: engineToolsToAnthropic(opts.tools),
    ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    // Extended thinking is supported for opus/sonnet on Bedrock and is
    // forwarded under the same shape as the native SDK.
    ...(opts.providerOptions?.anthropic?.thinking
      ? {
          thinking: {
            type: opts.providerOptions.anthropic.thinking.type,
            budget_tokens:
              opts.providerOptions.anthropic.thinking.budgetTokens,
          },
        }
      : {}),
  };

  const cmd = new InvokeModelWithResponseStreamCommand({
    modelId: opts.model, // e.g. "anthropic.claude-sonnet-4-6"
    contentType: "application/json",
    accept: "application/json",
    body: new TextEncoder().encode(JSON.stringify(body)),
  });

  const resp = await client.send(cmd, { abortSignal: opts.abortSignal });
  if (!resp.body) throw new Error("Bedrock returned empty stream body");

  const decoder = new TextDecoder();
  for await (const evt of resp.body) {
    if (!evt.chunk?.bytes) continue;
    // Each chunk is a JSON-encoded Anthropic streaming event. Decode once and
    // hand it to the existing Anthropic translator — yields the same
    // EngineEvent stream the AnthropicEngine yields.
    const chunk = JSON.parse(decoder.decode(evt.chunk.bytes));
    for (const e of anthropicChunkToEngineEvents(chunk)) yield e;
  }
}
```

`anthropicChunkToEngineEvents()` already emits the `usage`, `assistant-content`, and `stop` events the framework expects, so Bedrock inherits prompt-caching usage reporting (`cache_read_input_tokens`, `cache_creation_input_tokens`) for free where Bedrock exposes it. Prompt caching itself follows the Anthropic spec: pass `cache_control: { type: "ephemeral" }` on system / tool blocks — Bedrock honors it on the same active model set.

### 2.5 Cost / token reporting

Token usage flows through the same `usage` event that the rest of the framework consumes — `packages/core/src/usage/store.ts` already records every LLM call (`input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_write_tokens`) and computes cost in centicents via `pricingFor(model)`. Bedrock pricing per million tokens (us-east-1, billed by AWS) is added to that table keyed on the Bedrock model IDs above. No new tracking code is needed.

Per-org billing roll-ups (the dispatch usage dashboard, `list-dispatch-usage-metrics`) pick up Bedrock rows automatically because they read from `usage` rows by engine name.

---

## 3. Configuration surface in dispatch

The dispatch settings panel already renders one row per registered engine (built from `manage-agent-engine` `action: "list"`), so Bedrock appears automatically once registered. Additions:

1. **Engine card** — selecting "Amazon Bedrock" reveals three fields, not one: `AWS_REGION` (defaults to `us-east-1`), `AWS_PROFILE` (optional), and a "Use access keys instead" disclosure that exposes `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`. All values are written to `app_secrets` (per-user or per-org based on `resolveCredentialWriteScope`) — never to the global `agent-engine` row.
2. **Test button** — calls `manage-agent-engine` `action: "test"`, which routes through `BedrockEngine` with a one-token "ping" prompt. Surfaces AWS error codes (`AccessDeniedException`, `ValidationException`, `ThrottlingException`) verbatim so the user can act.
3. **Model picker** — reads `supportedModels` from the registry; the picker auto-includes the seven active models above. Persisted as `{engine: "bedrock", model: "anthropic.claude-sonnet-4-6"}` on the `agent-engine` settings row.

Per-org vs per-user keying: owners/admins of an org write Bedrock credentials at org scope by default (matches the Builder credential model in `resolveCredentialWriteScope`); members write at user scope. The detection chain in `detectEngineFromUserSecrets()` already prefers user → org for the active request.

---

## 4. Mini-app integration

Every template that needs LLM work delegates to the agent chat via `sendToAgentChat()` (see e.g. `templates/clips/`, `templates/calendar/`, `templates/design/` — search the codebase for ~30 call sites). Those callers never see the engine. Once the user selects Bedrock in dispatch settings, every downstream surface — clips AI summaries, calendar event suggestions, design variants, slides image prompts, dispatch app generation — routes through `BedrockEngine` with no per-template change. This is the entire point of the engine abstraction.

Two specific behaviors to preserve:

- **Sub-agents and A2A** — `production-agent.ts` resolves the engine per request, so sub-agents inherit the parent's engine. Bedrock works for sub-agents out of the box.
- **Recurring jobs / automations** — these run without a `request-context`. They still hit `detectEngineFromEnv()`, which (because `bedrock` has no required env vars) will fall through. Jobs that should use Bedrock must be invoked with `AGENT_ENGINE=bedrock` at the deploy level OR have the org's stored engine setting honored — wire `resolveEngine()` to consult the org-scoped `agent-engine` row for system-triggered runs.

---

## 5. Security notes

- **Current account uses root-account keys** (`aws sts get-caller-identity` → `arn:aws:iam::932863831197:root`). This is unacceptable for any non-throwaway use — root credentials cannot be scoped, cannot be rotated without disrupting every other root call, and grant full account privileges including billing.
- **Migration path before first production use:**
  1. Create a dedicated IAM user (e.g. `agent-native-bedrock`) — programmatic access only, no console password.
  2. Attach the AWS-managed `AmazonBedrockFullAccess` policy, or — if the framework is only invoking models (no model management) — a tighter inline policy:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
         "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.*"
       }]
     }
     ```
  3. Rotate keys to the new IAM user. Delete the root access keys after verification.
  4. For hosted deploys (ECS / EKS / EC2 / Fargate), prefer an IAM **role** attached to the task definition over static keys — the SDK will pick it up via the same default chain with no env vars set.
- The engine MUST NOT log AWS credentials or signed request payloads. The existing `logger` infrastructure redacts `Authorization` headers; add `x-amz-*` and `aws-access-key-id` patterns to the redaction list.
- SSRF protection is N/A here — Bedrock's endpoint is fixed and resolved by the AWS SDK; no user-controlled URL is passed to the network layer.

---

## 6. Test plan

**Unit** (`packages/core/src/agent/engine/bedrock-engine.spec.ts`)

- Mock `@aws-sdk/client-bedrock-runtime` with `aws-sdk-client-mock`. Verify the engine constructs the `InvokeModelWithResponseStreamCommand` with the correct `modelId`, `body.anthropic_version`, `messages`, `tools`, and `max_tokens`.
- Feed a hand-crafted async iterable of Bedrock chunks (text deltas, tool-input deltas, `message_stop`) into the mocked `resp.body` and assert the engine yields the same `EngineEvent` sequence the `AnthropicEngine` spec already verifies.
- Verify the "no AWS creds" path: when `BedrockRuntimeClient.send` throws `CredentialsProviderError`, the engine emits a single `stop` event with `errorCode: LLM_MISSING_CREDENTIALS_ERROR_CODE` and does not throw out of the async iterator.

**Integration** (`packages/core/src/agent/engine/bedrock-engine.integration.spec.ts`, gated on `AWS_REGION` being set)

- Live `InvokeModelWithResponseStreamCommand` against `anthropic.claude-haiku-4-5-20251001-v1:0` with prompt `"Reply with the single word: pong"` and `max_tokens: 16`. Assert the assembled `assistant-content` text contains `"pong"`.
- Assert the `usage` event reports `inputTokens > 0` and `outputTokens > 0`.
- Re-run with a tool definition and assert tool-call event ordering matches the Anthropic engine.

**End-to-end** (Playwright, lives under `templates/dispatch/`)

- Sign into dispatch, open Settings → AI, select "Amazon Bedrock", enter region `us-east-1`, save. Click "Test" → expect green check.
- Open the chat composer, send "Say pong", assert SSE response contains "pong".
- Verify the `usage` dashboard row tagged `engine: bedrock`, `model: anthropic.claude-sonnet-4-6` (default Sonnet) appears with the expected cost in centicents.
- Switch the active engine back to `anthropic`; confirm the dispatch composer reverts to direct-API Claude on the next turn with no app reload.

---

## 7. Open questions

- Cross-region inference profiles (e.g. `us.anthropic.claude-opus-4-7`) — defer to v2.
- Bedrock Knowledge Bases / Agents — out of scope; the framework already has its own RAG and agent loop.
- `ConverseStream` API — Bedrock's newer, provider-agnostic streaming API would let us reuse one engine for non-Anthropic Bedrock models (Mistral, Llama, Cohere on Bedrock). Worth adding behind a `ai-sdk:bedrock` flavor later, but the v1 spec here uses raw `InvokeModel` to preserve full Anthropic feature parity (extended thinking, prompt caching).
