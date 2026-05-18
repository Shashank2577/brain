const VALID = new Set([
    "auto",
    "popup",
    "redirect",
]);
function fromEnv() {
    const raw = (process.env.GOOGLE_AUTH_MODE || "").trim().toLowerCase();
    return VALID.has(raw) ? raw : undefined;
}
/**
 * Resolve the effective sign-in flow.
 *
 * Priority: explicit option > `GOOGLE_AUTH_MODE` env var > `'auto'`.
 */
export function resolveGoogleAuthMode(option) {
    if (option && VALID.has(option))
        return option;
    return fromEnv() ?? "auto";
}
//# sourceMappingURL=google-auth-mode.js.map