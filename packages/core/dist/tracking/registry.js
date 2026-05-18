const REGISTRY_KEY = Symbol.for("@agent-native/core/tracking.registry");
function getRegistry() {
    const g = globalThis;
    if (!g[REGISTRY_KEY])
        g[REGISTRY_KEY] = new Map();
    return g[REGISTRY_KEY];
}
export function registerTrackingProvider(provider) {
    if (!provider?.name) {
        throw new Error("registerTrackingProvider: provider.name is required");
    }
    if (typeof provider.track !== "function") {
        throw new Error("registerTrackingProvider: provider.track must be a function");
    }
    getRegistry().set(provider.name, provider);
}
export function unregisterTrackingProvider(name) {
    return getRegistry().delete(name);
}
export function listTrackingProviders() {
    return Array.from(getRegistry().keys());
}
export function track(name, properties, meta) {
    const event = {
        name,
        properties,
        timestamp: new Date().toISOString(),
        userId: meta?.userId,
    };
    for (const provider of getRegistry().values()) {
        try {
            const result = provider.track(event);
            if (result && typeof result.catch === "function") {
                result.catch((err) => {
                    console.error(`[tracking] Provider "${provider.name}" rejected:`, err);
                });
            }
        }
        catch (err) {
            console.error(`[tracking] Provider "${provider.name}" threw:`, err);
        }
    }
}
export function identify(userId, traits) {
    for (const provider of getRegistry().values()) {
        if (!provider.identify)
            continue;
        try {
            const result = provider.identify(userId, traits);
            if (result && typeof result.catch === "function") {
                result.catch(() => { });
            }
        }
        catch {
            // best-effort
        }
    }
}
export function flushTracking() {
    const promises = [];
    for (const provider of getRegistry().values()) {
        if (!provider.flush)
            continue;
        try {
            const result = provider.flush();
            if (result) {
                promises.push(result.catch((err) => {
                    console.error(`[tracking] Provider "${provider.name}" flush rejected:`, err);
                }));
            }
        }
        catch (err) {
            console.error(`[tracking] Provider "${provider.name}" flush threw:`, err);
            // best-effort
        }
    }
    return Promise.all(promises);
}
//# sourceMappingURL=registry.js.map