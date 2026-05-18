/**
 * Server-side key substitution for automation tools.
 *
 * Resolves `${keys.NAME}` references in user-supplied strings (URLs, headers,
 * bodies, etc.) by looking up the named secret at tool-dispatch time. The
 * raw secret value NEVER enters the model's context — substitution happens
 * after the agent emits its tool call and before the request is dispatched.
 *
 * SECURITY — workspace-scope fallback (audit 05 H2):
 *
 * The user→workspace fallback is OPT-IN via the
 * `AGENT_NATIVE_KEYS_WORKSPACE_FALLBACK=1` env flag. Default OFF.
 *
 * When a user (any org member) writes a workspace-scoped `OPENAI_API_KEY`,
 * a default-on fallback would let every other org member's tools that
 * reference `${keys.OPENAI_API_KEY}` start using the malicious key
 * (key-skimming, mirror requests, billing hijack). The previous
 * fix-wave gated workspace-scope WRITES behind an org-admin check; this
 * file is the read-side defense-in-depth.
 *
 * When the env flag is unset, `resolveKeyReferences("user", scopeId)`
 * queries ONLY user-scope rows. Tools/automations that need shared
 * defaults must explicitly look up via `scope: "workspace"`. Most
 * installs benefit from the stricter default — opt in only after the
 * org-admin write-gate is verified to be active.
 */
import type { SecretScope } from "./register.js";
export interface ResolveKeyReferencesResult {
    resolved: string;
    usedKeys: string[];
    secretValues: string[];
}
/**
 * Resolve `${keys.NAME}` references in `text`. For each reference, looks up
 * the named secret at the given scope, falling back to workspace-scope when
 * the user-scope row doesn't exist. Throws when a referenced key is missing
 * so the agent receives a clear error rather than dispatching with the
 * literal placeholder.
 */
export declare function resolveKeyReferences(text: string, scope: SecretScope, scopeId: string): Promise<ResolveKeyReferencesResult>;
/**
 * Check if a URL is allowed by a key's URL allowlist. Returns true when no
 * allowlist is configured (permissive default — the allowlist is opt-in).
 *
 * Matching is exact on the URL's origin (scheme + host + port), so an entry
 * like `https://hooks.slack.com` blocks `https://evil.example.com` even if
 * the agent tries to redirect the request elsewhere.
 */
export declare function validateUrlAllowlist(url: string, allowlist: string[] | null): boolean;
/**
 * Convenience helper: look up a key's allowlist by name+scope. Returns null
 * when the key doesn't exist or has no allowlist configured.
 *
 * SECURITY: workspace fallback obeys the same opt-in flag as
 * `resolveKeyReferences` so the allowlist check stays consistent with the
 * resolved secret. If a future caller queries the allowlist for a key the
 * resolver wouldn't return, we'd risk allowing requests that the resolver
 * would refuse — keep them aligned.
 */
export declare function getKeyAllowlist(name: string, scope: SecretScope, scopeId: string): Promise<string[] | null>;
//# sourceMappingURL=substitution.d.ts.map