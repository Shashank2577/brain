/**
 * CommandMenu — reusable command palette with agent chat fallback.
 *
 * Features:
 * - Anchored to top of viewport (not centered)
 * - Falls back to agent chat when no command matches
 * - Opens agent sidebar automatically when sending prompts
 * - Customizable commands via children
 *
 * Usage:
 *   <CommandMenu open={open} onOpenChange={setOpen}>
 *     <CommandMenu.Group heading="Actions">
 *       <CommandMenu.Item onSelect={() => doThing()}>Do thing</CommandMenu.Item>
 *     </CommandMenu.Group>
 *   </CommandMenu>
 */
import { type ReactNode } from "react";
/**
 * Opens the agent sidebar (dispatches event that AgentSidebar listens for)
 */
export declare function openAgentSidebar(): void;
export declare function focusAgentChat(): void;
/**
 * Sends a prompt to the agent and opens the sidebar
 */
export declare function submitToAgent(message: string): void;
interface CommandGroupProps {
    heading?: string;
    children: ReactNode;
}
declare function CommandGroup({ heading, children }: CommandGroupProps): import("react/jsx-runtime").JSX.Element;
interface CommandItemProps {
    onSelect: () => void;
    children: ReactNode;
    keywords?: string[];
    className?: string;
}
declare function CommandItem({ onSelect, children, keywords: _keywords, className, }: CommandItemProps): import("react/jsx-runtime").JSX.Element;
interface CommandShortcutProps {
    children: ReactNode;
    className?: string;
}
declare function CommandShortcut({ children, className }: CommandShortcutProps): import("react/jsx-runtime").JSX.Element;
declare function CommandSeparator({ className }: {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export interface CommandMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
    /** Placeholder text for the search input */
    placeholder?: string;
    /** Text shown when no results match (before showing agent fallback) */
    emptyText?: string;
    /** Whether to show the "Ask AI" fallback when no commands match. Default: true */
    showAgentFallback?: boolean;
    /** Custom class for the dialog content */
    className?: string;
}
export declare function CommandMenu({ open, onOpenChange, children, placeholder, emptyText, showAgentFallback, className, }: CommandMenuProps): import("react/jsx-runtime").JSX.Element;
export declare namespace CommandMenu {
    var Group: typeof CommandGroup;
    var Item: typeof CommandItem;
    var Shortcut: typeof CommandShortcut;
    var Separator: typeof CommandSeparator;
}
/**
 * Hook to handle Cmd+K (or Ctrl+K) to open the command menu
 */
export declare function useCommandMenuShortcut(onOpen: () => void): void;
export type { CommandGroupProps, CommandItemProps, CommandShortcutProps };
//# sourceMappingURL=CommandMenu.d.ts.map