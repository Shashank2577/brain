export declare const LLM_MISSING_CREDENTIALS_ERROR_CODE = "missing_credentials";
export declare const LLM_MISSING_CREDENTIALS_MESSAGE = "No LLM provider is connected. Open this app's Agent settings > LLM, then connect Builder.io or add a provider key.";
export declare function isLlmCredentialError(error: unknown, errorCode?: string | null): boolean;
export declare function formatLlmCredentialErrorMessage(options?: {
    agentName?: string;
}): string;
export declare function userFacingLlmCredentialError(error: unknown, options?: {
    agentName?: string;
}): string | null;
//# sourceMappingURL=credential-errors.d.ts.map