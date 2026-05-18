import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBuilderConnectFlow, withBuilderConnectTrackingParams, } from "./useBuilderStatus.js";
function jsonResponse(data) {
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
    });
}
function setUserAgent(userAgent) {
    Object.defineProperty(window.navigator, "userAgent", {
        value: userAgent,
        configurable: true,
    });
}
function BuilderConnectProbe({ enabled = true, popupUrl, }) {
    const flow = useBuilderConnectFlow({ enabled, popupUrl });
    return (_jsxs("div", { children: [_jsx("button", { type: "button", onClick: () => flow.start(), children: "Connect" }), _jsxs("output", { "data-testid": "status", children: [flow.configured ? "configured" : "not-configured", " ", flow.connecting ? "connecting" : "idle"] }), _jsx("output", { children: flow.error ?? "" })] }));
}
function createPopupStub() {
    const doc = document.implementation.createHTMLDocument("popup");
    return {
        closed: false,
        close: vi.fn(),
        document: doc,
        location: { href: "" },
        opener: window,
    };
}
const signedCliAuthUrl = "https://builder.io/cli-auth?response_type=code&host=agent-native-browser&client_id=Agent%20Native%20Browser&redirect_url=https%3A%2F%2Fagent-workspace.builder.io%2Fdispatch%2F_agent-native%2Fbuilder%2Fcallback%3F_an_state%3Dsigned&preview_url=https%3A%2F%2Fagent-workspace.builder.io%2Fdispatch&framework=agent-native";
const staleCliAuthUrl = signedCliAuthUrl.replace("_an_state%3Dsigned", "_an_state%3Dstale");
const refreshedCliAuthUrl = signedCliAuthUrl.replace("_an_state%3Dsigned", "_an_state%3Drefreshed");
function expectedConnectUrl(url) {
    return withBuilderConnectTrackingParams(url, {
        source: "builder_connect_flow",
        flow: "connect_llm",
    });
}
describe("useBuilderConnectFlow", () => {
    let container;
    let root;
    let openSpy;
    beforeEach(() => {
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        window.history.replaceState({}, "", "http://localhost:3000/settings");
        vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
            configured: false,
            envManaged: false,
            builderEnabled: true,
            orgName: null,
            cliAuthUrl: signedCliAuthUrl,
            connectUrl: "http://localhost:3000/_agent-native/builder/connect?_an_connect=signed",
            appHost: "https://builder.io",
            apiHost: "https://api.builder.io",
            publicKeyConfigured: false,
            privateKeyConfigured: false,
        })));
        openSpy = vi.fn(() => null);
        vi.stubGlobal("open", openSpy);
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });
    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });
    it("opens a blank web popup and navigates to a freshly fetched cli-auth URL", async () => {
        setUserAgent("Mozilla/5.0 Chrome/140.0");
        const popup = createPopupStub();
        openSpy.mockReturnValue(popup);
        await act(async () => {
            root.render(_jsx(BuilderConnectProbe, {}));
            await Promise.resolve();
            await Promise.resolve();
        });
        await act(async () => {
            container.querySelector("button")?.click();
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(openSpy).toHaveBeenCalledWith("about:blank", "_blank", "width=600,height=700");
        expect(popup.location.href).toBe(expectedConnectUrl(signedCliAuthUrl));
        expect(container.textContent).not.toContain("Popup blocked");
    });
    it("does not probe Builder status when disabled", async () => {
        await act(async () => {
            root.render(_jsx(BuilderConnectProbe, { enabled: false }));
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(fetch).not.toHaveBeenCalled();
        await act(async () => {
            container.querySelector("button")?.click();
            await Promise.resolve();
        });
        expect(openSpy).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
    });
    it("refreshes an un-timestamped signed prop URL before navigating web popups", async () => {
        setUserAgent("Mozilla/5.0 Chrome/140.0");
        const popup = createPopupStub();
        openSpy.mockReturnValue(popup);
        let resolveInitialFetch;
        const initialFetch = new Promise((resolve) => {
            resolveInitialFetch = resolve;
        });
        vi.mocked(fetch)
            .mockReturnValueOnce(initialFetch)
            .mockResolvedValue(jsonResponse({
            configured: false,
            envManaged: false,
            builderEnabled: true,
            orgName: null,
            cliAuthUrl: refreshedCliAuthUrl,
            connectUrl: "http://localhost:3000/_agent-native/builder/connect?_an_connect=signed",
            appHost: "https://builder.io",
            apiHost: "https://api.builder.io",
            publicKeyConfigured: false,
            privateKeyConfigured: false,
        }));
        await act(async () => {
            root.render(_jsx(BuilderConnectProbe, { popupUrl: staleCliAuthUrl }));
        });
        await act(async () => {
            container.querySelector("button")?.click();
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(openSpy).toHaveBeenCalledWith("about:blank", "_blank", "width=600,height=700");
        expect(popup.location.href).toBe(expectedConnectUrl(refreshedCliAuthUrl));
        resolveInitialFetch(jsonResponse({ configured: false }));
    });
    it("refreshes status when a Builder preview callback posts success", async () => {
        setUserAgent("Mozilla/5.0 Chrome/140.0");
        vi.mocked(fetch)
            .mockResolvedValueOnce(jsonResponse({
            configured: false,
            envManaged: false,
            builderEnabled: true,
            orgName: null,
            cliAuthUrl: signedCliAuthUrl,
            connectUrl: "http://localhost:3000/_agent-native/builder/connect?_an_connect=signed",
            appHost: "https://builder.io",
            apiHost: "https://api.builder.io",
            publicKeyConfigured: false,
            privateKeyConfigured: false,
        }))
            .mockResolvedValueOnce(jsonResponse({
            configured: true,
            envManaged: false,
            builderEnabled: true,
            orgName: "Builder space",
            cliAuthUrl: signedCliAuthUrl,
            connectUrl: "http://localhost:3000/_agent-native/builder/connect?_an_connect=signed",
            appHost: "https://builder.io",
            apiHost: "https://api.builder.io",
            publicKeyConfigured: true,
            privateKeyConfigured: true,
        }));
        await act(async () => {
            root.render(_jsx(BuilderConnectProbe, {}));
            await Promise.resolve();
        });
        expect(container.textContent).toContain("not-configured");
        await act(async () => {
            window.dispatchEvent(new MessageEvent("message", {
                origin: "https://940ebc5a83164aa6a37dde445e494f3a-fluid-crack-ctnhvsyb.builderio.xyz",
                data: { type: "builder-connect-success" },
            }));
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(container.textContent).toContain("configured");
    });
    it("clears the spinner when the callback succeeds but status never confirms credentials", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-14T12:00:00.000Z"));
        setUserAgent("Mozilla/5.0 Chrome/140.0");
        const popup = createPopupStub();
        openSpy.mockReturnValue(popup);
        vi.mocked(fetch).mockImplementation(async () => jsonResponse({
            configured: false,
            envManaged: false,
            builderEnabled: true,
            orgName: null,
            cliAuthUrl: signedCliAuthUrl,
            connectUrl: "http://localhost:3000/_agent-native/builder/connect?_an_connect=signed",
            appHost: "https://builder.io",
            apiHost: "https://api.builder.io",
            publicKeyConfigured: false,
            privateKeyConfigured: false,
        }));
        await act(async () => {
            root.render(_jsx(BuilderConnectProbe, {}));
            await Promise.resolve();
        });
        await act(async () => {
            container.querySelector("button")?.click();
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(container.textContent).toContain("not-configured connecting");
        await act(async () => {
            window.dispatchEvent(new MessageEvent("message", {
                origin: "https://agent-workspace.builder.io",
                data: { type: "builder-connect-success" },
            }));
            await vi.advanceTimersByTimeAsync(5000);
        });
        expect(container.textContent).toContain("not-configured idle");
        expect(container.textContent).toContain("couldn't confirm");
    });
    it("clears the spinner when the popup closes before status confirms credentials", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-14T12:00:00.000Z"));
        setUserAgent("Mozilla/5.0 Chrome/140.0");
        const popup = createPopupStub();
        openSpy.mockReturnValue(popup);
        vi.mocked(fetch).mockImplementation(async () => jsonResponse({
            configured: false,
            envManaged: false,
            builderEnabled: true,
            orgName: null,
            cliAuthUrl: signedCliAuthUrl,
            connectUrl: "http://localhost:3000/_agent-native/builder/connect?_an_connect=signed",
            appHost: "https://builder.io",
            apiHost: "https://api.builder.io",
            publicKeyConfigured: false,
            privateKeyConfigured: false,
        }));
        await act(async () => {
            root.render(_jsx(BuilderConnectProbe, {}));
            await Promise.resolve();
        });
        await act(async () => {
            container.querySelector("button")?.click();
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(container.textContent).toContain("not-configured connecting");
        popup.closed = true;
        await act(async () => {
            await vi.advanceTimersByTimeAsync(8000);
        });
        expect(container.textContent).toContain("not-configured idle");
        expect(container.textContent).toContain("couldn't confirm");
    });
    it("does not replace the desktop webview when Electron reports a handled popup as null", async () => {
        setUserAgent("Mozilla/5.0 Electron/41.2.2 AgentNativeDesktop/0.1.7");
        await act(async () => {
            root.render(_jsx(BuilderConnectProbe, {}));
        });
        await act(async () => {
            container.querySelector("button")?.click();
        });
        expect(openSpy).toHaveBeenCalledWith(expectedConnectUrl(signedCliAuthUrl), "_blank", "noopener,noreferrer");
        expect(window.location.href).toBe("http://localhost:3000/settings");
        expect(container.textContent).not.toContain("Popup blocked");
    });
    it("does not abort a reconnect popup because the old credential was rejected", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-14T12:00:00.000Z"));
        setUserAgent("Mozilla/5.0 Chrome/140.0");
        const popup = createPopupStub();
        openSpy.mockReturnValue(popup);
        const signedConnectUrl = "http://localhost:3000/_agent-native/builder/connect?_an_connect=signed";
        vi.mocked(fetch).mockImplementation(async () => jsonResponse({
            configured: false,
            envManaged: true,
            builderEnabled: true,
            orgName: null,
            connectUrl: signedConnectUrl,
            appHost: "https://builder.io",
            apiHost: "https://api.builder.io",
            publicKeyConfigured: false,
            privateKeyConfigured: false,
            authError: {
                message: "Private key does not match spaceId",
                at: Date.now() - 60_000,
            },
        }));
        await act(async () => {
            root.render(_jsx(BuilderConnectProbe, {}));
            await Promise.resolve();
        });
        expect(container.textContent).toContain("Private key does not match spaceId");
        await act(async () => {
            container.querySelector("button")?.click();
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(openSpy).toHaveBeenCalledWith("about:blank", "_blank", "width=600,height=700");
        expect(popup.location.href).toBe(expectedConnectUrl(signedConnectUrl));
        expect(container.textContent).toContain("not-configured connecting");
        expect(container.textContent).not.toContain("Private key does not match spaceId");
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });
        expect(container.textContent).toContain("not-configured connecting");
        expect(container.textContent).not.toContain("Private key does not match spaceId");
    });
    it("ignores stale connect callback errors after starting a fresh reconnect", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-14T12:00:00.000Z"));
        setUserAgent("Mozilla/5.0 Chrome/140.0");
        const popup = createPopupStub();
        openSpy.mockReturnValue(popup);
        const signedConnectUrl = "http://localhost:3000/_agent-native/builder/connect?_an_connect=signed";
        vi.mocked(fetch).mockImplementation(async () => jsonResponse({
            configured: false,
            envManaged: false,
            builderEnabled: true,
            orgName: null,
            connectUrl: signedConnectUrl,
            appHost: "https://builder.io",
            apiHost: "https://api.builder.io",
            publicKeyConfigured: false,
            privateKeyConfigured: false,
            connectError: {
                message: "No active connect flow found",
                at: Date.now() - 60_000,
            },
        }));
        await act(async () => {
            root.render(_jsx(BuilderConnectProbe, {}));
            await Promise.resolve();
        });
        expect(container.textContent).toContain("No active connect flow found");
        await act(async () => {
            container.querySelector("button")?.click();
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });
        expect(container.textContent).toContain("not-configured connecting");
        expect(container.textContent).not.toContain("No active connect flow found");
    });
});
//# sourceMappingURL=useBuilderStatus.spec.js.map