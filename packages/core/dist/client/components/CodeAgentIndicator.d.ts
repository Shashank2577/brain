/**
 * CodeAgentIndicator — shows when a code editing request is being
 * processed by the frame (local dev frame or Builder.io).
 *
 * Renders as a subtle status bar that appears at the top of the chat area.
 */
export interface CodeAgentIndicatorProps {
    /** Whether the code agent is currently working */
    isWorking: boolean;
    /** Optional label describing what's being done */
    label?: string;
}
export declare function CodeAgentIndicator({ isWorking, label, }: CodeAgentIndicatorProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CodeAgentIndicator.d.ts.map