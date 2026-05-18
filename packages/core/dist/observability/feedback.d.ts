import type { FeedbackEntry, FeedbackType, SatisfactionScore } from "./types.js";
export interface SubmitFeedbackOpts {
    threadId: string;
    runId?: string;
    messageSeq?: number;
    feedbackType: FeedbackType;
    value?: string;
    userId?: string;
}
export declare function submitFeedback(opts: SubmitFeedbackOpts): Promise<FeedbackEntry>;
export declare function computeSatisfactionScore(threadId: string, opts?: {
    userId?: string | null;
}): Promise<SatisfactionScore>;
//# sourceMappingURL=feedback.d.ts.map