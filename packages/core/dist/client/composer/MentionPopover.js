import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, } from "react";
import { createPortal } from "react-dom";
import { IconFile, IconFolder, IconStack2, IconFileText, IconCheckbox, IconMail, IconUser, IconPresentation, IconMessageChatbot, IconTrash, IconPlus, IconHelp, IconHistory, IconTerminal2, IconClipboardList, IconPencil, } from "@tabler/icons-react";
const iconProps = { size: 14, className: "shrink-0 text-muted-foreground" };
function MentionItemIcon({ icon }) {
    switch (icon) {
        case "folder":
            return _jsx(IconFolder, { ...iconProps });
        case "document":
            return _jsx(IconFileText, { ...iconProps });
        case "form":
            return _jsx(IconCheckbox, { ...iconProps });
        case "email":
            return _jsx(IconMail, { ...iconProps });
        case "user":
            return _jsx(IconUser, { ...iconProps });
        case "deck":
            return _jsx(IconPresentation, { ...iconProps });
        case "agent":
            return _jsx(IconMessageChatbot, { ...iconProps });
        case "file":
            return _jsx(IconFile, { ...iconProps });
        default:
            return _jsx(IconFile, { ...iconProps });
    }
}
function CommandIcon({ icon }) {
    switch (icon) {
        case "clear":
            return _jsx(IconTrash, { ...iconProps });
        case "new":
            return _jsx(IconPlus, { ...iconProps });
        case "help":
            return _jsx(IconHelp, { ...iconProps });
        case "history":
            return _jsx(IconHistory, { ...iconProps });
        case "plan":
            return _jsx(IconClipboardList, { ...iconProps });
        case "act":
            return _jsx(IconPencil, { ...iconProps });
        default:
            return _jsx(IconTerminal2, { ...iconProps });
    }
}
function HintWithLink({ hint }) {
    // If hint contains a URL, split it and render the URL as a link
    const urlMatch = hint.match(/(https?:\/\/\S+)/);
    if (!urlMatch)
        return _jsx(_Fragment, { children: hint });
    const before = hint.slice(0, urlMatch.index);
    const url = urlMatch[1];
    return (_jsxs(_Fragment, { children: [before, _jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: "underline hover:text-foreground", children: "Learn more" })] }));
}
function LoadingSkeleton() {
    return (_jsx("div", { className: "space-y-1 p-1", children: [1, 2, 3].map((i) => (_jsxs("div", { className: "flex items-center gap-2 rounded px-2 py-1.5", children: [_jsx("div", { className: "h-3.5 w-3.5 rounded bg-muted animate-pulse" }), _jsx("div", { className: "h-3 rounded bg-muted animate-pulse", style: { width: `${60 + i * 20}px` } })] }, i))) }));
}
function LoadingSkeletonRow() {
    return (_jsxs("div", { className: "flex items-center gap-2 rounded px-2 py-1.5", children: [_jsx("div", { className: "h-3.5 w-3.5 rounded bg-muted animate-pulse" }), _jsx("div", { className: "h-3 w-24 rounded bg-muted animate-pulse" })] }));
}
export const MentionPopover = forwardRef(function MentionPopover(props, ref) {
    const { type, position, mentionItems, skills, commands = [], hint, isLoading, query, onSelectMention, onSelectSkill, onSelectCommand, onClose, } = props;
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef(null);
    const itemCount = type === "@" ? mentionItems.length : commands.length + skills.length;
    // Group mention items by section for @ popover
    const groupedMentions = React.useMemo(() => {
        if (type !== "@")
            return [];
        const groups = new Map();
        for (const item of mentionItems) {
            const section = item.section || "Other";
            if (!groups.has(section))
                groups.set(section, []);
            groups.get(section).push(item);
        }
        // Sort: Agents first, then Connected Agents, then template-specific,
        // then Files, then Other
        const sorted = [];
        const knownSections = new Set([
            "Agents",
            "Connected Agents",
            "Files",
            "Other",
        ]);
        // Agents first
        if (groups.has("Agents")) {
            sorted.push({ section: "Agents", items: groups.get("Agents") });
            groups.delete("Agents");
        }
        if (groups.has("Connected Agents")) {
            sorted.push({
                section: "Connected Agents",
                items: groups.get("Connected Agents"),
            });
            groups.delete("Connected Agents");
        }
        // Template-specific sections (anything not in knownSections)
        for (const [section, items] of groups) {
            if (!knownSections.has(section)) {
                sorted.push({ section, items });
            }
        }
        // Files
        if (groups.has("Files")) {
            sorted.push({ section: "Files", items: groups.get("Files") });
        }
        // Other
        if (groups.has("Other")) {
            sorted.push({ section: "Other", items: groups.get("Other") });
        }
        return sorted;
    }, [type, mentionItems]);
    // Flat list of mention items in section order for keyboard index tracking
    const flatMentionItems = React.useMemo(() => {
        return groupedMentions.flatMap((g) => g.items);
    }, [groupedMentions]);
    // Reset selection when items change
    useEffect(() => {
        setSelectedIndex(0);
    }, [commands, mentionItems, skills, query]);
    // Scroll selected item into view
    useEffect(() => {
        const container = listRef.current;
        if (!container)
            return;
        // Find the actual item element by data attribute
        const selected = container.querySelector(`[data-mention-index="${selectedIndex}"]`);
        if (selected) {
            selected.scrollIntoView({ block: "nearest" });
        }
    }, [selectedIndex]);
    useImperativeHandle(ref, () => ({
        moveUp: () => {
            setSelectedIndex((prev) => prev <= 0 ? Math.max(0, itemCount - 1) : prev - 1);
        },
        moveDown: () => {
            setSelectedIndex((prev) => (prev >= itemCount - 1 ? 0 : prev + 1));
        },
        getSelectedIndex: () => selectedIndex,
        getSelectedMention: () => flatMentionItems[selectedIndex] ?? null,
        getSelectedCommand: () => {
            if (type !== "/" || selectedIndex >= commands.length)
                return null;
            return commands[selectedIndex] ?? null;
        },
    }));
    if (!position)
        return null;
    const content = (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-[9998]", onClick: onClose }), _jsx("div", { "data-agent-native-composer-popover": "true", className: "fixed z-[9999] w-[320px] overflow-y-auto rounded-lg border border-border bg-popover shadow-lg", style: {
                    bottom: `calc(100vh - ${position.top}px + 4px)`,
                    left: Math.max(8, Math.min(position.left, window.innerWidth - 336)),
                    maxHeight: Math.min(320, position.top - 8),
                }, children: isLoading && itemCount === 0 ? (_jsx(LoadingSkeleton, {})) : itemCount === 0 ? (_jsx("div", { className: "px-3 py-4 text-center text-xs text-muted-foreground", children: type === "@" ? (query ? ("No results found") : ("Type to search...")) : hint ? (_jsx(HintWithLink, { hint: hint })) : ("No skills available") })) : (_jsxs("div", { ref: listRef, className: "p-1", children: [isLoading && _jsx(LoadingSkeletonRow, {}), type === "@"
                            ? (() => {
                                let flatIndex = 0;
                                return groupedMentions.map((group) => (_jsxs("div", { children: [_jsx("div", { className: "px-2 pt-2 pb-1 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider", children: group.section }), group.items.map((item) => {
                                            const idx = flatIndex++;
                                            return (_jsxs("button", { "data-mention-index": idx, className: `flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${idx === selectedIndex
                                                    ? "bg-accent text-accent-foreground"
                                                    : "hover:bg-accent/50"}`, onMouseEnter: () => setSelectedIndex(idx), onClick: () => onSelectMention(item), children: [_jsx(MentionItemIcon, { icon: item.icon }), _jsx("span", { className: "truncate text-sm", children: item.label }), item.description && (_jsx("span", { className: "ml-auto shrink-0 truncate max-w-[160px] text-xs text-muted-foreground", children: item.description }))] }, item.id));
                                        })] }, group.section)));
                            })()
                            : (() => {
                                let idx = 0;
                                return (_jsxs(_Fragment, { children: [commands.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "px-2 pt-2 pb-1 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider", children: "Commands" }), commands.map((cmd) => {
                                                    const i = idx++;
                                                    return (_jsxs("button", { "data-mention-index": i, className: `flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${i === selectedIndex
                                                            ? "bg-accent text-accent-foreground"
                                                            : "hover:bg-accent/50"}`, onMouseEnter: () => setSelectedIndex(i), onClick: () => onSelectCommand?.(cmd), children: [_jsx(CommandIcon, { icon: cmd.icon }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsxs("span", { className: "block truncate text-sm", children: ["/", cmd.name] }), cmd.description && (_jsx("span", { className: "block truncate text-xs text-muted-foreground", children: cmd.description }))] })] }, cmd.name));
                                                })] })), skills.length > 0 && (_jsxs("div", { children: [commands.length > 0 && (_jsx("div", { className: "px-2 pt-2 pb-1 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider", children: "Skills" })), skills.map((skill) => {
                                                    const i = idx++;
                                                    return (_jsxs("button", { "data-mention-index": i, className: `flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${i === selectedIndex
                                                            ? "bg-accent text-accent-foreground"
                                                            : "hover:bg-accent/50"}`, onMouseEnter: () => setSelectedIndex(i), onClick: () => onSelectSkill(skill), children: [_jsx(IconStack2, { ...iconProps }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-sm", children: skill.name }), skill.description && (_jsx("span", { className: "block truncate text-xs text-muted-foreground", children: skill.description }))] })] }, skill.path));
                                                })] }))] }));
                            })()] })) })] }));
    return createPortal(content, document.body);
});
//# sourceMappingURL=MentionPopover.js.map