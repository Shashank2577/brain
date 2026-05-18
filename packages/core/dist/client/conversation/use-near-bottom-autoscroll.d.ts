export interface UseNearBottomAutoscrollOptions {
    followKey: unknown;
    streaming?: boolean;
    threshold?: number;
    enabled?: boolean;
}
export declare function useNearBottomAutoscroll<TElement extends HTMLElement>({ followKey, streaming, threshold, enabled, }: UseNearBottomAutoscrollOptions): {
    scrollRef: import("react").RefObject<TElement>;
    isNearBottomRef: import("react").RefObject<boolean>;
    showScrollToBottom: boolean;
    markNearBottom: () => void;
    scrollToBottom: () => void;
    scrollToBottomAfterPaint: () => void;
};
//# sourceMappingURL=use-near-bottom-autoscroll.d.ts.map