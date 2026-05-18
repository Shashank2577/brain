export declare function getWorkspaceGatewayReturnOrigin(): string;
export declare function safeOAuthReturnUrl(raw: string | null | undefined, opts?: {
    allowDefaultLoopback?: boolean;
    allowedOrigins?: Iterable<string | undefined>;
}): string;
export declare function appendSessionToOAuthReturnUrl(raw: string | null | undefined, sessionToken: string | undefined): string;
//# sourceMappingURL=oauth-return-url.d.ts.map