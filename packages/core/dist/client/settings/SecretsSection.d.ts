/**
 * <SecretsSection /> — renders the registered secrets from the framework
 * secrets registry. Fetches `/_agent-native/secrets` on mount and shows a
 * card per secret with a masked input + Save / Rotate / Delete / Test
 * buttons (api-key kind) or a Connect / Disconnect button (oauth kind).
 */
export interface SecretsSectionProps {
    /** Optional hash fragment to focus a specific secret (e.g. "secrets:OPENAI_API_KEY"). */
    focusKey?: string;
}
export declare function SecretsSection({ focusKey }: SecretsSectionProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SecretsSection.d.ts.map