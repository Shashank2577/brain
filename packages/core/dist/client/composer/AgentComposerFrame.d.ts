import type React from "react";
import type { AgentComposerLayoutVariant } from "./types.js";
export interface AgentComposerFrameProps {
    children: React.ReactNode;
    className?: string;
    rootClassName?: string;
    style?: React.CSSProperties;
    rootStyle?: React.CSSProperties;
    layoutVariant?: AgentComposerLayoutVariant;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}
/**
 * The single visual shell for agent chat composition.
 *
 * AssistantChat, PromptComposer, and host surfaces such as Agent-Native Code
 * all render this same frame so the composer does not drift across products.
 */
export declare function AgentComposerFrame({ children, className, rootClassName, style, rootStyle, layoutVariant, onClick, }: AgentComposerFrameProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AgentComposerFrame.d.ts.map