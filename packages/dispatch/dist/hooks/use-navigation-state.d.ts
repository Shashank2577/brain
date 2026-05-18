import type { DispatchExtensionConfig } from "../components/index.js";
export interface NavigationState {
    view: string;
    path?: string;
    dreamId?: string;
    sourceId?: string;
    query?: string;
}
export declare function useNavigationState(extensions?: DispatchExtensionConfig): void;
//# sourceMappingURL=use-navigation-state.d.ts.map