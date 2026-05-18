export interface RouteChunkRecoveryState {
    intendedHref: string | null;
    intendedAt: number;
    routeModuleFailureAt: number;
    recoveryHref: string | null;
    recovering: boolean;
}
export declare function createRouteChunkRecoveryState(): RouteChunkRecoveryState;
export declare function isRouteModuleReloadMessage(value: unknown): boolean;
export declare function isDynamicImportFailureMessage(value: unknown): boolean;
export declare function rememberIntendedNavigation(state: RouteChunkRecoveryState, href: string, now?: number): void;
export declare function getFreshIntendedNavigation(state: RouteChunkRecoveryState, currentHref: string, now?: number): string | null;
export declare function intendedHrefFromClick(win: Window, event: MouseEvent): string | null;
export declare function installRouteChunkRecovery(win?: Window | undefined): void;
//# sourceMappingURL=route-chunk-recovery.d.ts.map