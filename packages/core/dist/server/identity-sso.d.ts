/**
 * Cross-app SSO ("Sign in with Agent-Native") — the CLIENT side.
 *
 * Each hosted `*.agent-native.com` app has its OWN Better Auth user store
 * (a separate database per app). This module lets an app federate sign-in to
 * an identity authority (Dispatch) so a user logged in there can land in this
 * app without re-entering credentials.
 *
 * Opt-in, OFF by default, fully reversible. Everything here is gated on the
 * single env var `AGENT_NATIVE_IDENTITY_HUB_URL`:
 *
 *   - UNSET  → `isIdentitySsoEnabled()` is false. The route handler 404s, the
 *     auth-guard bypass does not apply, and the login page renders no SSO
 *     button. Existing auth is byte-for-byte unchanged.
 *   - SET    (e.g. `https://dispatch.agent-native.com`) → two routes mount:
 *       GET /_agent-native/identity/login
 *         302 → `<HUB>/_agent-native/identity/authorize?app=<id>
 *                 &redirect_uri=<thisOrigin>/_agent-native/identity/callback
 *                 &state=<single-use CSRF state>`
 *       GET /_agent-native/identity/callback?token=<jwt>&state=<state>
 *         Verifies the hub-issued identity JWT (HS256 over the SHARED A2A
 *         secret — the exact verify path A2A / MCP `verifyAuth` use), checks
 *         `scope:"identity"`, `exp`, single-use CSRF `state`, and (best
 *         effort) `jti` replay, then JIT-links the verified email into this
 *         app's local Better Auth store and mints a normal framework session
 *         the SAME way the Google OAuth callback does.
 *
 * Crypto reuse: the hub signs with `jose.SignJWT(...).sign(A2A_SECRET)` (the
 * existing `signA2AToken` builder). We verify with the identical
 * `jose.jwtVerify(token, A2A_SECRET)` call `mcp/build-server.ts#verifyAuth`
 * uses — no new crypto, no new keys.
 *
 * Session reuse: a NEW email is created via `auth.api.signUpEmail` — the
 * exact Better Auth signup path `maybeAutoCreateDevSession` already uses, so
 * the adapter creates the `user` (+ adapter-managed credential `account`)
 * row schema-correctly and the normal `databaseHooks.user.create.after`
 * (org auto-join, analytics) fires. The framework session is then minted via
 * `createOAuthSession` — the literal Google-OAuth session-mint path
 * (`addSession` + `setFrameworkSessionCookie`). An EXISTING email is never
 * mutated: we only ADD an inert federated-provider `account` row (if absent)
 * and mint the same framework session. Removing the env returns the app to
 * its prior auth with no residue.
 */
import type { H3Event } from "h3";
import { getIdentityHubUrl, isIdentitySsoEnabled, identitySsoLoginButtonHtml } from "./identity-sso-store.js";
export { getIdentityHubUrl, isIdentitySsoEnabled, identitySsoLoginButtonHtml };
/**
 * The provider id recorded on the additive `account` row we link for an
 * EXISTING local user. Must match the value the Dispatch authority agent
 * expects to interoperate with — documented in the report so the two sides
 * stay in sync. Inert when this provider is unused, so removing the env var
 * leaves no behavioural residue.
 */
export declare const IDENTITY_SSO_PROVIDER_ID = "agent-native";
/**
 * The JWT `scope` claim the hub MUST set on the identity token. The callback
 * rejects any token whose `scope` is not exactly this value, so an A2A
 * delegation JWT (no scope, or `scope:"mcp-connect"`) can never be replayed
 * as an identity assertion.
 */
export declare const IDENTITY_SSO_SCOPE = "identity";
/**
 * Handle a `/_agent-native/identity/*` request. `subpath` is the part after
 * `/identity` (e.g. `/login`, `/callback`). Returns a 404 Response whenever
 * the feature is disabled so an unset env var is a true no-op even if the
 * route somehow gets mounted.
 */
export declare function handleIdentitySso(event: H3Event, subpath: string): Promise<Response>;
/**
 * Whether the given (already base-path-stripped) request path is one of the
 * SSO routes that must bypass the blanket auth guard. Both routes resolve /
 * mint the browser session themselves: `/login` is the unauthenticated entry
 * point, and `/callback` is hit by a user who is (by definition) not yet
 * signed in to THIS app. Returns false when the feature is disabled, so the
 * guard's behaviour is unchanged with the env unset.
 */
export declare function isIdentitySsoBypassPath(p: string): boolean;
//# sourceMappingURL=identity-sso.d.ts.map