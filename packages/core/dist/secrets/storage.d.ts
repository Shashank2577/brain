/**
 * Storage layer for the framework secrets registry.
 *
 * Values are encrypted at rest with AES-256-GCM. The encryption key is
 * derived from `SECRETS_ENCRYPTION_KEY` (preferred) or the existing
 * `BETTER_AUTH_SECRET` env var (fallback so templates don't need a second
 * secret during development). If neither is set in production we fall back
 * to a machine-local key derived from the cwd — the secret is still only
 * readable on this machine, but consider setting `SECRETS_ENCRYPTION_KEY`
 * for a stable, rotatable key.
 *
 * Secret values are NEVER logged and NEVER returned from any route handler.
 */
import type { SecretScope } from "./register.js";
/**
 * Return the last 4 characters of a secret, with any leading characters
 * masked. Used to show a preview without leaking the value.
 */
export declare function last4(value: string): string;
export interface SecretRef {
    key: string;
    scope: SecretScope;
    scopeId: string;
}
export interface WriteSecretArgs extends SecretRef {
    value: string;
    /** Optional human-readable description (used for ad-hoc keys). */
    description?: string;
    /** Optional JSON-stringified array of allowed URL origins. */
    urlAllowlist?: string;
}
/**
 * Write (insert or update) a secret. The value is encrypted before being
 * stored — the caller's plaintext is never persisted. Returns the new
 * record's id.
 */
export declare function writeAppSecret(args: WriteSecretArgs): Promise<string>;
export interface ReadSecretResult {
    value: string;
    last4: string;
    updatedAt: number;
}
/**
 * Read a secret's plaintext value. Returns null when not found. The caller
 * is responsible for never logging the returned value.
 */
export declare function readAppSecret(ref: SecretRef): Promise<ReadSecretResult | null>;
/**
 * Return just the metadata for a secret (no value). Used by the list route so
 * the UI can show the "Set" pill and last-4 without the decrypted value going
 * over the wire.
 */
export declare function getAppSecretMeta(ref: SecretRef): Promise<{
    last4: string;
    updatedAt: number;
} | null>;
export interface SecretMeta {
    key: string;
    scope: SecretScope;
    scopeId: string;
    last4: string;
    description: string | null;
    urlAllowlist: string[] | null;
    createdAt: number;
    updatedAt: number;
}
/**
 * Read a secret's metadata, including ad-hoc fields (description, allowlist),
 * without ever decrypting or returning the plaintext value. Used by the
 * ad-hoc list route and any UI that wants to render a key tile.
 */
export declare function readAppSecretMeta(ref: SecretRef): Promise<SecretMeta | null>;
/**
 * List all secrets for a given scope. Returns metadata only — values are
 * never decrypted or returned. Used by the ad-hoc list route to surface
 * user-created keys.
 */
export declare function listAppSecretsForScope(scope: SecretScope, scopeId: string): Promise<SecretMeta[]>;
export declare function deleteAppSecret(ref: SecretRef): Promise<boolean>;
//# sourceMappingURL=storage.d.ts.map