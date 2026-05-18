import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useSyncExternalStore, } from "react";
let currentTitle = null;
let currentActions = null;
const listeners = new Set();
function notify() {
    for (const l of listeners)
        l();
}
function subscribe(l) {
    listeners.add(l);
    return () => {
        listeners.delete(l);
    };
}
/** Consumed only by <Header /> — returns the current title. */
export function useHeaderTitle() {
    return useSyncExternalStore(subscribe, () => currentTitle, () => currentTitle);
}
/** Consumed only by <Header /> — returns the current actions slot. */
export function useHeaderActions() {
    return useSyncExternalStore(subscribe, () => currentActions, () => currentActions);
}
/**
 * Provider is now a no-op wrapper for backwards compatibility — the state
 * lives in the module-level store above. Kept as a component so callers of
 * <HeaderActionsProvider> don't need to change.
 */
export const HeaderActionsProvider = ({ children, }) => _jsx(_Fragment, { children: children });
/** Mount a custom title into the app header. Cleans up on unmount. */
export function useSetPageTitle(node) {
    useEffect(() => {
        currentTitle = node;
        notify();
        return () => {
            currentTitle = null;
            notify();
        };
    });
}
/** Mount ReactNode into the header's actions slot. Cleans up on unmount. */
export function useSetHeaderActions(node) {
    useEffect(() => {
        currentActions = node;
        notify();
        return () => {
            currentActions = null;
            notify();
        };
    });
}
//# sourceMappingURL=HeaderActions.js.map