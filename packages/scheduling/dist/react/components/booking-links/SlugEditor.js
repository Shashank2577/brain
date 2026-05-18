import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SlugEditor — inline-editable URL preview for a booking link.
 *
 * Renders the public booking URL as a single interactive line. Clicking
 * the username segment (if editable) or the slug segment swaps it for an
 * input; pressing Enter / blurring commits. All changes are fired through
 * the `onUsernameChange` / `onSlugChange` callbacks synchronously — the
 * caller owns persistence and should update UI optimistically.
 *
 * Shadcn primitives expected in the consumer: label.
 */
import { useState } from "react";
import { Label } from "@/components/ui/label";
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function cls(...parts) {
    return parts.filter(Boolean).join(" ");
}
export function SlugEditor(props) {
    const { host, pathPrefix = "", username, slug, onUsernameChange, onSlugChange, hideLabel, label = "URL", } = props;
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState("");
    const startEdit = (field) => {
        if (field === "username" && !onUsernameChange)
            return;
        setEditing(field);
        setDraft(field === "username" ? username : slug);
    };
    const commit = () => {
        if (!editing)
            return;
        const val = draft.trim();
        if (val) {
            if (editing === "username" && onUsernameChange) {
                onUsernameChange(slugify(val));
            }
            else if (editing === "slug") {
                onSlugChange(slugify(val));
            }
        }
        setEditing(null);
    };
    const prefix = pathPrefix ? `${pathPrefix}/` : "/";
    return (_jsxs("div", { className: "space-y-2", children: [!hideLabel && _jsx(Label, { children: label }), _jsxs("div", { className: "flex flex-wrap items-center gap-0 rounded-lg border border-border bg-muted/20 px-3 py-2 font-mono text-sm break-all", children: [_jsxs("span", { className: "text-muted-foreground", children: [host, prefix] }), editing === "username" ? (_jsx("input", { autoFocus: true, value: draft, onChange: (e) => setDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")), onBlur: commit, onKeyDown: (e) => {
                            if (e.key === "Enter")
                                commit();
                            if (e.key === "Escape")
                                setEditing(null);
                        }, className: "inline-block bg-primary/10 text-primary border-b border-primary/40 outline-none px-0.5 py-0 font-mono text-sm w-auto min-w-[3ch]", style: { width: `${Math.max(3, draft.length)}ch` } })) : onUsernameChange ? (_jsx("button", { type: "button", onClick: () => startEdit("username"), className: cls("inline rounded px-0.5 -mx-0.5 font-mono", username
                            ? "text-foreground hover:bg-primary/10 hover:text-primary"
                            : "text-primary/60 bg-primary/5 border border-dashed border-primary/30 hover:bg-primary/10"), title: "Click to edit username", children: username || "your-name" })) : (_jsx("span", { className: "font-mono text-foreground", children: username })), _jsx("span", { className: "text-muted-foreground", children: "/" }), editing === "slug" ? (_jsx("input", { autoFocus: true, value: draft, onChange: (e) => setDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")), onBlur: commit, onKeyDown: (e) => {
                            if (e.key === "Enter")
                                commit();
                            if (e.key === "Escape")
                                setEditing(null);
                        }, className: "inline-block bg-primary/10 text-primary border-b border-primary/40 outline-none px-0.5 py-0 font-mono text-sm w-auto min-w-[3ch]", style: { width: `${Math.max(3, draft.length)}ch` } })) : (_jsx("button", { type: "button", onClick: () => startEdit("slug"), className: "inline rounded px-0.5 -mx-0.5 font-mono text-foreground hover:bg-primary/10 hover:text-primary", title: "Click to edit slug", children: slug || "meeting" }))] })] }));
}
//# sourceMappingURL=SlugEditor.js.map