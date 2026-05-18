/**
 * Defer plugin construction until the Nitro plugin actually fires so the
 * config-aware system prompt resolves AFTER `setupDispatch(config)` has
 * stamped the active config (plugin module load order is not guaranteed).
 */
declare const dispatchIntegrationsPlugin: (nitroApp: any) => Promise<void>;
export default dispatchIntegrationsPlugin;
//# sourceMappingURL=integrations.d.ts.map