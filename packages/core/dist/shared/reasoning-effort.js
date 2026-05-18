export const REASONING_EFFORTS = [
    "auto",
    "none",
    "minimal",
    "low",
    "medium",
    "high",
    "xhigh",
    "max",
];
export const REASONING_EFFORT_LABELS = {
    auto: "Auto",
    none: "None",
    minimal: "Minimal",
    low: "Low",
    medium: "Medium",
    high: "High",
    xhigh: "Extra High",
    max: "Max",
};
const VISIBLE_STANDARD_EFFORTS = [
    "auto",
    "low",
    "medium",
    "high",
];
const VISIBLE_GPT_EFFORTS = [
    ...VISIBLE_STANDARD_EFFORTS,
    "xhigh",
];
const VISIBLE_CLAUDE_BUILT_IN_EFFORTS = [
    ...VISIBLE_STANDARD_EFFORTS,
    "xhigh",
    "max",
];
const VISIBLE_CLAUDE_EFFORTS = [
    ...VISIBLE_STANDARD_EFFORTS,
    "max",
];
const effortSet = new Set(REASONING_EFFORTS);
export function isReasoningEffort(value) {
    return typeof value === "string" && effortSet.has(value);
}
export function getReasoningEffortOptionsForModel(model) {
    if (!model)
        return [];
    if (isGPTReasoningModel(model)) {
        return VISIBLE_GPT_EFFORTS;
    }
    if (isClaudeReasoningModel(model)) {
        return supportsClaudeXHigh(model)
            ? VISIBLE_CLAUDE_BUILT_IN_EFFORTS
            : VISIBLE_CLAUDE_EFFORTS;
    }
    if (isGeminiReasoningModel(model)) {
        return VISIBLE_STANDARD_EFFORTS;
    }
    return [];
}
export function normalizeReasoningEffortForModel(model, effort) {
    if (!model || !effort || effort === "auto") {
        return undefined;
    }
    let normalized = effort;
    if (normalized === "xhigh" &&
        isClaudeReasoningModel(model) &&
        !supportsClaudeXHigh(model)) {
        normalized = "high";
    }
    if (normalized === "max" && isGPTReasoningModel(model)) {
        normalized = "xhigh";
    }
    const options = getReasoningEffortOptionsForModel(model);
    if (!options.length || !options.includes(normalized)) {
        return undefined;
    }
    return normalized;
}
export function reasoningEffortLabel(effort) {
    return REASONING_EFFORT_LABELS[effort ?? "auto"];
}
function isGPTReasoningModel(model) {
    return /^gpt-5/.test(model) || /^o\d/.test(model);
}
function isClaudeReasoningModel(model) {
    return /^claude-/.test(model);
}
function supportsClaudeXHigh(model) {
    return model.includes("opus-4-7");
}
function isGeminiReasoningModel(model) {
    return /^gemini-/.test(model);
}
//# sourceMappingURL=reasoning-effort.js.map