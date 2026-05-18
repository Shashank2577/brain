/**
 * A2A auth policy helpers shared by discovery, the JSON-RPC gate, and task
 * handlers. Serverless providers do not always expose `NODE_ENV=production`
 * consistently at runtime, so production-like A2A checks also look at the
 * provider flags those platforms set in deployed functions.
 */
export declare function isA2AProductionRuntime(): boolean;
export declare function hasConfiguredA2ASecret(): boolean;
export declare function shouldAdvertiseJwtA2AAuth(): boolean;
//# sourceMappingURL=auth-policy.d.ts.map