import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// @vitest-environment happy-dom
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareButton } from "./ShareButton.js";
const shareMutate = vi.hoisted(() => vi.fn());
const otherMutate = vi.hoisted(() => vi.fn());
const refetchShares = vi.hoisted(() => vi.fn(async () => undefined));
const sharesData = vi.hoisted(() => ({
    current: {
        ownerEmail: "owner@example.com",
        orgId: null,
        visibility: "private",
        role: "owner",
        shares: [],
    },
}));
vi.mock("../use-action.js", () => ({
    useActionQuery: () => ({
        data: sharesData.current,
        refetch: refetchShares,
    }),
    useActionMutation: (name) => ({
        mutate: name === "share-resource" ? shareMutate : otherMutate,
    }),
}));
vi.mock("../components/ui/popover.js", () => ({
    Popover: ({ children }) => (_jsx("div", { children: children })),
    PopoverTrigger: ({ children }) => (_jsx(_Fragment, { children: children })),
    PopoverContent: ({ children }) => (_jsx("div", { children: children })),
}));
function setInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")?.set;
    act(() => {
        setter?.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    });
}
describe("ShareButton", () => {
    let container;
    let root;
    let queryClient;
    beforeEach(() => {
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        vi.stubGlobal("fetch", vi.fn(async () => Response.json({
            members: [],
        })));
        shareMutate.mockReset();
        otherMutate.mockReset();
        refetchShares.mockClear();
        sharesData.current = {
            ownerEmail: "owner@example.com",
            orgId: null,
            visibility: "private",
            role: "owner",
            shares: [],
        };
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });
    afterEach(() => {
        act(() => root.unmount());
        queryClient.clear();
        container.remove();
        vi.unstubAllGlobals();
    });
    it("submits a typed email invite when Done is clicked", async () => {
        await act(async () => {
            root.render(_jsx(QueryClientProvider, { client: queryClient, children: _jsx(ShareButton, { resourceType: "document", resourceId: "doc-1", resourceTitle: "Launch notes", shareUrl: "https://content.agent-native.com/page/doc-1" }) }));
        });
        const input = container.querySelector('input[placeholder="Add people by email"]');
        setInputValue(input, "teammate@example.com");
        const done = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Done");
        if (!done)
            throw new Error("Done button not found");
        act(() => {
            done.click();
        });
        expect(shareMutate).toHaveBeenCalledWith(expect.objectContaining({
            resourceType: "document",
            resourceId: "doc-1",
            principalType: "user",
            principalId: "teammate@example.com",
            role: "viewer",
            notify: true,
            resourceUrl: "https://content.agent-native.com/page/doc-1",
        }), expect.any(Object));
    });
    it("shows the copy action for share URLs regardless of visibility", async () => {
        // Mirrors Google Slides: the copy button is always live. Access is
        // enforced when the recipient opens the URL, not by hiding the link in
        // the share dialog.
        await act(async () => {
            root.render(_jsx(QueryClientProvider, { client: queryClient, children: _jsx(ShareButton, { resourceType: "deck", resourceId: "deck-1", shareUrl: "https://slides.agent-native.com/deck/deck-1" }) }));
        });
        expect(Array.from(container.querySelectorAll("button")).some((button) => button.textContent === "Copy")).toBe(true);
    });
    it("renders both primary and secondary share URLs", async () => {
        await act(async () => {
            root.render(_jsx(QueryClientProvider, { client: queryClient, children: _jsx(ShareButton, { resourceType: "deck", resourceId: "deck-1", shareUrl: "https://slides.agent-native.com/deck/deck-1", shareUrlLabel: "Editor link", secondaryShareUrl: "https://slides.agent-native.com/p/deck-1", secondaryShareUrlLabel: "Presentation link" }) }));
        });
        const inputs = Array.from(container.querySelectorAll("input"));
        const editorInput = inputs.find((i) => i.value === "https://slides.agent-native.com/deck/deck-1");
        const presentationInput = inputs.find((i) => i.value === "https://slides.agent-native.com/p/deck-1");
        expect(editorInput).toBeTruthy();
        expect(presentationInput).toBeTruthy();
    });
});
//# sourceMappingURL=ShareButton.spec.js.map