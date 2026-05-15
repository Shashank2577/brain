# Phase 5 — Amazon Bedrock as an LLM Provider

**Goal:** Add Bedrock as a first-class provider in the framework's existing engine abstraction. See [`architecture/05-llm-providers.md`](../architecture/05-llm-providers.md) for the deep spec and [ADR-005](../decisions/ADR-005-bedrock-as-llm-provider.md) for the decision context.

## Deliverables

- [ ] `packages/core/src/agent/engine/providers/bedrock.ts` — `BedrockEngine` implementing the `AgentEngine` interface
- [ ] Updates to `packages/core/src/agent/engine/registry.ts` to register the engine
- [ ] Updates to `packages/core/src/agent/engine/provider-env-vars.ts` to declare the Bedrock-specific env vars + UI metadata
- [ ] Updates to `packages/core/src/agent/engine/model-config.ts` to list Bedrock Claude model IDs
- [ ] Dependency: `@aws-sdk/client-bedrock-runtime` added to `packages/core/package.json`
- [ ] Settings UI updates in `packages/core/src/client/settings/SettingsPanel.tsx` to surface Bedrock as a selectable provider with region + model fields (no API-key field; uses AWS credential chain)
- [ ] `manage-agent-engine` action updated to support testing a Bedrock configuration
- [ ] Unit + integration tests per `docs/testing/integration-strategy.md`

## Tasks

| ID | Task | Owner |
|---|---|---|
| T-P5-01 | Add `@aws-sdk/client-bedrock-runtime` to deps; verify pnpm install | Product Engineer |
| T-P5-02 | Implement `BedrockEngine` using existing Anthropic translation helpers (Bedrock Claude is API-compatible with Anthropic Messages) | Product Engineer |
| T-P5-03 | Register the engine in `registry.ts`; declare env vars in `provider-env-vars.ts` | Product Engineer |
| T-P5-04 | Add Bedrock Claude models to `model-config.ts` (verified ACTIVE in us-east-1: `anthropic.claude-3-5-sonnet-20240620-v1:0`, `anthropic.claude-3-haiku-20240307-v1:0`, etc.) | Product Engineer |
| T-P5-05 | Wire SettingsPanel UI to show Bedrock as an option; show region selector | UX Engineer |
| T-P5-06 | Update `manage-agent-engine test` to run a tiny Bedrock invocation when provider=bedrock | Product Engineer |
| T-P5-07 | Unit tests with mocked AWS SDK | Product Engineer |
| T-P5-08 | Integration test: real `InvokeModelWithResponseStream` call with a short prompt | Product Engineer |
| T-P5-09 | E2E test: select Bedrock in settings, run an agent query, verify response | Product Engineer |
| T-P5-10 | Architect review | Architect |

## Acceptance criteria

- [ ] `LLM_PROVIDER=bedrock` + `LLM_MODEL=anthropic.claude-3-5-sonnet-20240620-v1:0` + `AWS_REGION=us-east-1` env config works end-to-end for the agent chat
- [ ] The same configuration is settable via Settings UI; selection persists per user/org
- [ ] Tool calling works (provider passes Anthropic-style tool definitions and parses tool-use blocks correctly)
- [ ] Streaming works (response renders incrementally in the agent chat)
- [ ] AWS credential resolution: tries env vars → `~/.aws/credentials` → IAM role
- [ ] Error path: invalid region / model not granted produces a user-readable error in the chat ("Model `<id>` not accessible in region `<region>`. Either request model access in AWS Console or pick a different model.")
- [ ] Cost tracking: response metadata feeds the existing `usage/store.ts` token + cost recording

## QA plan

- Unit: mock `BedrockRuntimeClient` and verify request shapes (model ID, message format, tool definitions, region)
- Integration: live call with a 10-token prompt; assert response is parseable and identical in shape to Anthropic direct
- E2E: open dispatch settings, switch to Bedrock, run "hello world" agent query, screenshot the response

## Pivot triggers

- **If Bedrock model access requires per-account approval and the user's account doesn't have it:** document the model-access request flow in the spec + provide a fallback to Anthropic direct in `docs/architecture/05-llm-providers.md`.
- **If the AWS SDK is too heavy to ship in dispatch:** lazy-load the Bedrock provider only when selected. Cost: cold-start delay on first use.

## Security note

The user's current `~/.aws/credentials` is a **root-account access key**. The spec recommends rotation to an IAM user with a minimal policy. Out of scope to enforce in this branch but flagged in the final completion report.

## Risks

- Bedrock's region-pinning surprises: Mumbai (`ap-south-1`, user's default) has limited Bedrock models; we pin to `us-east-1` by default.
- Cost surprise: per-token pricing varies by model; surface costs visibly in the agent chat.

## Estimated effort

1 dev-day (Product Engineer) + 0.5 day UX + 0.5 day review = 2 days.
