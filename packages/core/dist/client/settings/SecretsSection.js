import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * <SecretsSection /> — renders the registered secrets from the framework
 * secrets registry. Fetches `/_agent-native/secrets` on mount and shows a
 * card per secret with a masked input + Save / Rotate / Delete / Test
 * buttons (api-key kind) or a Connect / Disconnect button (oauth kind).
 */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { agentNativePath } from "../api-path.js";
import { IconCheck, IconExternalLink, IconLoader2, IconPlugConnected, IconPlus, IconTrash, IconRefresh, } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
const ENDPOINT = agentNativePath("/_agent-native/secrets");
function notifySecretsChanged() {
    if (typeof window === "undefined")
        return;
    window.dispatchEvent(new CustomEvent("agent-engine:configured-changed", {
        detail: { source: "secrets" },
    }));
}
export function SecretsSection({ focusKey }) {
    const [secrets, setSecrets] = useState(null);
    const [error, setError] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    useEffect(() => {
        let cancelled = false;
        fetch(ENDPOINT)
            .then(async (r) => {
            if (!r.ok) {
                throw new Error(`Failed to load secrets (${r.status})`);
            }
            return (await r.json());
        })
            .then((data) => {
            if (!cancelled)
                setSecrets(data);
        })
            .catch((err) => {
            if (!cancelled)
                setError(err?.message ?? "Failed to load");
        });
        return () => {
            cancelled = true;
        };
    }, [reloadToken]);
    const reload = useCallback(() => setReloadToken((t) => t + 1), []);
    if (error) {
        return (_jsxs("p", { className: "text-[10px] text-red-500", children: ["Failed to load secrets: ", error] }));
    }
    if (secrets === null) {
        return (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground", children: [_jsx(IconLoader2, { size: 10, className: "animate-spin" }), "Loading\u2026"] }));
    }
    if (secrets.length === 0) {
        return (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["No secrets registered yet. Templates register API keys and connections via ", _jsx("code", { children: "registerRequiredSecret()" }), "."] }), _jsx(AdHocKeysSection, {})] }));
    }
    return (_jsxs("div", { className: "space-y-2", children: [secrets.map((secret) => (_jsx(SecretCard, { secret: secret, onChanged: reload, focusInput: focusKey === secret.key }, secret.key))), _jsx(AdHocKeysSection, {})] }));
}
function SecretCard({ secret, onChanged, focusInput }) {
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [toast, setToast] = useState(null);
    const inputRef = React.useRef(null);
    useEffect(() => {
        if (focusInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [focusInput]);
    const setToastAndClear = (kind, text, ms = 2500) => {
        setToast({ kind, text });
        setTimeout(() => setToast(null), ms);
    };
    const handleSave = async () => {
        if (!value.trim() || busy)
            return;
        setBusy("save");
        try {
            const res = await fetch(`${ENDPOINT}/${encodeURIComponent(secret.key)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value: value.trim() }),
            });
            if (!res.ok) {
                const err = await res
                    .json()
                    .then((j) => j.error)
                    .catch(() => null);
                setToastAndClear("err", err ?? `Save failed (${res.status})`);
                return;
            }
            setValue("");
            setConfirmDelete(false);
            setToastAndClear("ok", "Saved");
            notifySecretsChanged();
            onChanged();
        }
        finally {
            setBusy(null);
        }
    };
    const handleDelete = async () => {
        if (busy)
            return;
        setBusy("delete");
        try {
            const res = await fetch(`${ENDPOINT}/${encodeURIComponent(secret.key)}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                const err = await res
                    .json()
                    .then((j) => j.error)
                    .catch(() => null);
                setToastAndClear("err", err ?? `Delete failed (${res.status})`);
                return;
            }
            setToastAndClear("ok", "Removed");
            setConfirmDelete(false);
            notifySecretsChanged();
            onChanged();
        }
        finally {
            setBusy(null);
        }
    };
    const handleTest = async () => {
        if (busy)
            return;
        setBusy("test");
        try {
            const res = await fetch(`${ENDPOINT}/${encodeURIComponent(secret.key)}/test`, {
                method: "POST",
            });
            const body = (await res.json().catch(() => ({})));
            if (res.ok && body.ok) {
                setToastAndClear("ok", "Working");
            }
            else {
                setToastAndClear("err", body.error ?? (body.ok === false ? "Invalid" : `Test failed`));
            }
        }
        finally {
            setBusy(null);
        }
    };
    const pill = useMemo(() => {
        if (secret.status === "set") {
            return (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Set"] }));
        }
        if (secret.required) {
            return (_jsx("span", { className: "rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-500", children: "Required" }));
        }
        return (_jsx("span", { className: "rounded-full bg-accent/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground", children: "Optional" }));
    }, [secret.status, secret.required]);
    const isOAuth = secret.kind === "oauth";
    return (_jsxs("div", { className: "rounded-md border border-border px-2.5 py-2 bg-accent/30", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-[11px] font-medium text-foreground truncate", children: secret.label }), secret.description && (_jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: secret.description }))] }), _jsx("div", { className: "shrink-0", children: pill })] }), isOAuth ? (_jsxs("div", { className: "mt-2 flex items-center gap-1.5", children: [secret.oauthConnectUrl && (_jsxs("a", { href: secret.oauthConnectUrl, className: "inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium no-underline", style: { backgroundColor: "#00B5FF", color: "white" }, children: [_jsx(IconPlugConnected, { size: 10 }), secret.status === "set" ? "Reconnect" : "Connect"] })), secret.docsUrl && (_jsxs("a", { href: secret.docsUrl, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] no-underline text-muted-foreground hover:text-foreground", children: ["Docs", _jsx(IconExternalLink, { size: 10 })] }))] })) : (_jsxs("div", { className: "mt-2 space-y-1.5", children: [secret.status === "set" && (_jsxs("div", { className: "flex items-center gap-2 text-[10px] text-muted-foreground", children: [_jsx("span", { children: "Stored value ending in" }), _jsx("code", { className: "rounded bg-background px-1 py-0.5 text-foreground", children: secret.last4 })] })), _jsxs("div", { className: "flex gap-1.5", children: [_jsx("input", { ref: inputRef, type: "password", value: value, onChange: (e) => setValue(e.target.value), onKeyDown: (e) => {
                                    if (e.key === "Enter")
                                        handleSave();
                                }, placeholder: secret.status === "set"
                                    ? "Enter new value to rotate"
                                    : "Paste key", className: "flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent" }), _jsx("button", { type: "button", onClick: handleSave, disabled: !value.trim() || busy !== null, className: "inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium disabled:opacity-40", style: { backgroundColor: "#00B5FF", color: "white" }, children: busy === "save" ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : secret.status === "set" ? (_jsxs(_Fragment, { children: [_jsx(IconRefresh, { size: 10 }), "Rotate"] })) : ("Save") })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [secret.status === "set" && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: handleTest, disabled: busy !== null, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-40", children: busy === "test" ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : ("Test") }), _jsxs("button", { type: "button", onClick: () => setConfirmDelete(true), disabled: busy !== null, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-red-500 disabled:opacity-40", children: [_jsx(IconTrash, { size: 10 }), "Remove"] })] })), secret.docsUrl && (_jsxs("a", { href: secret.docsUrl, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] no-underline text-muted-foreground hover:text-foreground ml-auto", children: ["Get key", _jsx(IconExternalLink, { size: 10 })] }))] }), confirmDelete && (_jsxs("div", { className: "flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-500", children: [_jsx("span", { className: "min-w-0 flex-1", children: "Remove this saved value?" }), _jsx("button", { type: "button", onClick: handleDelete, disabled: busy !== null, className: "inline-flex items-center gap-1 rounded border border-red-500/40 px-1.5 py-0.5 font-medium disabled:opacity-40", children: busy === "delete" ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : ("Confirm") }), _jsx("button", { type: "button", onClick: () => setConfirmDelete(false), disabled: busy !== null, className: "rounded border border-border px-1.5 py-0.5 text-muted-foreground hover:text-foreground disabled:opacity-40", children: "Cancel" })] }))] })), toast && (_jsx("p", { className: `mt-1.5 text-[10px] ${toast.kind === "ok" ? "text-green-500" : "text-red-500"}`, children: toast.text }))] }));
}
const ADHOC_ENDPOINT = agentNativePath("/_agent-native/secrets/adhoc");
function AdHocKeysSection() {
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reloadToken, setReloadToken] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState("");
    const [formValue, setFormValue] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formScope, setFormScope] = useState("user");
    const [formBusy, setFormBusy] = useState(false);
    const [formError, setFormError] = useState(null);
    const [confirmDeleteName, setConfirmDeleteName] = useState(null);
    const [deletingName, setDeletingName] = useState(null);
    const [toast, setToast] = useState(null);
    const showToast = useCallback((kind, text, ms = 2500) => {
        setToast({ kind, text });
        setTimeout(() => setToast(null), ms);
    }, []);
    const reload = useCallback(() => setReloadToken((t) => t + 1), []);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(ADHOC_ENDPOINT)
            .then(async (r) => {
            if (!r.ok)
                throw new Error(`Failed to load (${r.status})`);
            return (await r.json());
        })
            .then((data) => {
            if (!cancelled) {
                setKeys(data);
                setLoading(false);
            }
        })
            .catch(() => {
            if (!cancelled) {
                setKeys([]);
                setLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [reloadToken]);
    const resetForm = useCallback(() => {
        setShowForm(false);
        setFormName("");
        setFormValue("");
        setFormDescription("");
        setFormScope("user");
        setFormError(null);
    }, []);
    const handleAdd = useCallback(async () => {
        const name = formName.trim();
        const value = formValue.trim();
        if (!name || !value || formBusy)
            return;
        setFormBusy(true);
        setFormError(null);
        try {
            const res = await fetch(ADHOC_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    value,
                    description: formDescription.trim() || undefined,
                    scope: formScope,
                }),
            });
            if (!res.ok) {
                const body = await res
                    .json()
                    .then((j) => j.error)
                    .catch(() => null);
                setFormError(body ?? `Save failed (${res.status})`);
                return;
            }
            resetForm();
            showToast("ok", "Key saved");
            reload();
        }
        catch (err) {
            setFormError(err?.message ?? "Failed to save");
        }
        finally {
            setFormBusy(false);
        }
    }, [
        formName,
        formValue,
        formDescription,
        formScope,
        formBusy,
        resetForm,
        showToast,
        reload,
    ]);
    const handleDelete = useCallback(async (name) => {
        setDeletingName(name);
        try {
            const res = await fetch(`${ADHOC_ENDPOINT}/${encodeURIComponent(name)}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                showToast("err", "Failed to delete key");
                return;
            }
            showToast("ok", "Key deleted");
            setConfirmDeleteName(null);
            reload();
        }
        finally {
            setDeletingName(null);
        }
    }, [showToast, reload]);
    return (_jsxs("div", { className: "mt-3 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-[11px] font-medium text-foreground", children: "Additional Keys" }), !showForm && (_jsxs("button", { type: "button", onClick: () => setShowForm(true), className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40", children: [_jsx(IconPlus, { size: 10 }), "Add Key"] }))] }), _jsxs("p", { className: "text-[10px] text-muted-foreground/60 leading-relaxed", children: ["Keys are referenced in automations as", " ", _jsx("code", { className: "rounded bg-background px-1 py-0.5 text-[9px]", children: "${keys.KEY_NAME}" }), ". Values are encrypted and never shown to the AI agent."] }), showForm && (_jsxs("div", { className: "rounded-md border border-border px-2.5 py-2 bg-accent/30 space-y-1.5", children: [_jsx("input", { value: formName, onChange: (e) => setFormName(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")), className: "w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "KEY_NAME (e.g. SLACK_WEBHOOK)" }), _jsx("input", { type: "password", value: formValue, onChange: (e) => setFormValue(e.target.value), className: "w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "Secret value" }), _jsx("input", { value: formDescription, onChange: (e) => setFormDescription(e.target.value), className: "w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "Description (optional)" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("select", { value: formScope, onChange: (e) => setFormScope(e.target.value), className: "rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-accent", children: [_jsx("option", { value: "user", children: "Personal" }), _jsx("option", { value: "workspace", children: "Workspace" })] }), _jsxs("div", { className: "ml-auto flex items-center gap-1.5", children: [_jsx("button", { type: "button", onClick: resetForm, className: "rounded border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground", children: "Cancel" }), _jsx("button", { type: "button", onClick: handleAdd, disabled: !formName.trim() || !formValue.trim() || formBusy, className: "inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium disabled:opacity-40", style: { backgroundColor: "#00B5FF", color: "white" }, children: formBusy ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : ("Save") })] })] }), formError && _jsx("p", { className: "text-[10px] text-red-500", children: formError })] })), loading ? (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground", children: [_jsx(IconLoader2, { size: 10, className: "animate-spin" }), "Loading..."] })) : keys.length === 0 && !showForm ? (_jsx("p", { className: "text-[10px] text-muted-foreground", children: "No additional keys yet." })) : (keys.map((key) => (_jsx("div", { className: "rounded-md border border-border px-2.5 py-2 bg-accent/30", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-[11px] font-medium text-foreground font-mono truncate", children: key.name }), _jsx("span", { className: `rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${key.scope === "workspace"
                                                ? "bg-blue-500/15 text-blue-500"
                                                : "bg-accent/60 text-muted-foreground"}`, children: key.scope === "workspace" ? "workspace" : "personal" })] }), key.description && (_jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: key.description })), _jsx("div", { className: "flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5", children: _jsxs("span", { children: ["Ending in", " ", _jsx("code", { className: "rounded bg-background px-1 py-0.5 text-foreground", children: key.last4 })] }) })] }), _jsx("div", { className: "shrink-0", children: confirmDeleteName === key.name ? (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { type: "button", onClick: () => handleDelete(key.name), disabled: deletingName === key.name, className: "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-red-500/15 text-red-500 hover:bg-red-500/25 disabled:opacity-40", children: deletingName === key.name ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : ("Confirm") }), _jsx("button", { type: "button", onClick: () => setConfirmDeleteName(null), className: "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-accent/60 text-muted-foreground hover:text-foreground", children: "Cancel" })] })) : (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => setConfirmDeleteName(key.name), className: "text-muted-foreground hover:text-red-500", children: _jsx(IconTrash, { size: 12 }) }) }), _jsx(TooltipContent, { children: "Delete" })] })) })] }) }, `${key.scope}-${key.name}`)))), toast && (_jsx("p", { className: `text-[10px] ${toast.kind === "ok" ? "text-green-500" : "text-red-500"}`, children: toast.text }))] }));
}
//# sourceMappingURL=SecretsSection.js.map