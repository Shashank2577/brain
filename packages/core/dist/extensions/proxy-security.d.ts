export declare const MAX_EXTENSION_PROXY_RESPONSE_SIZE: number;
export declare function normalizeExtensionProxyMethod(value: unknown): string | null;
export declare function sanitizeOutboundHeaders(value: unknown): Record<string, string>;
export declare function collectSecretValues(...groups: Array<Array<string> | undefined>): string[];
export declare function redactSecrets<T>(value: T, secretValues: string[]): T;
export declare function redactString(text: string, secretValues: string[]): string;
export declare function readResponseTextWithLimit(response: Response, maxBytes?: number): Promise<{
    text: string;
    truncated: boolean;
    size: number;
}>;
//# sourceMappingURL=proxy-security.d.ts.map