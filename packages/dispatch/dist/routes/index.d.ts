import { type RouteConfig } from "@react-router/dev/routes";
/**
 * Dispatch's routes as a programmatic `RouteConfig[]`. Splat into the
 * consumer's `app/routes.ts`:
 *
 * ```ts
 * import { type RouteConfig } from "@react-router/dev/routes";
 * import { dispatchRoutes } from "@agent-native/dispatch/routes";
 *
 * export default [
 *   ...localRoutes,    // consumer's own routes win on collision
 *   ...dispatchRoutes, // dispatch fills in everything else
 * ] satisfies RouteConfig;
 * ```
 *
 * Route precedence: React Router 7 matches in declaration order, so
 * placing `dispatchRoutes` LAST means consumer-defined routes with the
 * same path take precedence. To override a single dispatch route, define
 * it in your local routes; to keep it, omit it.
 *
 * The `file` paths below resolve relative to this file at runtime — they
 * point into `packages/dispatch/dist/routes/pages/*.js` after build.
 *
 * Naming maps the original flatRoutes file conventions:
 *   `_index.tsx`        → `index(...)`
 *   `<name>.tsx`        → `route("<name>", ...)`
 *   `<a>.$<param>.tsx`  → `route("<a>/:<param>", ...)`
 *   `<a>._index.tsx`    → flattened as `route("<a>", ...)` (workspace
 *      versions are bare and don't wrap a parent layout)
 */
export declare const dispatchRoutes: RouteConfig;
//# sourceMappingURL=index.d.ts.map