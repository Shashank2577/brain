type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
export declare function createSentryPlugin(): NitroPluginDef;
/**
 * Default Sentry plugin — auto-mounts when a template doesn't define its
 * own `server/plugins/sentry.ts`. Reads `SENTRY_SERVER_DSN`/`SENTRY_DSN` from env and
 * silently no-ops when it's unset, so this is safe to default-mount in
 * every template (including local dev with no DSN configured).
 */
export declare const defaultSentryPlugin: NitroPluginDef;
export {};
//# sourceMappingURL=sentry-plugin.d.ts.map