export interface A2ACallerAuth {
    apiKey?: string;
    userEmail?: string;
    orgId?: string;
    orgDomain?: string;
    orgSecret?: string;
    metadata: Record<string, unknown>;
}
export declare function resolveA2ACallerAuth(options?: {
    expiresIn?: string | number;
    includeGoogleToken?: boolean;
}): Promise<A2ACallerAuth>;
//# sourceMappingURL=caller-auth.d.ts.map