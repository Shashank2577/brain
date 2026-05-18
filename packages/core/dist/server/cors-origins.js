const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|tauri\.localhost)(:\d+)?$/;
const NATIVE_APP_ORIGIN_RE = /^(tauri:\/\/(localhost|tauri\.localhost)|https?:\/\/tauri\.localhost(:\d+)?)$/;
export function readCorsAllowedOrigins() {
    return (process.env.CORS_ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}
export function isTrustedNativeAppOrigin(origin) {
    return NATIVE_APP_ORIGIN_RE.test(origin);
}
export function isLocalhostOrigin(origin) {
    return LOCALHOST_ORIGIN_RE.test(origin);
}
export function getAllowedCorsOrigin(origin, options = {}) {
    if (!origin)
        return null;
    // Tauri's production WebView uses a private app origin. It is not a
    // deploy-configured website origin, so keep it reachable even when an app
    // also has CORS_ALLOWED_ORIGINS for browser embeds or previews.
    if (isTrustedNativeAppOrigin(origin))
        return origin;
    const allowedOrigins = options.allowedOrigins ?? readCorsAllowedOrigins();
    if (allowedOrigins.length > 0) {
        return allowedOrigins.includes(origin) ? origin : null;
    }
    if (options.allowAnyOriginWhenNoAllowlist)
        return origin;
    if (options.allowLocalhostWhenNoAllowlist !== false) {
        return isLocalhostOrigin(origin) ? origin : null;
    }
    return null;
}
//# sourceMappingURL=cors-origins.js.map