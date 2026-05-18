/**
 * Resolve the user-facing name of this app — used in transactional emails,
 * page titles, and anywhere the framework needs to refer to "this app" by
 * name (e.g. "John invited you to Acme on Forms").
 *
 * Resolution order:
 *   1. `APP_NAME` env var — explicit override (recommended for prod)
 *   2. `displayName` from the app's package.json
 *   3. Titlecased `name` from package.json (only if it matches a known
 *      first-party template — on serverless runtimes `process.cwd()` may
 *      point at a bundler-generated package.json with a bogus name)
 *   4. First-party template label matched by package.json name
 *   5. `undefined` — caller should degrade gracefully
 */
export declare function getAppName(): string | undefined;
//# sourceMappingURL=app-name.d.ts.map