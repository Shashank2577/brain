/**
 * Whether deployment-wide `process.env` writes (and .env file writes) are safe.
 *
 * Production never allows request-time env writes, even with the escape hatch.
 * Env vars are deployment-wide globals and one tenant could otherwise
 * overwrite shared keys for every other tenant. Per-user/org credentials
 * should use `app_secrets` instead.
 */
export declare function isEnvVarWriteAllowed(): boolean;
//# sourceMappingURL=env-var-writes.d.ts.map