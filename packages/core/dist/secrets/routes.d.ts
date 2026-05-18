/**
 * H3 event handlers for the framework secrets registry.
 *
 * Mounted under `/_agent-native/secrets/*` by `core-routes-plugin`.
 *
 * NEVER return a secret's plain-text value from any of these handlers.
 */
import { type SecretScope } from "./register.js";
export interface SecretStatusPayload {
    key: string;
    label: string;
    description?: string;
    docsUrl?: string;
    scope: SecretScope;
    kind: "api-key" | "oauth";
    required: boolean;
    /** "set" = value present; "unset" = not configured; "invalid" = validator failed. */
    status: "set" | "unset" | "invalid";
    /** Last 4 chars — only populated when status === "set" for api-key kind. */
    last4?: string;
    /** Timestamp (ms) of the last write — only populated when status === "set". */
    updatedAt?: number;
    /** OAuth-kind: the provider id backing this secret. */
    oauthProvider?: string;
    /** OAuth-kind: url the Connect button should point at. */
    oauthConnectUrl?: string;
    /** Validator error message if status === "invalid". */
    error?: string;
}
/** GET /_agent-native/secrets — list registered secrets with status. */
export declare function createListSecretsHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<SecretStatusPayload[] | {
    error: string;
}>>;
/** POST /_agent-native/secrets/:key — write a secret. */
export declare function createWriteSecretHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    ok?: undefined;
    status?: undefined;
} | {
    ok: boolean;
    status: string;
    error?: undefined;
} | {
    error: string;
    ok?: undefined;
    removed?: undefined;
} | {
    ok: boolean;
    removed: boolean;
    error?: undefined;
}>>;
/**
 * POST /_agent-native/secrets/:key/test — re-run the validator against the
 * current stored value without changing anything. Useful for the "Test" button.
 */
export declare function createTestSecretHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    ok?: undefined;
    note?: undefined;
} | {
    ok: boolean;
    error?: undefined;
    note?: undefined;
} | {
    ok: boolean;
    note: string;
    error?: undefined;
} | {
    ok: boolean;
    error: string;
    note?: undefined;
}>>;
export interface AdHocSecretPayload {
    name: string;
    scope: SecretScope;
    scopeId: string;
    description: string | null;
    last4: string;
    urlAllowlist: string[] | null;
    createdAt: number;
    updatedAt: number;
}
/**
 * Handler for `/_agent-native/secrets/adhoc[/:name]`.
 *
 * - GET (no name) — list all ad-hoc keys for the user's scope
 * - POST (no name) — create or update an ad-hoc key
 * - DELETE (with name) — delete an ad-hoc key
 *
 * Ad-hoc keys are arbitrary named secrets users or the agent create at
 * runtime for automation use (e.g. "SLACK_WEBHOOK", "HUBSPOT_API_KEY").
 * They differ from registered secrets (`registerRequiredSecret`) in that
 * they have no template-defined metadata, validator, or onboarding step.
 */
export declare function createAdHocSecretHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<AdHocSecretPayload[] | {
    error: string;
} | {
    ok: boolean;
    key: string;
    error?: undefined;
} | {
    ok: boolean;
    removed: boolean;
    error?: undefined;
}>>;
//# sourceMappingURL=routes.d.ts.map