const STORAGE_KEY = "agent-chat-active-run";
export function setActiveRun(state) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    catch { }
}
export function getActiveRun() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function updateActiveRunSeq(seq) {
    const state = getActiveRun();
    if (state) {
        state.lastSeq = seq;
        setActiveRun(state);
    }
}
export function clearActiveRun() {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    }
    catch { }
}
//# sourceMappingURL=active-run-state.js.map