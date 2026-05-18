import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * CustomFieldsEditor — add, remove, reorder, and configure custom form
 * fields shown on a booking page.
 *
 * The shape matches the calendar template's `CustomField`. The scheduling
 * template's event types also have `customFields` — both can use this
 * directly.
 *
 * All edits flow through `onChange` synchronously so the caller can
 * update the UI (and persist) optimistically.
 *
 * Shadcn primitives expected in the consumer: button, input, label,
 * textarea, switch. Icons from `@tabler/icons-react`.
 */
import { useState } from "react";
import { nanoid } from "nanoid";
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconGripVertical, IconListCheck, IconPlus, IconTrash, } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
const TYPE_LABELS = {
    text: "Short text",
    email: "Email",
    url: "URL",
    tel: "Phone",
    textarea: "Long text",
    select: "Dropdown",
    checkbox: "Checkbox",
};
const PRESETS = [
    {
        label: "LinkedIn Profile",
        type: "url",
        placeholder: "https://linkedin.com/in/yourname",
        pattern: "^https?://(www\\.)?linkedin\\.com/in/.+",
        patternError: "Please enter a valid LinkedIn profile URL",
    },
    { label: "Company", type: "text", placeholder: "Your company name" },
    { label: "Phone Number", type: "tel", placeholder: "+1 (555) 123-4567" },
    { label: "Website", type: "url", placeholder: "https://example.com" },
];
function cls(...parts) {
    return parts.filter(Boolean).join(" ");
}
export function CustomFieldsEditor(props) {
    const { fields, onChange, hideLabel } = props;
    const [editingId, setEditingId] = useState(null);
    const [showPresets, setShowPresets] = useState(false);
    function addField(partial) {
        const field = {
            id: nanoid(8),
            label: partial?.label || "New Field",
            type: partial?.type || "text",
            required: partial?.required ?? true,
            placeholder: partial?.placeholder,
            pattern: partial?.pattern,
            patternError: partial?.patternError,
            options: partial?.options,
        };
        onChange([...fields, field]);
        setEditingId(field.id);
        setShowPresets(false);
    }
    function updateField(id, updates) {
        onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    }
    function removeField(id) {
        onChange(fields.filter((f) => f.id !== id));
        if (editingId === id)
            setEditingId(null);
    }
    function moveField(id, dir) {
        const idx = fields.findIndex((f) => f.id === id);
        if (idx < 0)
            return;
        const target = idx + dir;
        if (target < 0 || target >= fields.length)
            return;
        const next = [...fields];
        [next[idx], next[target]] = [next[target], next[idx]];
        onChange(next);
    }
    return (_jsxs("div", { className: "space-y-3", children: [!hideLabel && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Label, { className: "flex items-center gap-1.5", children: [_jsx(IconListCheck, { className: "h-4 w-4" }), "Custom fields"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("button", { type: "button", onClick: () => setShowPresets((p) => !p), className: "flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground", children: [_jsx(IconChevronDown, { className: cls("h-3 w-3 transition-transform", showPresets && "rotate-180") }), "Presets"] }), _jsxs("button", { type: "button", onClick: () => addField(), className: "flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground", children: [_jsx(IconPlus, { className: "h-3 w-3" }), "Add"] })] })] })), showPresets && (_jsx("div", { className: "grid grid-cols-1 gap-1.5 sm:grid-cols-2", children: PRESETS.map((preset) => (_jsxs("button", { type: "button", onClick: () => addField(preset), className: "rounded-lg border border-border/60 px-3 py-2 text-left text-xs hover:border-primary/30 hover:bg-accent/60", children: [_jsx("p", { className: "font-medium", children: preset.label }), _jsx("p", { className: "text-muted-foreground", children: TYPE_LABELS[preset.type] })] }, preset.label))) })), fields.length === 0 && !showPresets && (_jsx("p", { className: "text-xs text-muted-foreground", children: "Add custom fields to collect information from bookers \u2014 e.g. LinkedIn profile, company name, phone number." })), _jsx("div", { className: "space-y-2", children: fields.map((field) => {
                    const isEditing = editingId === field.id;
                    return (_jsxs("div", { className: "overflow-hidden rounded-lg border border-border", children: [_jsxs("div", { role: "button", tabIndex: 0, onClick: () => setEditingId(isEditing ? null : field.id), onKeyDown: (event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setEditingId(isEditing ? null : field.id);
                                    }
                                }, className: "flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-accent/40", children: [_jsx(IconGripVertical, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground/40" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-sm font-medium", children: field.label }), _jsxs("span", { className: "text-[11px] text-muted-foreground", children: [TYPE_LABELS[field.type], field.required ? " · Required" : " · Optional", field.pattern ? " · Pattern" : ""] })] }), _jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [_jsx("button", { type: "button", onClick: (e) => {
                                                    e.stopPropagation();
                                                    moveField(field.id, -1);
                                                }, className: "p-0.5 text-muted-foreground/40 hover:text-foreground", title: "Move up", children: _jsx(IconChevronLeft, { className: "h-3 w-3 rotate-90" }) }), _jsx("button", { type: "button", onClick: (e) => {
                                                    e.stopPropagation();
                                                    moveField(field.id, 1);
                                                }, className: "p-0.5 text-muted-foreground/40 hover:text-foreground", title: "Move down", children: _jsx(IconChevronRight, { className: "h-3 w-3 rotate-90" }) }), _jsx("button", { type: "button", onClick: (e) => {
                                                    e.stopPropagation();
                                                    removeField(field.id);
                                                }, className: "p-0.5 text-muted-foreground/40 hover:text-destructive", title: "Remove field", children: _jsx(IconTrash, { className: "h-3 w-3" }) })] })] }), isEditing && (_jsxs("div", { className: "space-y-3 border-t border-border bg-muted/20 px-3 py-3", children: [_jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { className: "text-xs", children: "Label" }), _jsx(Input, { value: field.label, onChange: (e) => updateField(field.id, { label: e.target.value }), placeholder: "Field label", className: "h-8 text-sm" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { className: "text-xs", children: "Type" }), _jsx("select", { value: field.type, onChange: (e) => updateField(field.id, {
                                                            type: e.target.value,
                                                        }), className: "h-8 w-full rounded-md border border-input bg-background px-2 text-sm", children: Object.entries(TYPE_LABELS).map(([value, label]) => (_jsx("option", { value: value, children: label }, value))) })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { className: "text-xs", children: "Placeholder" }), _jsx(Input, { value: field.placeholder || "", onChange: (e) => updateField(field.id, {
                                                    placeholder: e.target.value || undefined,
                                                }), placeholder: "Placeholder text", className: "h-8 text-sm" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { className: "text-xs", children: "Required" }), _jsx(Switch, { checked: field.required, onCheckedChange: (checked) => updateField(field.id, { required: checked }) })] }), field.type === "select" && (_jsxs("div", { className: "space-y-1.5", children: [_jsxs(Label, { className: "text-xs", children: ["Options", " ", _jsx("span", { className: "font-normal text-muted-foreground", children: "(one per line)" })] }), _jsx(Textarea, { value: (field.options || []).join("\n"), onChange: (e) => {
                                                    const options = e.target.value
                                                        .split("\n")
                                                        .filter((o) => o.trim());
                                                    updateField(field.id, { options });
                                                }, placeholder: "Option 1\nOption 2\nOption 3", rows: 3, className: "text-sm" })] })), field.type !== "checkbox" && field.type !== "select" && (_jsxs("div", { className: "space-y-1.5", children: [_jsxs(Label, { className: "text-xs", children: ["Validation pattern", " ", _jsx("span", { className: "font-normal text-muted-foreground", children: "(regex, optional)" })] }), _jsx(Input, { value: field.pattern || "", onChange: (e) => updateField(field.id, {
                                                    pattern: e.target.value || undefined,
                                                }), placeholder: "e.g. ^https?://(www\\.)?linkedin\\.com/in/.+", className: "h-8 font-mono text-sm" }), field.pattern && (_jsxs("div", { className: "space-y-1.5", children: [_jsxs(Label, { className: "text-xs", children: ["Error message", " ", _jsx("span", { className: "font-normal text-muted-foreground", children: "(shown when pattern doesn't match)" })] }), _jsx(Input, { value: field.patternError || "", onChange: (e) => updateField(field.id, {
                                                            patternError: e.target.value || undefined,
                                                        }), placeholder: "e.g. Please enter a valid LinkedIn URL", className: "h-8 text-sm" })] }))] }))] }))] }, field.id));
                }) }), hideLabel && (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsxs("button", { type: "button", onClick: () => setShowPresets((p) => !p), className: "flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground", children: [_jsx(IconChevronDown, { className: cls("h-3 w-3 transition-transform", showPresets && "rotate-180") }), "Presets"] }), _jsxs("button", { type: "button", onClick: () => addField(), className: "flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground", children: [_jsx(IconPlus, { className: "h-3 w-3" }), "Add field"] })] }))] }));
}
//# sourceMappingURL=CustomFieldsEditor.js.map