const providers = new Map();
/**
 * Register a backend for the framework-level `captureError()` utility.
 *
 * The default Sentry plugin registers itself here when a DSN is configured.
 * Keeping this registry Sentry-agnostic lets core runtime code report errors
 * without importing a Node-only SDK in edge/client-adjacent modules.
 */
export function registerErrorCaptureProvider(name, provider) {
    providers.set(name, provider);
    return () => {
        if (providers.get(name) === provider) {
            providers.delete(name);
        }
    };
}
/**
 * Capture an error through every configured provider. No-ops when no provider
 * is installed and never throws back into the application path.
 */
export function captureError(error, context = {}) {
    let eventId;
    for (const provider of providers.values()) {
        try {
            const result = provider(error, context);
            if (eventId === undefined && typeof result === "string") {
                eventId = result;
            }
        }
        catch {
            // Observability must never mask the original failure.
        }
    }
    return eventId;
}
export const captureServerError = captureError;
//# sourceMappingURL=capture-error.js.map