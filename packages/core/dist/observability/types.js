/**
 * Shared types for the agent observability system.
 *
 * Covers traces, feedback, evals, experiments, and satisfaction scoring.
 * Each domain module imports from here so the data model is consistent
 * across the entire observability stack.
 */
export const DEFAULT_OBSERVABILITY_CONFIG = {
    enabled: true,
    capturePrompts: false,
    captureToolArgs: false,
    captureToolResults: false,
    evalSampleRate: 0,
    exporters: [],
};
//# sourceMappingURL=types.js.map