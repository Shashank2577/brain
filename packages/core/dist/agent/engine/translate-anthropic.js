/**
 * Translation helpers between the AgentEngine normalized types and
 * @anthropic-ai/sdk's wire types.
 *
 * AnthropicEngine does very little translation because the framework's
 * EngineMessage / EngineTool shapes were modeled on Anthropic's types.
 * The main differences are: camelCase vs snake_case, and that
 * Anthropic uses `input_schema` while we use `inputSchema`.
 */
// ---------------------------------------------------------------------------
// EngineTool → Anthropic.Tool
// ---------------------------------------------------------------------------
export function engineToolToAnthropic(tool) {
    return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
    };
}
export function engineToolsToAnthropic(tools) {
    return tools.map(engineToolToAnthropic);
}
// ---------------------------------------------------------------------------
// EngineMessage → Anthropic.MessageParam
// ---------------------------------------------------------------------------
export function engineMessageToAnthropic(msg) {
    return {
        role: msg.role,
        content: msg.content.map(enginePartToAnthropic),
    };
}
export function engineMessagesToAnthropic(messages) {
    return messages.map(engineMessageToAnthropic);
}
function enginePartToAnthropic(part) {
    switch (part.type) {
        case "text":
            return { type: "text", text: part.text };
        case "image":
            return {
                type: "image",
                source: {
                    type: "base64",
                    media_type: part.mediaType,
                    data: part.data,
                },
            };
        case "file":
            if (part.mediaType === "application/pdf") {
                return {
                    type: "document",
                    source: {
                        type: "base64",
                        media_type: "application/pdf",
                        data: part.data,
                    },
                    ...(part.filename ? { title: part.filename } : {}),
                };
            }
            return {
                type: "text",
                text: `[Attached file: ${part.filename ?? "attachment"} (${part.mediaType})]`,
            };
        case "tool-call":
            return {
                type: "tool_use",
                id: part.id,
                name: part.name,
                input: part.input,
            }; // tool_use is a ContentBlockParam in Anthropic SDK
        case "tool-result":
            return {
                type: "tool_result",
                tool_use_id: part.toolCallId,
                content: part.content,
                ...(part.isError ? { is_error: true } : {}),
            };
        case "thinking":
            // Anthropic thinking blocks — pass through with signature for context window continuity
            return {
                type: "thinking",
                thinking: part.text,
                signature: part.signature ?? "",
            };
    }
}
// ---------------------------------------------------------------------------
// Anthropic.ContentBlock → EngineContentPart (from final message)
// ---------------------------------------------------------------------------
export function anthropicContentToEngine(content) {
    return content
        .map((block) => {
        if (block.type === "text") {
            return { type: "text", text: block.text };
        }
        if (block.type === "tool_use") {
            return {
                type: "tool-call",
                id: block.id,
                name: block.name,
                input: block.input,
            };
        }
        if (block.type === "thinking") {
            const b = block;
            return {
                type: "thinking",
                text: b.thinking ?? "",
                signature: b.signature,
            };
        }
        // Unknown block type — skip
        return { type: "text", text: "" };
    })
        .filter((p) => !(p.type === "text" && p.text === ""));
}
// ---------------------------------------------------------------------------
// Anthropic stream chunk → EngineEvent
// ---------------------------------------------------------------------------
/**
 * Translate an Anthropic stream chunk into zero or more EngineEvents.
 * Called in a loop as chunks arrive from client.messages.stream().
 */
export function anthropicChunkToEngineEvents(chunk) {
    const events = [];
    if (chunk.type === "content_block_delta") {
        if (chunk.delta?.type === "text_delta") {
            events.push({ type: "text-delta", text: chunk.delta.text });
        }
        else if (chunk.delta?.type === "thinking_delta") {
            events.push({ type: "thinking-delta", text: chunk.delta.thinking ?? "" });
        }
        else if (chunk.delta?.type === "signature_delta") {
            // Signature arrives after thinking — emit as a thinking-delta with empty text
            // but carry the signature for the caller to store
            events.push({
                type: "thinking-delta",
                text: "",
                signature: chunk.delta.signature,
            });
        }
    }
    return events;
}
// ---------------------------------------------------------------------------
// Build tool_result blocks to append to messages after tool dispatch
// ---------------------------------------------------------------------------
export function buildToolResultPart(toolCallId, content, isError = false) {
    return {
        type: "tool-result",
        toolCallId,
        content,
        ...(isError ? { isError } : {}),
    };
}
//# sourceMappingURL=translate-anthropic.js.map