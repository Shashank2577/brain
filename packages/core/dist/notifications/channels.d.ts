/**
 * Built-in notification channels.
 *
 * Set environment variables to auto-register the webhook channel at startup.
 * Extra channels can be registered at any time via
 * `registerNotificationChannel()` from a server plugin.
 *
 * NOTIFICATIONS_WEBHOOK_URL  → POST notifications as JSON to this URL.
 *                              Supports `${keys.NAME}` substitution — the raw
 *                              value never enters the agent context.
 * NOTIFICATIONS_WEBHOOK_AUTH → optional `Authorization` header value (also
 *                              supports `${keys.NAME}`).
 */
export declare function registerBuiltinNotificationChannels(): void;
//# sourceMappingURL=channels.d.ts.map