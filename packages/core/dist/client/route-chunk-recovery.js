const INSTALL_KEY = "__agentNativeRouteChunkRecoveryInstalled";
const INTENDED_NAV_MAX_AGE_MS = 15_000;
export function createRouteChunkRecoveryState() {
    return {
        intendedHref: null,
        intendedAt: 0,
        routeModuleFailureAt: 0,
        recoveryHref: null,
        recovering: false,
    };
}
export function isRouteModuleReloadMessage(value) {
    return (typeof value === "string" &&
        /Error loading route module `[^`]+`, reloading page\.\.\./.test(value));
}
export function isDynamicImportFailureMessage(value) {
    if (typeof value !== "string")
        return false;
    return (value.includes("Failed to fetch dynamically imported module") ||
        value.includes("error loading dynamically imported module") ||
        value.includes("Importing a module script failed"));
}
export function rememberIntendedNavigation(state, href, now = Date.now()) {
    state.intendedHref = href;
    state.intendedAt = now;
}
export function getFreshIntendedNavigation(state, currentHref, now = Date.now()) {
    if (!state.intendedHref)
        return null;
    if (now - state.intendedAt > INTENDED_NAV_MAX_AGE_MS)
        return null;
    if (state.intendedHref === currentHref)
        return null;
    return state.intendedHref;
}
function anchorFromTarget(target) {
    let node = target;
    while (node) {
        if (node.tagName?.toUpperCase() === "A" &&
            typeof node.href === "string") {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}
function sameOriginHref(win, href) {
    try {
        const url = new URL(href, win.location.href);
        return url.origin === win.location.origin ? url.href : null;
    }
    catch {
        return null;
    }
}
export function intendedHrefFromClick(win, event) {
    if (event.defaultPrevented)
        return null;
    if (event.button !== 0)
        return null;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return null;
    }
    const anchor = anchorFromTarget(event.target);
    if (!anchor)
        return null;
    if (anchor.hasAttribute("download"))
        return null;
    const target = anchor.getAttribute("target");
    if (target && target !== "_self")
        return null;
    return sameOriginHref(win, anchor.href);
}
function hardNavigate(win, href) {
    try {
        win.location.assign(href);
    }
    catch {
        win.location.href = href;
    }
}
function isAgentNativeDesktop(win) {
    return /AgentNativeDesktop/i.test(win.navigator?.userAgent || "");
}
function recoverToIntendedNavigation(win, state) {
    const target = getFreshIntendedNavigation(state, win.location.href);
    if (!target)
        return false;
    state.recovering = true;
    state.recoveryHref = target;
    // Desktop webviews stay open across many deploys; a forced navigation here
    // reads as a random tab reload. Leave the current view alive instead.
    if (isAgentNativeDesktop(win))
        return true;
    try {
        win.history.replaceState(win.history.state, "", target);
    }
    catch { }
    hardNavigate(win, target);
    return true;
}
function patchHistoryMethod(win, state, method) {
    const original = win.history[method];
    win.history[method] = function patchedHistoryMethod(...args) {
        if (typeof args[2] === "string" || args[2] instanceof URL) {
            const href = sameOriginHref(win, String(args[2]));
            if (href)
                rememberIntendedNavigation(state, href);
        }
        return original.apply(this, args);
    };
}
function patchReload(win, state) {
    const originalReload = win.location.reload.bind(win.location);
    const patchedReload = function patchedReload() {
        if (isAgentNativeDesktop(win) &&
            Date.now() - state.routeModuleFailureAt <= 1_000) {
            return;
        }
        if (state.recoveryHref &&
            Date.now() - state.routeModuleFailureAt <= 1_000) {
            hardNavigate(win, state.recoveryHref);
            return;
        }
        if (Date.now() - state.routeModuleFailureAt <= 1_000 &&
            recoverToIntendedNavigation(win, state)) {
            return;
        }
        originalReload();
    };
    try {
        Object.defineProperty(win.location, "reload", {
            configurable: true,
            value: patchedReload,
        });
    }
    catch {
        try {
            win.location.reload = patchedReload;
        }
        catch { }
    }
}
export function installRouteChunkRecovery(win = typeof window === "undefined" ? undefined : window) {
    const consoleRef = win
        ?.console;
    if (!win?.document ||
        !win.location ||
        !win.history ||
        typeof win.addEventListener !== "function" ||
        !consoleRef) {
        return;
    }
    const installedTarget = win;
    if (installedTarget[INSTALL_KEY])
        return;
    installedTarget[INSTALL_KEY] = true;
    const state = createRouteChunkRecoveryState();
    win.document.addEventListener("click", (event) => {
        const href = intendedHrefFromClick(win, event);
        if (href)
            rememberIntendedNavigation(state, href);
    }, true);
    patchHistoryMethod(win, state, "pushState");
    patchHistoryMethod(win, state, "replaceState");
    patchReload(win, state);
    win.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        const message = String(reason?.message || reason || "");
        if (!isDynamicImportFailureMessage(message))
            return;
        state.routeModuleFailureAt = Date.now();
        if (recoverToIntendedNavigation(win, state)) {
            event.preventDefault();
        }
    });
    // React Router catches stale route-module import failures and reloads the
    // current URL. Its console message is the only signal exposed before reload.
    const originalError = consoleRef.error.bind(consoleRef);
    try {
        consoleRef.error = (...args) => {
            if (args.some(isRouteModuleReloadMessage)) {
                state.routeModuleFailureAt = Date.now();
                recoverToIntendedNavigation(win, state);
            }
            originalError(...args);
        };
    }
    catch { }
}
//# sourceMappingURL=route-chunk-recovery.js.map