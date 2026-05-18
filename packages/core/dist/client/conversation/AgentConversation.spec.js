import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentConversationMessageView } from "./AgentConversation.js";
describe("AgentConversationMessageView", () => {
    let container;
    let root;
    beforeEach(() => {
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });
    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
        vi.unstubAllGlobals();
    });
    it("renders text and tool parts in transcript order", () => {
        act(() => {
            root.render(_jsx(AgentConversationMessageView, { message: {
                    id: "message-1",
                    role: "assistant",
                    parts: [
                        { id: "text-1", type: "text", text: "Before tool." },
                        {
                            id: "tool-1",
                            type: "tool",
                            tool: {
                                id: "tool-1",
                                name: "list_files",
                                state: "completed",
                                summary: "finished",
                            },
                        },
                        { id: "text-2", type: "text", text: "After tool." },
                    ],
                } }));
        });
        expect(container.textContent).toMatch(/Before tool\.\s*list_files\s*finished\s*After tool\./);
    });
    it("opens markdown links in a new external window", () => {
        const open = vi
            .spyOn(window, "open")
            .mockImplementation(() => null);
        act(() => {
            root.render(_jsx(AgentConversationMessageView, { message: {
                    id: "message-1",
                    role: "assistant",
                    parts: [
                        {
                            id: "text-1",
                            type: "text",
                            text: "[Builder](https://builder.io/docs)",
                        },
                    ],
                } }));
        });
        container
            .querySelector("a")
            ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        expect(open).toHaveBeenCalledWith("https://builder.io/docs", "_blank", "noopener,noreferrer");
    });
});
//# sourceMappingURL=AgentConversation.spec.js.map