import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router";
import { IconChevronDown, IconPlus, IconSettings, IconStar, IconStarFilled, IconTrash, IconDots, IconPencil, IconGripVertical, IconTool, } from "@tabler/icons-react";
import { cn } from "../utils.js";
import { sendToAgentChat } from "../agent-chat.js";
import { PromptComposer } from "../composer/PromptComposer.js";
import { Popover, PopoverContent, PopoverTrigger, } from "../components/ui/popover.js";
import { HoverCard, HoverCardContent, HoverCardTrigger, } from "../components/ui/hover-card.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "../components/ui/dropdown-menu.js";
import { applyToolsOrder, getToolsOrder, setToolsOrder, } from "./extension-order.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "../components/ui/tooltip.js";
import { extensionPopularityOf, useExtensionPopularity, } from "./extension-popularity.js";
import { deleteOrHideExtension, invalidateExtensionRemoval, } from "./delete-extension.js";
const FAVORITES_KEY = "extensions-favorites";
const COLLAPSED_EXTENSION_COUNT = 3;
const EXTENSIONS_OPEN_KEY = "extensions-sidebar-open";
const EXTENSIONS_SORT_MODE_KEY = "extensions-sort-mode";
function getFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        if (!raw)
            return new Set();
        const parsed = JSON.parse(raw);
        return new Set(Array.isArray(parsed) ? parsed : []);
    }
    catch {
        return new Set();
    }
}
function saveFavorites(ids) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(ids)));
    }
    catch {
        // localStorage unavailable — ignore
    }
}
function getStoredBoolean(key, fallback) {
    if (typeof window === "undefined")
        return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw === "true")
        return true;
    if (raw === "false")
        return false;
    return fallback;
}
function setStoredBoolean(key, value) {
    if (typeof window === "undefined")
        return;
    try {
        window.localStorage.setItem(key, String(value));
    }
    catch {
        // localStorage unavailable — ignore
    }
}
function getSortMode() {
    if (typeof window === "undefined")
        return "most-used";
    const raw = window.localStorage.getItem(EXTENSIONS_SORT_MODE_KEY);
    if (raw === "alphabetical" || raw === "manual" || raw === "most-used") {
        return raw;
    }
    return "most-used";
}
function setSortMode(mode) {
    if (typeof window === "undefined")
        return;
    try {
        window.localStorage.setItem(EXTENSIONS_SORT_MODE_KEY, mode);
    }
    catch {
        // localStorage unavailable — ignore
    }
}
function sortByName(items) {
    return [...items].sort((a, b) => {
        const name = a.name.localeCompare(b.name);
        return name !== 0 ? name : a.id.localeCompare(b.id);
    });
}
function ExtensionSortMenu({ value, onChange, }) {
    return (_jsxs(DropdownMenu, { children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/45 opacity-0 transition-all hover:bg-accent hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover/extensions-section:opacity-100", "aria-label": "Extensions sort options", children: _jsx(IconSettings, { className: "h-3.5 w-3.5" }) }) }) }), _jsx(TooltipContent, { children: "Extensions sort" })] }), _jsxs(DropdownMenuContent, { side: "right", align: "start", className: "w-44", children: [_jsx(DropdownMenuLabel, { children: "Sort by" }), _jsxs(DropdownMenuRadioGroup, { value: value, onValueChange: (next) => {
                            if (next === "most-used" ||
                                next === "alphabetical" ||
                                next === "manual") {
                                onChange(next);
                            }
                        }, children: [_jsx(DropdownMenuRadioItem, { value: "most-used", children: "Most used" }), _jsx(DropdownMenuRadioItem, { value: "alphabetical", children: "Alphabetical" }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuRadioItem, { value: "manual", children: "Manual order" })] })] })] }));
}
export function ExtensionsSidebarSection() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const popularity = useExtensionPopularity();
    const [favoriteIds, setFavoriteIds] = useState(() => typeof window !== "undefined" ? getFavorites() : new Set());
    const [extensionsOpen, setExtensionsOpen] = useState(() => getStoredBoolean(EXTENSIONS_OPEN_KEY, true));
    const [sortModeState, setSortModeState] = useState(getSortMode);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [toolOrderState, setToolOrderState] = useState(() => typeof window !== "undefined" ? getToolsOrder() : []);
    const [draggingId, setDraggingId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const [showAllExtensions, setShowAllExtensions] = useState(false);
    const { data: extensions, isLoading } = useQuery({
        queryKey: ["extensions"],
        queryFn: async () => {
            const res = await fetch(agentNativePath("/_agent-native/extensions"));
            if (!res.ok)
                return [];
            return res.json();
        },
    });
    const toggleFavorite = useCallback((id) => {
        setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            }
            else {
                next.add(id);
            }
            saveFavorites(next);
            return next;
        });
    }, []);
    const setExtensionSortMode = useCallback((mode) => {
        setSortMode(mode);
        setSortModeState(mode);
    }, []);
    const toggleExtensionsOpen = useCallback(() => {
        setExtensionsOpen((current) => {
            const next = !current;
            setStoredBoolean(EXTENSIONS_OPEN_KEY, next);
            return next;
        });
    }, []);
    const handleDelete = useCallback(async (extension) => {
        const extensionId = extension.id;
        setMenuOpenId(null);
        const prev = queryClient.getQueryData(["extensions"]);
        queryClient.setQueryData(["extensions"], (old) => (old ?? []).filter((t) => t.id !== extensionId));
        try {
            await deleteOrHideExtension(extension);
            invalidateExtensionRemoval(queryClient, extensionId);
            setFavoriteIds((prev) => {
                const next = new Set(prev);
                next.delete(extensionId);
                saveFavorites(next);
                return next;
            });
            setToolOrderState((prev) => {
                const next = prev.filter((id) => id !== extensionId);
                if (next.length !== prev.length)
                    setToolsOrder(next);
                return next;
            });
            if (location.pathname === `/extensions/${extensionId}` ||
                location.pathname === `/extensions/${extensionId}/edit`) {
                navigate("/extensions");
            }
        }
        catch {
            if (prev)
                queryClient.setQueryData(["extensions"], prev);
        }
    }, [location.pathname, navigate, queryClient]);
    const startRename = useCallback((extension) => {
        setMenuOpenId(null);
        setRenameValue(extension.name);
        setRenamingId(extension.id);
    }, []);
    const submitRename = useCallback(async (extensionId) => {
        const trimmed = renameValue.trim();
        setRenamingId(null);
        if (!trimmed)
            return;
        const prev = queryClient.getQueryData(["extensions"]);
        const existing = prev?.find((t) => t.id === extensionId);
        if (!existing || trimmed === existing.name)
            return;
        queryClient.setQueryData(["extensions"], (old) => (old ?? []).map((t) => t.id === extensionId ? { ...t, name: trimmed } : t));
        queryClient.setQueryData(["extension", extensionId], (old) => old ? { ...old, name: trimmed } : old);
        try {
            await fetch(agentNativePath(`/_agent-native/extensions/${extensionId}`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
            });
            queryClient.invalidateQueries({ queryKey: ["extensions"] });
            queryClient.invalidateQueries({ queryKey: ["extension", extensionId] });
        }
        catch {
            if (prev)
                queryClient.setQueryData(["extensions"], prev);
            queryClient.invalidateQueries({ queryKey: ["extension", extensionId] });
        }
    }, [renameValue, queryClient]);
    const sortedTools = useMemo(() => {
        if (!extensions)
            return [];
        if (sortModeState === "alphabetical") {
            return sortByName(extensions);
        }
        const mostUsed = [...extensions].sort((a, b) => {
            const aPop = extensionPopularityOf(popularity, a.id);
            const bPop = extensionPopularityOf(popularity, b.id);
            if (aPop !== bPop)
                return bPop - aPop;
            const aFav = favoriteIds.has(a.id) ? 0 : 1;
            const bFav = favoriteIds.has(b.id) ? 0 : 1;
            if (aFav !== bFav)
                return aFav - bFav;
            return a.name.localeCompare(b.name);
        });
        return sortModeState === "manual" && toolOrderState.length > 0
            ? applyToolsOrder(mostUsed, toolOrderState)
            : mostUsed;
    }, [extensions, favoriteIds, popularity, sortModeState, toolOrderState]);
    const activeExtensionId = useMemo(() => sortedTools.find((extension) => location.pathname === `/extensions/${extension.id}` ||
        location.pathname === `/extensions/${extension.id}/edit`)?.id ?? null, [location.pathname, sortedTools]);
    const visibleTools = useMemo(() => {
        if (showAllExtensions || sortedTools.length <= COLLAPSED_EXTENSION_COUNT) {
            return sortedTools;
        }
        const defaultVisible = sortedTools.slice(0, COLLAPSED_EXTENSION_COUNT);
        if (!activeExtensionId)
            return defaultVisible;
        const activeTool = sortedTools.find((extension) => extension.id === activeExtensionId);
        if (!activeTool || defaultVisible.some((tool) => tool.id === activeTool.id))
            return defaultVisible;
        return [
            ...defaultVisible.slice(0, COLLAPSED_EXTENSION_COUNT - 1),
            activeTool,
        ];
    }, [activeExtensionId, showAllExtensions, sortedTools]);
    const hasMoreExtensions = sortedTools.length > COLLAPSED_EXTENSION_COUNT;
    const reorderTool = useCallback((activeId, overId) => {
        if (activeId === overId)
            return;
        const ids = sortedTools.map((extension) => extension.id);
        const oldIndex = ids.indexOf(activeId);
        const newIndex = ids.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1)
            return;
        const next = [...ids];
        const [moved] = next.splice(oldIndex, 1);
        if (!moved)
            return;
        next.splice(newIndex, 0, moved);
        setToolsOrder(next);
        setToolOrderState(next);
        setExtensionSortMode("manual");
    }, [setExtensionSortMode, sortedTools]);
    const handleCreate = (text) => {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        sendToAgentChat({
            message: `Create an extension: ${trimmed}`,
            submit: true,
            openSidebar: true,
            newTab: true,
        });
        setShowCreate(false);
    };
    return (_jsx(TooltipProvider, { delayDuration: 200, children: _jsxs("div", { className: "relative min-w-0 py-1", children: [_jsxs("div", { className: cn("group/extensions-section relative flex w-full min-w-0 items-center rounded-md text-sm font-medium transition-all hover:text-primary", location.pathname.startsWith("/extensions")
                        ? "text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/50", extensionsOpen && sortedTools.length > 0 && "mb-1"), children: [_jsx("button", { type: "button", onClick: toggleExtensionsOpen, className: "absolute inset-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", "aria-label": extensionsOpen ? "Collapse extensions" : "Expand extensions", "aria-expanded": extensionsOpen }), _jsxs("div", { className: "pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 pr-20", children: [_jsx(IconTool, { className: "h-4 w-4 shrink-0" }), _jsxs(HoverCard, { openDelay: 1200, closeDelay: 200, children: [_jsx(HoverCardTrigger, { asChild: true, children: _jsx("span", { className: "pointer-events-auto min-w-0 select-none truncate", onClick: toggleExtensionsOpen, children: "Extensions" }) }), _jsxs(HoverCardContent, { side: "top", align: "start", sideOffset: 8, className: "w-72 space-y-3 p-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-foreground", children: "Extensions" }), _jsx("p", { className: "mt-1 text-xs leading-relaxed text-muted-foreground", children: "Build small sandboxed apps that can read app data, call actions, and save their own state." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Link, { to: "/extensions", className: "inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent", children: "Open extensions" }), _jsx("a", { href: "https://agent-native.com/docs/extensions", target: "_blank", rel: "noopener noreferrer", className: "inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", children: "Learn more" })] })] })] })] }), _jsxs("div", { className: "absolute right-1 top-1/2 z-20 flex -translate-y-1/2 items-center", children: [_jsx(ExtensionSortMenu, { value: sortModeState, onChange: setExtensionSortMode }), _jsxs(Popover, { open: showCreate, onOpenChange: setShowCreate, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-accent hover:text-accent-foreground", "aria-label": "New extension", children: _jsx(IconPlus, { className: "h-3.5 w-3.5" }) }) }), _jsxs(PopoverContent, { side: "right", align: "start", className: "w-[420px] p-3", children: [_jsx("p", { className: "px-1 pb-2 text-sm font-semibold text-foreground", children: "New extension" }), _jsx(PromptComposer, { autoFocus: true, placeholder: "Describe what you'd like to build...", draftScope: "extensions:sidebar-create", onSubmit: handleCreate })] })] }), _jsx("button", { type: "button", onClick: toggleExtensionsOpen, className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-accent hover:text-foreground", "aria-label": extensionsOpen ? "Collapse extensions" : "Expand extensions", "aria-expanded": extensionsOpen, children: _jsx(IconChevronDown, { className: cn("h-3.5 w-3.5 shrink-0 transition-transform", !extensionsOpen && "-rotate-90") }) })] })] }), extensionsOpen &&
                    (isLoading ? (_jsx("div", { className: "min-w-0 space-y-0.5 px-0.5", children: [1, 2, 3].map((i) => (_jsx("div", { className: "flex items-center rounded-md px-2 py-1.5", children: _jsx("div", { className: "h-3 rounded bg-muted animate-pulse", style: { width: `${60 + i * 20}px` } }) }, i))) })) : sortedTools.length === 0 ? null : (_jsxs("div", { className: "min-w-0 space-y-0.5 px-0.5", children: [visibleTools.map((extension) => {
                                const isActive = location.pathname === `/extensions/${extension.id}` ||
                                    location.pathname === `/extensions/${extension.id}/edit`;
                                const isFav = favoriteIds.has(extension.id);
                                const isRenamingThis = renamingId === extension.id;
                                const actionsVisible = menuOpenId === extension.id || isRenamingThis;
                                return (_jsxs("div", { onDragOver: (e) => {
                                        if (!draggingId || draggingId === extension.id)
                                            return;
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = "move";
                                        setDragOverId(extension.id);
                                    }, onDragLeave: () => {
                                        setDragOverId((current) => current === extension.id ? null : current);
                                    }, onDrop: (e) => {
                                        e.preventDefault();
                                        const activeId = draggingId || e.dataTransfer.getData("text/plain");
                                        setDraggingId(null);
                                        setDragOverId(null);
                                        if (activeId)
                                            reorderTool(activeId, extension.id);
                                    }, className: cn("group/extension relative flex items-center min-w-0 rounded-md", draggingId === extension.id && "opacity-50", dragOverId === extension.id &&
                                        draggingId !== extension.id &&
                                        "bg-accent/60"), children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", draggable: true, onDragStart: (e) => {
                                                            setDraggingId(extension.id);
                                                            setDragOverId(null);
                                                            e.dataTransfer.effectAllowed = "move";
                                                            e.dataTransfer.setData("text/plain", extension.id);
                                                        }, onDragEnd: () => {
                                                            setDraggingId(null);
                                                            setDragOverId(null);
                                                        }, className: "-ml-2 cursor-grab rounded p-0.5 text-muted-foreground/30 opacity-0 transition-colors hover:text-muted-foreground/70 active:cursor-grabbing group-hover/extension:opacity-100 group-focus-within/extension:opacity-100", "aria-label": `Reorder ${extension.name}`, children: _jsx(IconGripVertical, { className: "h-3 w-3" }) }) }), _jsx(TooltipContent, { children: "Drag to reorder" })] }), _jsx(Link, { to: `/extensions/${extension.id}`, className: cn("flex min-w-0 flex-1 items-center rounded-md px-2 py-1.5 pr-12 text-xs transition-[padding,color,background-color] md:pr-2 md:group-hover/extension:pr-12 md:group-focus-within/extension:pr-12", actionsVisible && "md:pr-12", isActive
                                                ? "bg-accent text-accent-foreground font-medium"
                                                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"), children: isRenamingThis ? (_jsx("input", { autoFocus: true, value: renameValue, onChange: (e) => setRenameValue(e.target.value), onBlur: () => submitRename(extension.id), onKeyDown: (e) => {
                                                    if (e.key === "Enter")
                                                        submitRename(extension.id);
                                                    if (e.key === "Escape")
                                                        setRenamingId(null);
                                                }, onClick: (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }, className: "min-w-0 flex-1 truncate border-b border-primary bg-transparent px-0 py-0 text-xs outline-none" })) : (_jsx("span", { className: "block truncate", children: extension.name })) }), _jsxs("div", { className: cn("pointer-events-none absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover/extension:opacity-100 md:group-focus-within/extension:opacity-100", actionsVisible && "md:opacity-100"), children: [_jsx("button", { type: "button", onClick: (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleFavorite(extension.id);
                                                    }, className: cn("pointer-events-auto cursor-pointer rounded p-0.5 transition-colors", isFav
                                                        ? "text-yellow-500"
                                                        : "text-muted-foreground/40 hover:text-yellow-500"), "aria-label": isFav ? "Unfavorite" : "Favorite", children: isFav ? (_jsx(IconStarFilled, { className: "h-3 w-3" })) : (_jsx(IconStar, { className: "h-3 w-3" })) }), _jsxs(DropdownMenu, { open: menuOpenId === extension.id, onOpenChange: (open) => setMenuOpenId(open ? extension.id : null), children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "pointer-events-auto cursor-pointer rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-foreground", "aria-label": "Extension actions", children: _jsx(IconDots, { className: "h-3 w-3" }) }) }), _jsxs(DropdownMenuContent, { align: "end", sideOffset: 4, className: "min-w-[140px]", children: [_jsxs(DropdownMenuItem, { onSelect: () => startRename(extension), children: [_jsx(IconPencil, { className: "h-3.5 w-3.5" }), "Rename"] }), _jsxs(DropdownMenuItem, { onSelect: () => handleDelete(extension), className: "text-destructive focus:text-destructive", children: [_jsx(IconTrash, { className: "h-3.5 w-3.5" }), extension.canDelete === false
                                                                            ? "Remove from my list"
                                                                            : "Delete"] })] })] })] })] }, extension.id));
                            }), hasMoreExtensions && (_jsx("button", { type: "button", "aria-expanded": showAllExtensions, onClick: () => setShowAllExtensions((current) => !current), className: "ml-5 mt-1 inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium text-muted-foreground/60 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1", children: showAllExtensions ? "show less" : "show more" }))] })))] }) }));
}
//# sourceMappingURL=ExtensionsSidebarSection.js.map