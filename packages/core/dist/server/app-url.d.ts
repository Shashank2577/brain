/**
 * Resolve the canonical URL of this app — used in transactional emails,
 * invite links, and anywhere we need an absolute URL that remains valid
 * outside the current request context.
 *
 * Resolution order:
 *   1. `APP_URL` env var — explicit override
 *   2. `BETTER_AUTH_URL` env var — Better Auth's canonical URL
 *   3. `WORKSPACE_GATEWAY_URL` — local multi-app workspace gateway
 *   4. First-party template `prodUrl` from the registry (matched by
 *      package.json name) — lets deployed first-party apps (mail,
 *      calendar, analytics, …) use e.g. `analytics.agent-native.com`
 *      instead of their Netlify preview hostname.
 *   5. Incoming request's origin (when an H3Event is available)
 *   6. Platform-injected URL (Netlify `URL`, Vercel `VERCEL_URL`) —
 *      automatically set by the hosting platform, so user-deployed apps
 *      get a real hostname in emails without needing to set `APP_URL`.
 *   7. `http://localhost:3000`
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