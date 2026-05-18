/**
 * Translation helpers between AgentEngine normalized types and
 * Vercel AI SDK (`ai` package, v6+) types.
 *
 * The framework keeps a provider-neutral content/event model (see ./types.ts).
 * These helpers convert in both directions against the v6 `TextStreamPart` and
 * `ModelMessage` shapes.
 */
import type { EngineTool, EngineMessage, EngineContentPart, EngineEvent } from "./types.js";
/**
 * Convert EngineTool[] into the record shape that AI SDK's `streamText` expects
 * under the `tools` option.
 *
 * Pass the `jsonSchema` helper from the `ai` package when available so the
 * schema is wrapped in the SDK's runtime validator; fall back to the raw JSON
 * Schema object otherwise (mostly for unit tests that don't import `ai`).
 */
export declare function engineToolsToAISDK(tools: EngineTool[], jsonSchema?: (schema: Record<string, unknown>) => unknown): Record<string, any>;
/**
 * Convert a single EngineMessage into **one or more** AI SDK ModelMessages.
 *
 * v6 puts tool-results in a dedicated `role: "tool"` message rather than
 * embedding them in user content. When an EngineMessage's user content mixes
 * text/images with tool-results, we emit the tool-result parts first as a
 * `{role: "tool"}` message, followed by the remaining text/image parts as a
 * `{role: "user"}` message.
 */
export declare function engineMessageToAISDK(msg: EngineMessage): any[];
export declare function engineMessagesToAISDK(messages: EngineMessage[]): any[];
/**
 * Translate a single part from AI SDK's `result.fullStream` into the flat
 * sequence of EngineEvent items the framework works with.
 *
 * v6 emits lifecycle events (`text-start` / `text-delta` / `text-end`,
 * `reasoning-start` / `reasoning-delta` / `reasoning-end`, `tool-input-*`).
 * We absorb text/reasoning boundaries, forward text/reasoning/tool-input
 * deltas, and keep the terminal `tool-call`, `finish-step`, and `finish` parts.
 */
export declare function aiSdkPartToEngineEvents(part: any): EngineEvent[];
/**
 * Reconstruct the assistant message content from an AI SDK v6 `StepResult`.
 * `step.content` is the canonical structured form — iterate it.
 */
export declare function aiSdkStepToAssistantContent(step: any): EngineContentPart[];
//# sourceMappingURL=translate-ai-sdk.d.ts.map