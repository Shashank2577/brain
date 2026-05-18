/**
 * Built-in tracking providers that auto-register from env vars.
 *
 * No SDK dependencies — uses raw HTTP to keep core lightweight.
 * Set the env var and tracking starts automatically.
 *
 * POSTHOG_API_KEY + POSTHOG_HOST  → PostHog
 * MIXPANEL_TOKEN                  → Mixpanel
 * AMPLITUDE_API_KEY               → Amplitude
 * AGENT_NATIVE_ANALYTICS_PUBLIC_KEY → Agent Native Analytics
 *
 * Call `registerBuiltinProviders()` at server startup (done
 * automatically by the core-routes plugin).
 */
import { registerTrackingProvider } from "./registry.js";
const POSTHOG_DEFAULT_HOST = "https://us.i.posthog.com";
const AGENT_NATIVE_ANALYTICS_DEFAULT_ENDPOINT = "https://analytics.agent-native.com/track";
const BATCH_INTERVAL_MS = 10_000;
const MAX_BATCH_SIZE = 50;
// Use globalThis so multiple ESM graph instances (Vite dev + Nitro symlinks)
// share one queue, matching the same pattern as the tracking registry.
const QUEUE_KEY = Symbol.for("@agent-native/core/tracking.queue");
const TIMER_KEY = Symbol.for("@agent-native/core/tracking.timer");
function getQueue() {
    const g = globalThis;
    if (!g[QUEUE_KEY])
        g[QUEUE_KEY] = [];
    return g[QUEUE_KEY];
}
function getTimer() {
    const g = globalThis;
    return g[TIMER_KEY] ?? null;
}
function setTimer(t) {
    globalThis[TIMER_KEY] = t;
}
function enqueue(url, body, headers) {
    const queue = getQueue();
    queue.push({ url, body, headers });
    if (queue.length >= MAX_BATCH_SIZE) {
        drainQueue();
    }
    else if (!getTimer()) {
        setTimer(setTimeout(drainQueue, BATCH_INTERVAL_MS));
    }
}
function drainQueue() {
    const t = getTimer();
    if (t) {
        clearTimeout(t);
        setTimer(null);
    }
    const queue = getQueue();
    const batch = queue.splice(0, queue.length);
    for (const item of batch) {
        fetch(item.url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...item.headers },
            body: item.body,
        }).catch(() => { });
    }
}
function isLocalhostUrl(value) {
    if (!value || !value.trim())
        return false;
    const raw = value.trim();
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
        ? raw
        : `https://${raw}`;
    try {
        const { hostname } = new URL(withProtocol);
        const h = hostname.toLowerCase();
        return (h === "localhost" ||
            h === "127.0.0.1" ||
            h === "::1" ||
            h === "[::1]" ||
            h.endsWith(".localhost") ||
            h.endsWith(".local"));
    }
    catch {
        return false;
    }
}
function shouldSkipAgentNativeAnalyticsForLocalhost() {
    if (process.env.AGENT_NATIVE_ANALYTICS_ALLOW_LOCALHOST === "true") {
        return false;
    }
    if (process.env.NODE_ENV === "development")
        return true;
    return [
        process.env.APP_URL,
        process.env.BETTER_AUTH_URL,
        process.env.URL,
        process.env.DEPLOY_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
        process.env.VERCEL_URL,
    ].some(isLocalhostUrl);
}
// ─── PostHog ───────────────────────────────────────────────────────────────
function createPostHogProvider(apiKey, host) {
    return {
        name: "posthog",
        track(event) {
            enqueue(`${host}/capture/`, JSON.stringify({
                api_key: apiKey,
                event: event.name,
                distinct_id: event.userId || "anonymous",
                properties: {
                    ...event.properties,
                    timestamp: event.timestamp,
                },
            }));
        },
        identify(userId, traits) {
            enqueue(`${host}/capture/`, JSON.stringify({
                api_key: apiKey,
                event: "$identify",
                distinct_id: userId,
                properties: { $set: traits },
            }));
        },
        flush: () => {
            drainQueue();
            return Promise.resolve();
        },
    };
}
// ─── Mixpanel ──────────────────────────────────────────────────────────────
function createMixpanelProvider(token) {
    return {
        name: "mixpanel",
        track(event) {
            const data = {
                event: event.name,
                properties: {
                    token,
                    distinct_id: event.userId || "anonymous",
                    time: event.timestamp
                        ? new Date(event.timestamp).getTime() / 1000
                        : undefined,
                    ...event.properties,
                },
            };
            enqueue("https://api.mixpanel.com/track", JSON.stringify([data]));
        },
        identify(userId, traits) {
            const data = {
                $token: token,
                $distinct_id: userId,
                $set: traits,
            };
            enqueue("https://api.mixpanel.com/engage", JSON.stringify([data]));
        },
        flush: () => {
            drainQueue();
            return Promise.resolve();
        },
    };
}
// ─── Amplitude ─────────────────────────────────────────────────────────────
function createAmplitudeProvider(apiKey) {
    return {
        name: "amplitude",
        track(event) {
            const data = {
                api_key: apiKey,
                events: [
                    {
                        event_type: event.name,
                        user_id: event.userId || "anonymous",
                        event_properties: event.properties,
                        time: event.timestamp
                            ? new Date(event.timestamp).getTime()
                            : undefined,
                    },
                ],
            };
            enqueue("https://api2.amplitude.com/2/httpapi", JSON.stringify(data));
        },
        identify(userId, traits) {
            const data = {
                api_key: apiKey,
                events: [
                    {
                        event_type: "$identify",
                        user_id: userId,
                        user_properties: { $set: traits },
                    },
                ],
            };
            enqueue("https://api2.amplitude.com/2/httpapi", JSON.stringify(data));
        },
        flush: () => {
            drainQueue();
            return Promise.resolve();
        },
    };
}
// ─── Webhook (custom HTTP endpoint) ───────────────────────────────────────
function createWebhookProvider(url, authHeader) {
    const extra = authHeader ? { Authorization: authHeader } : undefined;
    return {
        name: "webhook",
        track(event) {
            enqueue(url, JSON.stringify({
                event: event.name,
                properties: event.properties,
                userId: event.userId,
                timestamp: event.timestamp,
            }), extra);
        },
        identify(userId, traits) {
            enqueue(url, JSON.stringify({
                event: "$identify",
                userId,
                traits,
                timestamp: new Date().toISOString(),
            }), extra);
        },
        flush: () => {
            drainQueue();
            return Promise.resolve();
        },
    };
}
// ─── Agent Native Analytics ───────────────────────────────────────────────
function createAgentNativeAnalyticsProvider(publicKey, endpoint) {
    return {
        name: "agent-native-analytics",
        track(event) {
            enqueue(endpoint, JSON.stringify({
                publicKey,
                event: event.name,
                properties: event.properties ?? {},
                userId: event.userId,
                timestamp: event.timestamp,
            }));
        },
        identify(userId, traits) {
            enqueue(endpoint, JSON.stringify({
                publicKey,
                event: "$identify",
                userId,
                properties: traits ?? {},
                timestamp: new Date().toISOString(),
            }));
        },
        flush: () => {
            drainQueue();
            return Promise.resolve();
        },
    };
}
// ─── Auto-registration ────────────────────────────────────────────────────
let _registered = false;
export function registerBuiltinProviders() {
    if (_registered)
        return;
    _registered = true;
    const posthogKey = process.env.POSTHOG_API_KEY;
    if (posthogKey) {
        const host = (process.env.POSTHOG_HOST || POSTHOG_DEFAULT_HOST).replace(/\/+$/, "");
        registerTrackingProvider(createPostHogProvider(posthogKey, host));
    }
    const mixpanelToken = process.env.MIXPANEL_TOKEN;
    if (mixpanelToken) {
        registerTrackingProvider(createMixpanelProvider(mixpanelToken));
    }
    const amplitudeKey = process.env.AMPLITUDE_API_KEY;
    if (amplitudeKey) {
        registerTrackingProvider(createAmplitudeProvider(amplitudeKey));
    }
    const agentNativeAnalyticsKey = process.env.AGENT_NATIVE_ANALYTICS_PUBLIC_KEY;
    if (agentNativeAnalyticsKey &&
        !shouldSkipAgentNativeAnalyticsForLocalhost()) {
        registerTrackingProvider(createAgentNativeAnalyticsProvider(agentNativeAnalyticsKey, (process.env.AGENT_NATIVE_ANALYTICS_ENDPOINT ||
            AGENT_NATIVE_ANALYTICS_DEFAULT_ENDPOINT).replace(/\/+$/, "")));
    }
    const webhookUrl = process.env.TRACKING_WEBHOOK_URL;
    if (webhookUrl) {
        registerTrackingProvider(createWebhookProvider(webhookUrl, process.env.TRACKING_WEBHOOK_AUTH));
    }
}
//# sourceMappingURL=providers.js.map