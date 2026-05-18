import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * BookingLinkCreateDialog — dialog prompting for Title / URL / Duration
 * when creating a new booking link (a.k.a. event type).
 *
 * The consumer owns the mutation — this component just collects the four
 * inputs and calls `onSubmit` once the user clicks Continue. It stays
 * dumb: no data fetching, no optimistic UI.
 *
 * Shadcn primitives expected in the consumer: dialog, button, input,
 * label, textarea.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
export function BookingLinkCreateDialog(props) {
    const { open, onOpenChange, slugPrefix, defaultLength = 30, onSubmit, submitLabel = "Continue", } = props;
    const [form, setForm] = useState({
        title: "",
        slug: "",
        length: defaultLength,
        description: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [slugEdited, setSlugEdited] = useState(false);
    // Reset form when the dialog reopens
    useEffect(() => {
        if (open) {
            setForm({
                title: "",
                slug: "",
                length: defaultLength,
                description: "",
            });
            setSlugEdited(false);
            setSubmitting(false);
        }
    }, [open, defaultLength]);
    async function submit() {
        if (!form.title || !form.slug)
            return;
        setSubmitting(true);
        try {
            await onSubmit(form);
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add a new event type" }), _jsx(DialogDescription, { children: "Create a new event type for people to book." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "blc-title", children: "Title" }), _jsx(Input, { id: "blc-title", placeholder: "Quick chat", value: form.title, onChange: (e) => {
                                        const title = e.currentTarget.value;
                                        setForm((prev) => ({
                                            ...prev,
                                            title,
                                            slug: slugEdited ? prev.slug : slugify(title),
                                        }));
                                    }, autoFocus: true })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "blc-slug", children: "URL" }), _jsxs("div", { className: "flex rounded-md border border-input focus-within:ring-2 focus-within:ring-ring", children: [_jsx("span", { className: "flex items-center rounded-l-md bg-muted px-3 text-xs text-muted-foreground", children: slugPrefix }), _jsx(Input, { id: "blc-slug", placeholder: "quick-chat", className: "rounded-l-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0", value: form.slug, onChange: (e) => {
                                                // Capture before setForm — React nulls e.currentTarget once
                                                // the event finishes synchronous propagation, so reading it
                                                // inside the updater closure throws "Cannot read properties
                                                // of null (reading 'value')".
                                                const next = e.currentTarget.value;
                                                setSlugEdited(true);
                                                setForm((prev) => ({
                                                    ...prev,
                                                    slug: slugify(next),
                                                }));
                                            } })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "blc-desc", children: "Description" }), _jsx(Textarea, { id: "blc-desc", placeholder: "A short description people will see.", rows: 2, value: form.description, onChange: (e) => setForm({ ...form, description: e.currentTarget.value }) })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "blc-len", children: "Duration" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { id: "blc-len", type: "number", className: "w-24", value: form.length, onChange: (e) => setForm({ ...form, length: Number(e.currentTarget.value) }) }), _jsx("span", { className: "text-sm text-muted-foreground", children: "minutes" })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }), _jsx(Button, { onClick: submit, disabled: !form.title || !form.slug || submitting, children: submitting ? "Saving…" : submitLabel })] })] }) }));
}
//# sourceMappingURL=BookingLinkCreateDialog.js.map