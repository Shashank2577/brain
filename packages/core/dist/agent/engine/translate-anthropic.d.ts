/**
 * Translation helpers between the AgentEngine normalized types and
 * @anthropic-ai/sdk's wire types.
 *
 * AnthropicEngine does very little translation because the framework's
 * EngineMessage / EngineTool shapes were modeled on Anthropic's types.
 * The main differences are: camelCase vs snake_case, and that
 * Anthropic uses `input_schema` while we use `inputSchema`.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { EngineTool, EngineMessage, EngineContentPart, EngineEvent } from "./types.js";
export declare function engineToolToAnthropic(tool: EngineTool): Anthropic.Tool;
export declare function engineToolsToAnthropic(tools: EngineTool[]): Anthropic.Tool[];
export declare function engineMessageToAnthropic(msg: EngineMessage): Anthropic.MessageParam;
export declare function engineMessagesToAnthropic(messages: EngineMessage[]): Anthropic.MessageParam[];
export declare function anthropicContentToEngine(content: Anthropic.ContentBlock[]): EngineContentPart[];
/**
 * Translate an Anthropic stream chunk into zero or more EngineEvents.
 * Called in a loop as chunks arrive from client.messages.stream().
 */
export declare function anthropicChunkToEngineEvents(chunk: any): EngineEvent[];
export declare function buildToolResultPart(toolCallId: string, content: string, isError?: boolean): EngineContentPart;
//# sourceMappingURL=translate-anthropic.d.ts.map