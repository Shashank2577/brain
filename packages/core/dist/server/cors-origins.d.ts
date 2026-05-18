export interface CorsOriginOptions {
    allowedOrigins?: string[];
    allowAnyOriginWhenNoAllowlist?: boolean;
    allowLocalhostWhenNoAllowlist?: boolean;
}
export declare function readCorsAllowedOrigins(): string[];
export declare function isTrustedNativeAppOrigin(origin: string): boolean;
export declare function isLocalhostOrigin(origin: string): boolean;
export declare function getAllowedCorsOrigin(origin: string | undefined, options?: CorsOriginOptions): string | null;
//# sourceMappingURL=cors-origins.d.ts.map