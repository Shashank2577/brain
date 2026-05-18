export declare const REASONING_EFFORTS: readonly ["auto", "none", "minimal", "low", "medium", "high", "xhigh", "max"];
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];
export declare const REASONING_EFFORT_LABELS: Record<ReasoningEffort, string>;
export declare function isReasoningEffort(value: unknown): value is ReasoningEffort;
export declare function getReasoningEffortOptionsForModel(model: string | undefined): ReasoningEffort[];
export declare function normalizeReasoningEffortForModel(model: string | undefined, effort: ReasoningEffort | undefined): ReasoningEffort | undefined;
export declare function reasoningEffortLabel(effort: ReasoningEffort | undefined): string;
//# sourceMappingURL=reasoning-effort.d.ts.map