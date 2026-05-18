import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, } from "react";
import { IconSearch, IconMessage } from "@tabler/icons-react";
import { sendToAgentChat } from "./agent-chat.js";
import { cn } from "./utils.js";
const CommandMenuContext = createContext(null);
function useCommandMenuContext() {
    const ctx = useContext(CommandMenuContext);
    if (!ctx)
        throw new Error("CommandMenu.* must be used inside <CommandMenu>");
    return ctx;
}
// ─── Hooks ──────────────────────────────────────────────────────────────────
/**
 * Opens the agent sidebar (dispatches event that AgentSidebar listens for)
 */
export function openAgentSidebar() {
    window.dispatchEvent(new Event("agent-panel:open"));
}
export function focusAgentChat() {
    window.dispatchEvent(new CustomEvent("agent-panel:set-mode", {
        detail: { mode: "chat" },
    }));
    openAgentSidebar();
}
/**
 * Sends a prompt to the agent and opens the sidebar
 */
export function submitToAgent(message) {
    focusAgentChat();
    sendToAgentChat({ message, submit: true });
}
function CommandGroup({ heading, children }) {
    return (_jsxs("div", { className: "overflow-hidden p-1 text-foreground", children: [heading && (_jsx("div", { className: "px-2 py-1.5 text-xs font-medium text-muted-foreground", children: heading })), children] }));
}
function CommandItem({ onSelect, children, keywords: _keywords, className, }) {
    const { onOpenChange, containerRef, setSelectedIndex } = useCommandMenuContext();
    const itemRef = useRef(null);
    const handleSelect = () => {
        onOpenChange(false);
        // Small delay to let dialog close animation start
        setTimeout(onSelect, 50);
    };
    const handleMouseEnter = () => {
        if (!containerRef.current || !itemRef.current)
            return;
        const items = containerRef.current.querySelectorAll('[role="option"]');
        const index = Array.from(items).indexOf(itemRef.current);
        if (index >= 0)
            setSelectedIndex(index);
    };
    return (_jsx("div", { ref: itemRef, className: cn("relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none", className), onClick: handleSelect, onMouseEnter: handleMouseEnter, role: "option", children: children }));
}
function CommandShortcut({ children, className }) {
    return (_jsx("span", { className: cn("ml-auto text-xs tracking-widest text-muted-foreground", className), children: children }));
}
function CommandSeparator({ className }) {
    return _jsx("div", { className: cn("-mx-1 my-1 h-px bg-border", className) });
}
export function CommandMenu({ open, onOpenChange, children, placeholder = "Type a command or ask AI...", emptyText = "No commands found.", showAgentFallback = true, className, }) {
    const [search, setSearch] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    // Focus input when opening
    useEffect(() => {
        if (open) {
            setSearch("");
            setSelectedIndex(0);
            // Wait for render then focus
            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        }
    }, [open]);
    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);
    // Keep selected item scrolled into view
    useEffect(() => {
        const items = containerRef.current?.querySelectorAll('[role="option"]');
        if (items && items[selectedIndex]) {
            items[selectedIndex].scrollIntoView({ block: "nearest" });
        }
    }, [selectedIndex]);
    // Apply selected styling directly (can't rely on Tailwind scanning core package)
    useEffect(() => {
        const items = containerRef.current?.querySelectorAll('[role="option"]');
        if (!items)
            return;
        items.forEach((item, i) => {
            const el = item;
            if (i === selectedIndex) {
                el.style.backgroundColor = "hsl(var(--accent))";
                el.style.color = "hsl(var(--accent-foreground))";
            }
            else {
                el.style.backgroundColor = "";
                el.style.color = "";
            }
        });
    });
    // Close on escape
    useEffect(() => {
        if (!open)
            return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onOpenChange(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);
    // Close on click outside
    useEffect(() => {
        if (!open)
            return;
        const handleClick = (e) => {
            if (containerRef.current &&
                !containerRef.current.contains(e.target)) {
                onOpenChange(false);
            }
        };
        // Use capture to handle clicks before they bubble
        document.addEventListener("mousedown", handleClick, true);
        return () => document.removeEventListener("mousedown", handleClick, true);
    }, [open, onOpenChange]);
    const handleSubmitToAgent = useCallback(() => {
        onOpenChange(false);
        if (!search.trim()) {
            focusAgentChat();
            return;
        }
        submitToAgent(search.trim());
    }, [search, onOpenChange]);
    const handleKeyDown = (e) => {
        const items = containerRef.current?.querySelectorAll('[role="option"]');
        const itemCount = items?.length ?? 0;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % itemCount || 0);
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount || 0);
        }
        else if (e.key === "Enter") {
            e.preventDefault();
            if (items && items[selectedIndex]) {
                items[selectedIndex].click();
            }
        }
    };
    if (!open)
        return null;
    // Filter children based on search
    const filterChildren = (nodes) => {
        return React.Children.map(nodes, (child) => {
            if (!React.isValidElement(child))
                return child;
            const props = child.props;
            // If it's a CommandGroup, filter its children
            if (child.type === CommandGroup) {
                const groupChildren = filterChildren(props.children);
                const hasChildren = React.Children.count(groupChildren) > 0;
                if (!hasChildren)
                    return null;
                return React.cloneElement(child, {
                    ...props,
                    children: groupChildren,
                });
            }
            // If it's a CommandItem, check if it matches search
            if (child.type === CommandItem) {
                if (!search)
                    return child;
                const text = getTextContent(props.children).toLowerCase();
                const keywords = (props.keywords || [])
                    .join(" ")
                    .toLowerCase();
                const searchLower = search.toLowerCase();
                if (text.includes(searchLower) || keywords.includes(searchLower)) {
                    return child;
                }
                return null;
            }
            // If it's a separator, keep it (will be cleaned up later if needed)
            if (child.type === CommandSeparator) {
                return search ? null : child; // Hide separators when searching
            }
            return child;
        });
    };
    const filteredChildren = filterChildren(children);
    const hasResults = React.Children.toArray(filteredChildren).some((child) => React.isValidElement(child) && child.type === CommandGroup);
    return (_jsx("div", { className: "fixed inset-0 z-50 bg-black/50", children: _jsx("div", { ref: containerRef, className: cn("fixed left-1/2 top-[15vh] -translate-x-1/2 w-full max-w-lg", "rounded-lg border border-border bg-popover text-popover-foreground shadow-lg", className), children: _jsxs(CommandMenuContext.Provider, { value: { search, onOpenChange, containerRef, setSelectedIndex }, children: [_jsxs("div", { className: "flex items-center border-b px-3", children: [_jsx(IconSearch, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }), _jsx("input", { ref: inputRef, value: search, onChange: (e) => setSearch(e.target.value), onKeyDown: handleKeyDown, placeholder: placeholder, className: "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" })] }), _jsxs("div", { className: "max-h-[300px] overflow-y-auto overflow-x-hidden", children: [hasResults && filteredChildren, showAgentFallback && (_jsxs(_Fragment, { children: [hasResults && _jsx(CommandSeparator, {}), _jsx("div", { className: "p-1", children: _jsxs("div", { className: "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none", onClick: handleSubmitToAgent, onMouseEnter: (e) => {
                                                const items = containerRef.current?.querySelectorAll('[role="option"]');
                                                if (!items)
                                                    return;
                                                const index = Array.from(items).indexOf(e.currentTarget);
                                                if (index >= 0)
                                                    setSelectedIndex(index);
                                            }, role: "option", children: [_jsx(IconMessage, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { children: search.trim() ? (_jsxs(_Fragment, { children: ["Ask AI:", " ", _jsxs("span", { className: "text-muted-foreground", children: ["\"", search, "\""] })] })) : (_jsx("span", { className: "text-muted-foreground", children: "Ask AI anything..." })) }), search.trim() && (_jsx("span", { className: "ml-auto text-xs text-muted-foreground", children: "\u21B5" }))] }) })] }))] })] }) }) }));
}
// Helper to extract text content from React children
function getTextContent(children) {
    if (typeof children === "string")
        return children;
    if (typeof children === "number")
        return String(children);
    if (!children)
        return "";
    if (Array.isArray(children)) {
        return children.map(getTextContent).join(" ");
    }
    if (React.isValidElement(children) &&
        children.props.children) {
        return getTextContent(children.props.children);
    }
    return "";
}
// Attach sub-components
CommandMenu.Group = CommandGroup;
CommandMenu.Item = CommandItem;
CommandMenu.Shortcut = CommandShortcut;
CommandMenu.Separator = CommandSeparator;
// ─── Keyboard Hook ──────────────────────────────────────────────────────────
/**
 * Hook to handle Cmd+K (or Ctrl+K) to open the command menu
 */
export function useCommandMenuShortcut(onOpen) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                // Don't trigger if user is typing in an input/textarea
                const target = e.target;
                if (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable) {
                    return;
                }
                e.preventDefault();
                onOpen();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onOpen]);
}
//# sourceMappingURL=CommandMenu.js.map