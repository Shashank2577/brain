import { jsx as _jsx } from "react/jsx-runtime";
import { ComposerPrimitive } from "@assistant-ui/react";
import { cn } from "../utils.js";
/**
 * The single visual shell for agent chat composition.
 *
 * AssistantChat, PromptComposer, and host surfaces such as Agent-Native Code
 * all render this same frame so the composer does not drift across products.
 */
export function AgentComposerFrame({ children, className, rootClassName, style, rootStyle, layoutVariant = "default", onClick, }) {
    return (_jsx("div", { "data-agent-composer-variant": layoutVariant, "data-agent-composer-slot": "area", className: cn("agent-composer-area shrink-0 px-3 py-2", layoutVariant !== "default" && `agent-composer-area--${layoutVariant}`, className), style: style, onClick: onClick, children: _jsx(ComposerPrimitive.Root, { "data-agent-composer-variant": layoutVariant, "data-agent-composer-slot": "root", className: cn("agent-composer-root flex flex-col rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring", layoutVariant !== "default" &&
                `agent-composer-root--${layoutVariant}`, rootClassName), style: rootStyle, children: children }) }));
}
//# sourceMappingURL=AgentComposerFrame.js.map