# ADR-005: Amazon Bedrock as a first-class LLM provider

**Status:** Accepted (2026-05-16, branch `os-shell`)

## Context

The dispatch shell needs a configurable LLM provider for the agent chat. Existing providers: Anthropic Claude (direct), OpenAI, Google Gemini, OpenRouter. The user has AWS Bedrock available (account `932863831197`, `~/.aws/credentials` configured) and wants Bedrock added to test AI features against models hosted on AWS infrastructure.

Bedrock hosts multiple model families (Anthropic Claude, Meta Llama, Mistral, Amazon Titan, etc.) through one API. Models require per-account access approval before they're invocable.

## Decision

**Amazon Bedrock is added as a first-class LLM provider** alongside Anthropic, OpenAI, Gemini, and OpenRouter, configured at the dispatch level.

## Provider behavior

- **AWS SDK** — `@aws-sdk/client-bedrock-runtime` for `InvokeModel` + `InvokeModelWithResponseStream`
- **Region** — pinned to `us-east-1` by default for the broadest model availability. Override via `AWS_REGION` env var (note: user's default `ap-south-1` has limited Bedrock models).
- **Credential resolution** — AWS standard chain (env vars > `~/.aws/credentials` > IAM role). Works locally with the user's existing creds; works in deploy with an IAM role.
- **Default model** — `anthropic.claude-3-5-sonnet-20240620-v1:0` if available in the account; fallback `anthropic.claude-3-haiku-20240307-v1:0`. Verified via `aws bedrock list-foundation-models --region us-east-1` at boot and logged.
- **Streaming** — Bedrock's chunked stream maps to the framework's existing streaming protocol (the provider abstraction defines `streamChat()` returning an async iterable of `{ delta }` chunks).
- **Tool calling** — Claude-family models on Bedrock support the same tool-use protocol as Anthropic direct. The provider implementation handles the small request-shape differences.
- **Cost reporting** — Bedrock returns usage in response metadata. The provider mirrors this into the framework's existing token-cost tracking.

## Configuration surface

- **Env vars** (server-side): `LLM_PROVIDER=bedrock`, `LLM_MODEL=<bedrock-model-id>`, plus the standard `AWS_*` vars.
- **Settings UI** (dispatch agent panel): provider dropdown shows Bedrock alongside the others. Selecting it shows region + model fields. No API-key field (uses AWS credential chain).
- **Per-org override** — the framework's existing per-org credential storage (`vault_secrets`) supports per-org AWS keys; out of scope for v1 (single-tenant self-host).

## Security consequence

The user's current `~/.aws/credentials` is a **root-account key**. This is widely discouraged. Recommendation in [`architecture/05-llm-providers.md`](../architecture/05-llm-providers.md): rotate to an IAM user/role with a minimal policy (`bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream`, `bedrock:ListFoundationModels`). Out of scope to enforce in this branch.

## Implementation location

`packages/core/src/server/llm/providers/bedrock.ts` (target — the provider abstraction may not yet be modularised; Phase 5 work includes extracting it cleanly).

## Alternatives considered

- **Run Bedrock via OpenRouter** — OpenRouter doesn't currently proxy Bedrock. Rejected.
- **Only support direct provider SDKs (Anthropic / OpenAI / Gemini), require user to point them at Bedrock-compatible endpoints.** Rejected — Bedrock is a distinct enough surface (AWS auth, regions, model IDs) that a dedicated provider is cleaner.
- **Defer Bedrock to v2.** Rejected — the user explicitly asked for it; AWS creds are already configured.

## References

- Phase 5 delivery doc
- [`architecture/05-llm-providers.md`](../architecture/05-llm-providers.md)
- User direction: "I have Amazon Bedrock running cloud. and I want to use that in this system"
