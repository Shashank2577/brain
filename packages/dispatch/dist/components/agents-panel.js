import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "../components/ui/alert-dialog.js";
import { IconExternalLink, IconTrash } from "@tabler/icons-react";
import { agentNativePath } from "@agent-native/core/client";
function slugifyAgentName(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function validateAgentForm(name, url) {
    const errors = {};
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName) {
        errors.name = "Agent name is required.";
    }
    else if (!slugifyAgentName(trimmedName)) {
        errors.name = "Agent name must include at least one letter or number.";
    }
    if (!trimmedUrl) {
        errors.url = "Agent endpoint URL is required.";
    }
    else {
        try {
            const parsed = new URL(trimmedUrl);
            if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
                errors.url = "Use an http:// or https:// endpoint URL.";
            }
            else if (!parsed.hostname) {
                errors.url = "Enter a complete endpoint URL with a host.";
            }
            else if (parsed.username || parsed.password) {
                errors.url = "Do not include credentials in the endpoint URL.";
            }
        }
        catch {
            errors.url =
                "Enter a valid endpoint URL, such as https://app.example.com.";
        }
    }
    return errors;
}
export function AgentsPanel({ agents, onRefresh, }) {
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const nameRef = useRef(null);
    const customAgents = agents.filter((agent) => agent.source === "custom");
    const workspaceAgents = agents.filter((agent) => agent.source === "workspace");
    const builtinAgents = agents.filter((agent) => agent.source === "builtin");
    const handleAdd = async (event) => {
        event?.preventDefault();
        const trimmedName = name.trim();
        const trimmedUrl = url.trim();
        const nextErrors = validateAgentForm(trimmedName, trimmedUrl);
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }
        const id = slugifyAgentName(trimmedName);
        const agentJson = JSON.stringify({
            id,
            name: trimmedName,
            description: description.trim() || undefined,
            url: trimmedUrl,
            color: "#6B7280",
        }, null, 2);
        setSaving(true);
        try {
            const res = await fetch(agentNativePath("/_agent-native/resources"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: `remote-agents/${id}.json`,
                    content: agentJson,
                    shared: true,
                }),
            });
            if (res.ok) {
                setName("");
                setUrl("");
                setDescription("");
                setErrors({});
                onRefresh();
                nameRef.current?.focus();
            }
            else {
                setErrors({
                    form: `Could not add agent. Request failed with ${res.status}.`,
                });
            }
        }
        catch (error) {
            setErrors({
                form: error instanceof Error
                    ? error.message
                    : "Could not add agent. Please try again.",
            });
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async (resourceId) => {
        if (!resourceId)
            return;
        const res = await fetch(agentNativePath(`/_agent-native/resources/${resourceId}`), {
            method: "DELETE",
        });
        if (res.ok)
            onRefresh();
    };
    return (_jsx("section", { className: "rounded-2xl border bg-card p-5", children: _jsxs("div", { className: "grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: "Available by default" }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [builtinAgents.map((agent) => (_jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground", children: [_jsx("span", { className: "h-2 w-2 rounded-full", style: { backgroundColor: agent.color } }), _jsx("span", { children: agent.name })] }, agent.id))), builtinAgents.length === 0 && (_jsx("div", { className: "rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground", children: "No default agents detected." }))] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: "Added in this workspace" }), _jsxs("div", { className: "mt-2 space-y-2", children: [workspaceAgents.map((agent) => (_jsx("div", { className: "flex items-start justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3", children: _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: agent.name }), agent.description ? (_jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: agent.description })) : null, _jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: _jsxs("a", { href: agent.url, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 hover:text-foreground", children: [agent.url, _jsx(IconExternalLink, { className: "h-3 w-3" })] }) })] }) }, agent.id))), customAgents.map((agent) => (_jsxs("div", { className: "flex items-start justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: agent.name }), agent.description ? (_jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: agent.description })) : null, _jsxs("div", { className: "mt-1 flex items-center gap-2 text-xs text-muted-foreground", children: [_jsxs("a", { href: agent.url, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 hover:text-foreground", children: [agent.url, _jsx(IconExternalLink, { className: "h-3 w-3" })] }), _jsx("span", { children: "\u00B7" }), _jsx("span", { children: agent.scope || "shared" })] })] }), _jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(IconTrash, { className: "h-4 w-4" }) }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Remove this agent?" }), _jsxs(AlertDialogDescription, { children: ["\u201C", agent.name, "\u201D will be removed from the workspace. Any jobs or chats that delegate to it will stop working."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { onClick: () => handleDelete(agent.resourceId), children: "Remove" })] })] })] })] }, agent.id))), workspaceAgents.length === 0 && customAgents.length === 0 && (_jsx("div", { className: "rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground", children: "No extra agents added yet." }))] })] })] }), _jsxs("div", { className: "rounded-xl border bg-muted/20 p-4", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: "Add external agent" }), _jsx("p", { className: "mt-1 text-xs leading-relaxed text-muted-foreground", children: "Add another A2A-compatible app by saving its agent endpoint here." }), _jsxs("form", { className: "mt-4 space-y-3", onSubmit: handleAdd, noValidate: true, children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(Input, { ref: nameRef, value: name, onChange: (event) => {
                                                setName(event.target.value);
                                                setErrors((current) => ({ ...current, name: undefined }));
                                            }, placeholder: "Name", "aria-invalid": Boolean(errors.name), "aria-describedby": errors.name ? "external-agent-name-error" : undefined }), errors.name ? (_jsx("p", { id: "external-agent-name-error", className: "text-xs font-medium text-destructive", children: errors.name })) : null] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Input, { value: url, onChange: (event) => {
                                                setUrl(event.target.value);
                                                setErrors((current) => ({ ...current, url: undefined }));
                                            }, placeholder: "https://app.example.com", "aria-invalid": Boolean(errors.url), "aria-describedby": errors.url ? "external-agent-url-error" : undefined }), errors.url ? (_jsx("p", { id: "external-agent-url-error", className: "text-xs font-medium text-destructive", children: errors.url })) : null] }), _jsx(Input, { value: description, onChange: (event) => setDescription(event.target.value), placeholder: "Description (optional)" }), errors.form ? (_jsx("p", { className: "text-xs font-medium text-destructive", children: errors.form })) : null, _jsx(Button, { type: "submit", className: "w-full", disabled: saving, children: saving ? "Saving..." : "Add agent" })] })] })] }) }));
}
//# sourceMappingURL=agents-panel.js.map