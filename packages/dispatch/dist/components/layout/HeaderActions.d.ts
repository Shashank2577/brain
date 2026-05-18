import { type ReactNode, type FC } from "react";
/** Consumed only by <Header /> — returns the current title. */
export declare function useHeaderTitle(): ReactNode;
/** Consumed only by <Header /> — returns the current actions slot. */
export declare function useHeaderActions(): ReactNode;
/**
 * Provider is now a no-op wrapper for backwards compatibility — the state
 * lives in the module-level store above. Kept as a component so callers of
 * <HeaderActionsProvider> don't need to change.
 */
export declare const HeaderActionsProvider: FC<{
    children: ReactNode;
}>;
/** Mount a custom title into the app header. Cleans up on unmount. */
export declare function useSetPageTitle(node: ReactNode): void;
/** Mount ReactNode into the header's actions slot. Cleans up on unmount. */
export declare function useSetHeaderActions(node: ReactNode): void;
//# sourceMappingURL=HeaderActions.d.ts.map