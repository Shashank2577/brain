export interface ConnectBuilderCardProps {
    configured: boolean;
    /**
     * True when the server has a Builder branch project configured for this
     * request. When false, the card shows a waitlist CTA instead of a Send
     * button — the /builder/run endpoint would 403 anyway.
     */
    builderEnabled?: boolean;
    connectUrl: string;
    orgName?: string | null;
    /** The user's feature/change request, forwarded to Builder's cloud agent
     *  when they click Send. Empty for generic "connect Builder" prompts. */
    prompt?: string;
}
/**
 * Rich inline card rendered for the `connect-builder` tool call. Shows a
 * prominent Connect button that opens the Builder CLI auth flow and polls
 * /_agent-native/builder/status until credentials land.
 */
export declare function ConnectBuilderCard({ configured: initialConfigured, builderEnabled: initialBuilderEnabled, connectUrl: initialConnectUrl, orgName: initialOrgName, prompt, }: ConnectBuilderCardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ConnectBuilderCard.d.ts.map