/**
 * Runtime detection utilities.
 *
 * Detect whether the code is running in Node.js, Cloudflare Workers,
 * Deno, or another edge runtime. Used to gracefully skip Node-only
 * features (filesystem, PTY, file watching) on edge runtimes.
 */
/** True when running in a full Node.js environment (not CF Workers, not Deno). */
export declare function isNodeRuntime(): boolean;
/** True when running in Cloudflare Workers/Pages. */
export declare function isCloudflareRuntime(): boolean;
/** True when running in any edge/serverless runtime (not full Node.js). */
export declare function isEdgeRuntime(): boolean;
//# sourceMappingURL=runtime.d.ts.map