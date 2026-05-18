export declare function isBlockedExtensionUrl(url: string): boolean;
/**
 * Async SSRF guard for environments that can resolve DNS. The synchronous
 * guard catches literals and known rebinding domains; this closes the common
 * "public hostname resolves to a private address" gap before dispatch.
 */
export declare function isBlockedExtensionUrlWithDns(url: string): Promise<boolean>;
/**
 * Build an undici Dispatcher whose connect-time DNS lookup runs through a
 * private-IP guard. This closes the TOCTOU gap where:
 *   1. We resolve hostname → public IP and pass.
 *   2. Between that lookup and the actual connect, DNS rebinding flips the
 *      record to a private IP.
 *   3. fetch() resolves again and connects to the private IP.
 *
 * With a custom dispatcher, the same lookup that produces the IP also gates
 * the connect: if the IP is in the private set, the connect throws.
 *
 * Returns `null` if undici / node:dns are not available (e.g. some edge
 * runtimes); the caller should fall back to the regular `fetch` path —
 * `isBlockedExtensionUrlWithDns` will still have caught most rebinding cases.
 */
export declare function createSsrfSafeDispatcher(): Promise<unknown | null>;
export { isBlockedExtensionUrl as isBlockedToolUrl };
export { isBlockedExtensionUrlWithDns as isBlockedToolUrlWithDns };
//# sourceMappingURL=url-safety.d.ts.map