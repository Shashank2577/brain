const CTX_KEY = Symbol.for("@agent-native/scheduling.context");
export function setSchedulingContext(c) {
    globalThis[CTX_KEY] = c;
}
export function getSchedulingContext() {
    const ctx = globalThis[CTX_KEY];
    if (!ctx)
        throw new Error("@agent-native/scheduling: context not initialized. Call setSchedulingContext(...) at startup.");
    return ctx;
}
//# sourceMappingURL=context.js.map