import type { FileUploadInput, FileUploadProvider, FileUploadResult } from "./types.js";
/**
 * Register a file upload provider. Call from a server plugin or app
 * bootstrap. Idempotent per id — later calls with the same id replace.
 */
export declare function registerFileUploadProvider(provider: FileUploadProvider): void;
export declare function unregisterFileUploadProvider(id: string): void;
export declare function listFileUploadProviders(): FileUploadProvider[];
/**
 * Returns the first configured provider, checking user-registered ones first
 * and falling back to the built-in Builder.io provider when its env is set.
 * Returns `null` when nothing is configured — callers should then use the
 * SQL fallback.
 */
export declare function getActiveFileUploadProvider(): FileUploadProvider | null;
/**
 * Upload a file via the active provider, or `null` if no provider is
 * configured. Callers use `null` as the signal to fall back to SQL
 * storage. On the first fallback we log a one-time warning because
 * storing files in SQL is not optimal for production.
 */
export declare function uploadFile(input: FileUploadInput): Promise<FileUploadResult | null>;
//# sourceMappingURL=registry.d.ts.map