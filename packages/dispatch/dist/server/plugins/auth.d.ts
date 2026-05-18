/**
 * Defer config + plugin construction until the Nitro plugin actually fires.
 * This way `setupDispatch(config)` can run after plugin module-load order
 * (Nitro doesn't guarantee load order across plugin files) and still feed
 * `googleOnly` / `marketing` into `createAuthPlugin`.
 */
declare const dispatchAuthPlugin: (nitroApp: any) => Promise<void>;
export default dispatchAuthPlugin;
//# sourceMappingURL=auth.d.ts.map