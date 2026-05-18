import type { H3Event } from "h3";
export interface MountBrowserSessionRoutesOptions {
    routePrefix?: string;
    getOwnerFromEvent?: (event: H3Event) => string | Promise<string>;
}
export declare function mountBrowserSessionRoutes(nitroApp: any, options?: MountBrowserSessionRoutesOptions): void;
//# sourceMappingURL=routes.d.ts.map