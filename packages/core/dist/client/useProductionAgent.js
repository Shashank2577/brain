import { useState, useCallback, useRef } from "react";
import { formatChatErrorText } from "./error-format.js";
import { agentNativePath } from "./api-path.js";
/** @deprecated Use `AssistantChat` component instead */
export function useProductionAgent(options) {
    const apiUrl = options?.apiUrl ?? agentNativePath("/_agent-native/agent-chat");
    const [messages, setMessages] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const abortRef = useRef(null);
    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || isGenerating)
            return;
        const userMsg = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text.trim(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsGenerating(true);
        // Notify any listeners that generation is running
        window.dispatchEvent(new CustomEvent("agentNative.chatRunning", {
            detail: { isRunning: true, running: true },
        }));
        // Build history for this request — skip empty-content messages
        // (assistant turns with only tool calls have no text content to send)
        const history = messages
            .filter((m) => m.content.trim())
            .map((m) => ({
            role: m.role,
            content: m.content,
        }));
        const assistantId = `assistant-${Date.now()}`;
        const assistantMsg = {
            id: assistantId,
            role: "assistant",
            content: "",
            toolCalls: [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
        const abort = new AbortController();
        abortRef.current = abort;
        try {
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text.trim(), history }),
                signal: abort.signal,
            });
            if (!res.ok || !res.body) {
                throw new Error(`Server error: ${res.status}`);
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                    if (!line.startsWith("data: "))
                        continue;
                    const raw = line.slice(6).trim();
                    if (!raw)
                        continue;
                    let ev;
                    try {
                        ev = JSON.parse(raw);
                    }
                    catch {
                        continue;
                    }
                    if (ev.type === "text") {
                        setMessages((prev) => prev.map((m) => m.id === assistantId
                            ? { ...m, content: m.content + ev.text }
                            : m));
                    }
                    else if (ev.type === "tool_start") {
                        setMessages((prev) => prev.map((m) => m.id === assistantId
                            ? {
                                ...m,
                                toolCalls: [
                                    ...(m.toolCalls ?? []),
                                    { tool: ev.tool, input: ev.input },
                                ],
                            }
                            : m));
                    }
                    else if (ev.type === "tool_done") {
                        setMessages((prev) => prev.map((m) => {
                            if (m.id !== assistantId)
                                return m;
                            const calls = [...(m.toolCalls ?? [])];
                            // Update last tool call with result
                            const idx = calls.map((c) => c.tool).lastIndexOf(ev.tool);
                            if (idx >= 0)
                                calls[idx] = { ...calls[idx], result: ev.result };
                            return { ...m, toolCalls: calls };
                        }));
                    }
                    else if (ev.type === "agent_call") {
                        const agentName = ev.agent;
                        if (ev.status === "start") {
                            setMessages((prev) => prev.map((m) => m.id === assistantId
                                ? {
                                    ...m,
                                    toolCalls: [
                                        ...(m.toolCalls ?? []),
                                        {
                                            tool: `agent:${agentName}`,
                                            input: {},
                                        },
                                    ],
                                }
                                : m));
                        }
                        else if (ev.status === "done" || ev.status === "error") {
                            setMessages((prev) => prev.map((m) => {
                                if (m.id !== assistantId)
                                    return m;
                                const calls = [...(m.toolCalls ?? [])];
                                const idx = calls
                                    .map((c) => c.tool)
                                    .lastIndexOf(`agent:${agentName}`);
                                if (idx >= 0)
                                    calls[idx] = {
                                        ...calls[idx],
                                        result: ev.status === "error"
                                            ? "Error calling agent"
                                            : "Done",
                                    };
                                return { ...m, toolCalls: calls };
                            }));
                        }
                    }
                    else if (ev.type === "done" || ev.type === "error") {
                        if (ev.type === "error") {
                            const fallbackContent = formatChatErrorText(ev.error ?? "Unknown error", ev.upgradeUrl, ev.errorCode);
                            setMessages((prev) => prev.map((m) => m.id === assistantId
                                ? { ...m, content: m.content || fallbackContent }
                                : m));
                        }
                        break;
                    }
                }
            }
        }
        catch (err) {
            if (err?.name !== "AbortError") {
                setMessages((prev) => prev.map((m) => m.id === assistantId
                    ? {
                        ...m,
                        content: m.content || "Something went wrong. Please try again.",
                    }
                    : m));
            }
        }
        finally {
            setIsGenerating(false);
            window.dispatchEvent(new CustomEvent("agentNative.chatRunning", {
                detail: { isRunning: false, running: false },
            }));
            abortRef.current = null;
        }
    }, [messages, isGenerating]);
    const clearHistory = useCallback(() => {
        abortRef.current?.abort();
        setMessages([]);
        setIsGenerating(false);
    }, []);
    return { messages, isGenerating, sendMessage, clearHistory };
}
//# sourceMappingURL=useProductionAgent.js.map