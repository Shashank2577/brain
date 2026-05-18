import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatModels } from "./use-chat-models.js";
function ChatModelsProbe({ enabled }) {
    const models = useChatModels({ enabled, storageKey: null });
    return (_jsxs("button", { type: "button", onClick: models.refreshEngines, children: [models.selectedModel, ":", models.availableModels.length] }));
}
describe("useChatModels", () => {
    let container;
    let root;
    beforeEach(() => {
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });
    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });
    it("does not probe framework model endpoints when disabled", async () => {
        await act(async () => {
            root.render(_jsx(ChatModelsProbe, { enabled: false }));
            await Promise.resolve();
        });
        expect(fetch).not.toHaveBeenCalled();
        await act(async () => {
            container.querySelector("button")?.click();
            await Promise.resolve();
        });
        expect(fetch).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=use-chat-models.spec.js.map