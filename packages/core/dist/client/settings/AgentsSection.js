import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import { getRemoteAgentIdFromPath, isRemoteAgentPath, remoteAgentResourcePath, } from "../../resources/metadata.js";
import { useState, useEffect, useRef, useCallback } from "react";
import { IconPlus, IconPencil, IconTrash, IconX, } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
function AgentEditPopover({ agent, onSave, onDelete, onClose, }) {
    const [name, setName] = useState(agent.name);
    const [url, setUrl] = useState(agent.url);
    const [description, setDescription] = useState(agent.description ?? "");
    const popoverRef = useRef(null);
    useEffect(() => {
        function handleClick(e) {
            if (popoverRef.current &&
                !popoverRef.current.contains(e.target)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);
    const handleSave = () => {
        if (!name.trim() || !url.trim())
            return;
        onSave({
            ...agent,
            name: name.trim(),
            url: url.trim(),
            description: description.trim() || undefined,
        });
    };
    return (_jsx("div", { ref: popoverRef, className: "absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-popover p-2.5 shadow-lg", children: _jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsx("input", { value: name, onChange: (e) => setName(e.target.value), onKeyDown: (e) => {
                        if (e.key === "Enter")
                            handleSave();
                        if (e.key === "Escape")
                            onClose();
                    }, className: "w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "Name" }), _jsx("input", { value: url, onChange: (e) => setUrl(e.target.value), onKeyDown: (e) => {
                        if (e.key === "Enter")
                            handleSave();
                        if (e.key === "Escape")
                            onClose();
                    }, className: "w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "URL (e.g. http://localhost:8085)" }), _jsx("input", { value: description, onChange: (e) => setDescription(e.target.value), onKeyDown: (e) => {
                        if (e.key === "Enter")
                            handleSave();
                        if (e.key === "Escape")
                            onClose();
                    }, className: "w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "Description (optional)" }), _jsxs("div", { className: "flex items-center justify-between pt-0.5", children: [_jsxs("button", { onClick: () => onDelete(agent.id), className: "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-900/20", children: [_jsx(IconTrash, { size: 10 }), "Remove"] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: onClose, className: "rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground", children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: !name.trim() || !url.trim(), className: "rounded bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40", children: "Save" })] })] })] }) }));
}
function AgentAddPopover({ onAdd, onClose, }) {
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const nameRef = useRef(null);
    const popoverRef = useRef(null);
    useEffect(() => {
        const t = setTimeout(() => nameRef.current?.focus(), 50);
        return () => clearTimeout(t);
    }, []);
    useEffect(() => {
        function handleClick(e) {
            if (popoverRef.current &&
                !popoverRef.current.contains(e.target)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);
    const handleAdd = () => {
        if (!name.trim() || !url.trim())
            return;
        onAdd(name.trim(), url.trim(), description.trim());
    };
    return (_jsx("div", { ref: popoverRef, className: "absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-popover p-2.5 shadow-lg", children: _jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsx("input", { ref: nameRef, value: name, onChange: (e) => setName(e.target.value), onKeyDown: (e) => {
                        if (e.key === "Enter")
                            handleAdd();
                        if (e.key === "Escape")
                            onClose();
                    }, className: "w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "Name" }), _jsx("input", { value: url, onChange: (e) => setUrl(e.target.value), onKeyDown: (e) => {
                        if (e.key === "Enter")
                            handleAdd();
                        if (e.key === "Escape")
                            onClose();
                    }, className: "w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "URL (e.g. http://localhost:8085)" }), _jsx("input", { value: description, onChange: (e) => setDescription(e.target.value), onKeyDown: (e) => {
                        if (e.key === "Enter")
                            handleAdd();
                        if (e.key === "Escape")
                            onClose();
                    }, className: "w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "Description (optional)" }), _jsxs("div", { className: "flex justify-end gap-1 pt-0.5", children: [_jsx("button", { onClick: onClose, className: "rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground", children: "Cancel" }), _jsx("button", { onClick: handleAdd, disabled: !name.trim() || !url.trim(), className: "rounded bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40", children: "Add" })] })] }) }));
}
export function AgentsSection() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingAgent, setEditingAgent] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const fetchAgents = useCallback(async () => {
        try {
            const res = await fetch(agentNativePath("/_agent-native/resources?scope=all"));
            if (!res.ok)
                return;
            const data = await res.json();
            const agentResources = (data.resources ?? []).filter((r) => isRemoteAgentPath(r.path));
            const parsed = await Promise.all(agentResources.map(async (r) => {
                try {
                    const detail = await fetch(agentNativePath(`/_agent-native/resources/${r.id}`));
                    if (!detail.ok)
                        return null;
                    const d = await detail.json();
                    const config = JSON.parse(d.content);
                    return {
                        id: r.id,
                        path: r.path,
                        name: config.name,
                        url: config.url,
                        description: config.description,
                    };
                }
                catch {
                    return null;
                }
            }));
            setAgents(parsed.filter(Boolean));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);
    const handleAdd = async (name, url, description) => {
        const id = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        const agentJson = JSON.stringify({
            id,
            name,
            description: description || undefined,
            url,
            color: "#6B7280",
        }, null, 2);
        try {
            const res = await fetch(agentNativePath("/_agent-native/resources"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: remoteAgentResourcePath(id),
                    content: agentJson,
                    shared: true,
                }),
            });
            if (res.ok) {
                setShowAdd(false);
                fetchAgents();
            }
        }
        catch { }
    };
    const handleSave = async (agent) => {
        const agentJson = JSON.stringify({
            id: getRemoteAgentIdFromPath(agent.path),
            name: agent.name,
            description: agent.description || undefined,
            url: agent.url,
            color: "#6B7280",
        }, null, 2);
        try {
            const res = await fetch(agentNativePath(`/_agent-native/resources/${agent.id}`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: agentJson }),
            });
            if (res.ok) {
                setEditingAgent(null);
                fetchAgents();
            }
        }
        catch { }
    };
    const handleDelete = async (agentId) => {
        try {
            const res = await fetch(agentNativePath(`/_agent-native/resources/${agentId}`), {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                setEditingAgent(null);
                fetchAgents();
            }
        }
        catch { }
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: "text-[10px] text-muted-foreground", children: "@-mention agents in chat to delegate tasks via A2A." }), _jsxs("div", { className: "relative", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: () => {
                                                setShowAdd(!showAdd);
                                                setEditingAgent(null);
                                            }, className: "flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50", children: showAdd ? _jsx(IconX, { size: 12 }) : _jsx(IconPlus, { size: 12 }) }) }), _jsx(TooltipContent, { children: "Add agent" })] }), showAdd && (_jsx(AgentAddPopover, { onAdd: handleAdd, onClose: () => setShowAdd(false) }))] })] }), loading ? (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "h-6 w-full rounded bg-muted/50 animate-pulse" }), _jsx("div", { className: "h-6 w-3/4 rounded bg-muted/50 animate-pulse" })] })) : agents.length === 0 ? (_jsxs("button", { onClick: () => setShowAdd(true), className: "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/30", children: [_jsx(IconPlus, { size: 12, className: "shrink-0" }), "Add agent"] })) : (_jsxs("div", { className: "flex flex-col gap-0.5", children: [agents.map((agent) => (_jsxs("div", { className: "group relative", children: [_jsxs("div", { className: "flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/30", children: [_jsx("span", { className: "text-[11px] font-medium text-foreground truncate shrink-0", children: agent.name }), _jsx("span", { className: "flex-1 text-[10px] text-muted-foreground/60 truncate text-right", children: agent.url }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: () => {
                                                        setEditingAgent(editingAgent === agent.id ? null : agent.id);
                                                        setShowAdd(false);
                                                    }, className: "shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-accent/50", children: _jsx(IconPencil, { size: 11 }) }) }), _jsx(TooltipContent, { children: "Edit agent" })] })] }), editingAgent === agent.id && (_jsx(AgentEditPopover, { agent: agent, onSave: handleSave, onDelete: handleDelete, onClose: () => setEditingAgent(null) }))] }, agent.id))), _jsxs("button", { onClick: () => {
                            setShowAdd(true);
                            setEditingAgent(null);
                        }, className: "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/30", children: [_jsx(IconPlus, { size: 12, className: "shrink-0" }), "Add agent"] })] }))] }));
}
//# sourceMappingURL=AgentsSection.js.map