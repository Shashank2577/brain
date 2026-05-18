/**
 * Resolve the canonical URL of this app — used in transactional emails,
 * invite links, and anywhere we need an absolute URL that remains valid
 * outside the current request context.
 *
 * Resolution order:
 *   1. Explicit public URL env vars (`APP_URL`, workspace OAuth origin,
 *      `BETTER_AUTH_URL`) — operator overrides
 *   2. Incoming request's origin (when an H3Event is available)
 *   3. First-party template `prodUrl` from the registry (matched by
 *      package.json name) — lets deployed first-party apps (mail,
 *      calendar, analytics, …) use e.g. `analytics.agent-native.com`
 *      instead of their Netlify preview hostname.
 *   4. Platform-injected URL (Netlify `URL`, Vercel `VERCEL_URL`) —
 *      automatically set by the hosting platform, so user-deployed apps
 *      get a real hostname in emails without needing to set `APP_URL`.
 *   5. Public `WORKSPACE_GATEWAY_URL` — multi-app workspace gateway
 *   6. Local `WORKSPACE_GATEWAY_URL` — local multi-app workspace gateway
 *   7. `http://localhost:3000`
 *
 * Older versions preferred `WORKSPACE_GATEWAY_URL` before platform URLs.
 * That is fine for local development, but in hosted Builder Desktop sessions
 * the gateway can be `127.0.0.1`, which must not become Better Auth's
 * production base URL.
 */
import { type H3Event } from "h3";
/**
 * Look up the first-party template `prodUrl` for the current app based on
 * its `package.json` name. Returns undefined if the app isn't a known
 * first-party template or the template has no `prodUrl`.
 */
export declare function getFirstPartyProdUrl(): string | undefined;
export declare function getAppProductionUrl(event?: H3Event): string;
//# sourceMappingURL=app-url.d.ts.map