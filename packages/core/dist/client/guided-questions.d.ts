export type GuidedQuestionType = "text-options" | "color-options" | "slider" | "file" | "freeform";
export interface GuidedQuestionOption {
    label: string;
    value: string;
    color?: string;
    icon?: string;
    description?: string;
    recommended?: boolean;
}
export interface GuidedQuestion {
    id: string;
    type: GuidedQuestionType;
    header?: string;
    question: string;
    description?: string;
    options?: GuidedQuestionOption[];
    choices?: GuidedQuestionOption[];
    multiSelect?: boolean;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
    placeholder?: string;
    allowOther?: boolean;
    includeExplore?: boolean;
    includeDecide?: boolean;
}
export type GuidedQuestionAnswers = Record<string, unknown>;
export interface GuidedQuestionPayload {
    questions: GuidedQuestion[];
    title?: string;
    description?: string;
    skipLabel?: string;
    submitLabel?: string;
}
export declare function isOtherGuidedAnswer(value: unknown): value is string;
export declare function getOtherGuidedAnswerText(value: unknown): string;
export declare function makeOtherGuidedAnswer(text?: string): string;
export declare function hasGuidedAnswer(value: unknown): boolean;
export declare function formatGuidedAnswerValue(value: unknown): unknown;
export declare function normalizeGuidedAnswers(answers: GuidedQuestionAnswers): GuidedQuestionAnswers;
export declare function formatGuidedAnswersForAgent(answers: GuidedQuestionAnswers): string;
export interface GuidedQuestionFlowProps {
    questions: GuidedQuestion[];
    onSubmit: (answers: GuidedQuestionAnswers) => void;
    onSkip: () => void;
    title?: string;
    description?: string;
    skipLabel?: string;
    submitLabel?: string;
    className?: string;
}
export declare function GuidedQuestionFlow({ questions, onSubmit, onSkip, title, description, skipLabel, submitLabel, className, }: GuidedQuestionFlowProps): import("react/jsx-runtime").JSX.Element;
export interface UseGuidedQuestionFlowOptions {
    stateKey?: string;
    queryKey?: readonly unknown[];
    refetchInterval?: number | false;
    submitMessage?: string;
    skipMessage?: string;
    buildSubmitContext?: (args: {
        answers: GuidedQuestionAnswers;
        formattedAnswers: string;
    }) => string;
    buildSkipContext?: () => string;
}
export declare function useGuidedQuestionFlow({ stateKey, queryKey, refetchInterval, submitMessage, skipMessage, buildSubmitContext, buildSkipContext, }?: UseGuidedQuestionFlowOptions): {
    payload: GuidedQuestionPayload;
    questions: GuidedQuestion[];
    title: string;
    description: string;
    skipLabel: string;
    submitLabel: string;
    clear: () => void;
    handleSubmit: (answers: GuidedQuestionAnswers) => void;
    handleSkip: () => void;
};
//# sourceMappingURL=guided-questions.d.ts.map