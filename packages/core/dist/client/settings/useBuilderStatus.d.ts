export interface BuilderStatus {
    configured: boolean;
    builderEnabled: boolean;
    /**
     * True when `BUILDER_PRIVATE_KEY` is set at the deploy level. This is a
     * fallback credential; per-user/org Builder connections are still allowed
     * and take precedence for that request.
     */
    envManaged?: boolean;
    credentialSource?: "user" | "org" | "env";
    connectUrl: string;
    appHost: string;
    apiHost: string;
    branchProjectIdConfigured?: boolean;
    branchProjectId?: string;
    publicKeyConfigured: boolean;
    privateKeyConfigured: boolean;
    userId?: string;
    orgName?: string;
    orgKind?: string;
    /**
     * Set when the OAuth callback ran but failed to persist credentials.
     * Surfaced as a one-shot row by the server so the connect-flow polling
     * can stop with a clear message instead of timing out at 5min.
     */
    connectError?: {
        message: string;
        at: number;
    };
}
/**
 * Fetches Builder connection status from /_agent-native/builder/status.
 * Re-fetches on window focus to detect post-redirect state changes.
 */
export declare function useBuilderStatus(): {
    status: BuilderStatus;
    loading: boolean;
    refetch: () => Promise<void>;
};
export interface BuilderConnectFlowOptions {
    /** URL to synchronously open on start(). Defaults to the 302 shortcut. */
    popupUrl?: string;
    /** Invoked after the status poll first sees `configured: true`. */
    onConnected?: (state: {
        orgName: string | null;
    }) => void | Promise<void>;
}
export interface BuilderConnectFlow {
    configured: boolean;
    /**
     * True when the deploy has BUILDER_PRIVATE_KEY set as a fallback. Connect
     * is still available so users can override the fallback with their own
     * Builder account.
     */
    envManaged: boolean;
    /**
     * True when the server has a Builder branch project configured for this
     * request. When false, the card surfaces a waitlist CTA instead of a Send
     * button.
     */
    builderEnabled: boolean;
    orgName: string | null;
    connecting: boolean;
    error: string | null;
    /**
     * True once the first `/builder/status` fetch has completed (successfully
     * or not). Consumers that accept an `initialConfigured` prop (e.g. agent
     * tool-call results rendered with server-side state) should treat
     * `configured`/`orgName` as authoritative only once this flips true —
     * otherwise the hook's starting `false` defaults would cause a flash
     * back to "Connect Builder" on first paint.
     */
    hasFetchedStatus: boolean;
    /** Open the popup and begin polling. Must be called from a user-gesture handler. */
    start: () => void;
}
export declare function useBuilderConnectFlow(opts?: BuilderConnectFlowOptions): BuilderConnectFlow;
//# sourceMappingURL=useBuilderStatus.d.ts.map