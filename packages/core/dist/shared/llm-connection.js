export function normalizeLlmConnection(engine) {
    const value = typeof engine === "string" ? engine.trim() : "";
    if (!value)
        return "none";
    if (value.startsWith("ai-sdk:")) {
        return value.slice("ai-sdk:".length) || value;
    }
    return value;
}
export function llmConnectionTrackingProperties(status) {
    if (!status) {
        return { llm_connection: "unknown" };
    }
    if (!status.configured || !status.engine) {
        return {
            llm_connection: "none",
            llm_connection_configured: false,
        };
    }
    return {
        llm_connection: normalizeLlmConnection(status.engine),
        llm_connection_configured: true,
        llm_engine: status.engine,
        ...(status.model ? { llm_model: status.model } : {}),
        ...(status.source ? { llm_connection_source: status.source } : {}),
        ...(status.envVar ? { llm_connection_env_var: status.envVar } : {}),
    };
}
//# sourceMappingURL=llm-connection.js.map