import React from "react";
import type { AgentConversationMessage } from "./types.js";
export interface AgentConversationProps {
    messages: AgentConversationMessage[];
    loading?: boolean;
    error?: string | null;
    streaming?: boolean;
    className?: string;
    timelineClassName?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    composer?: React.ReactNode;
}
export declare function AgentConversation({ messages, loading, error, streaming, className, timelineClassName, emptyTitle, emptyDescription, composer, }: AgentConversationProps): import("react/jsx-runtime").JSX.Element;
export declare function AgentConversationMessageView({ message, }: {
    message: AgentConversationMessage;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AgentConversation.d.ts.map