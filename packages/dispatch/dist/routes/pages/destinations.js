import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { toast } from "sonner";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Textarea } from "../../components/ui/textarea.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../../components/ui/select.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "../../components/ui/alert-dialog.js";
export function meta() {
    return [{ title: "Destinations — Dispatch" }];
}
function QuickSendRow({ destination, }) {
    const [text, setText] = useState("");
    const send = useActionMutation("send-platform-message", {
        onSuccess: () => {
            toast.success("Message sent");
            setText("");
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Unable to send message");
        },
    });
    return (_jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx(Input, { value: text, onChange: (event) => setText(event.target.value), placeholder: "Quick test message" }), _jsx(Button, { onClick: () => send.mutate({
                    destinationId: destination.id,
                    text: text || `Test message to ${destination.name}`,
                }), disabled: send.isPending, children: "Send" })] }));
}
export default function DestinationsRoute() {
    const { data } = useActionQuery("list-destinations", {});
    const [form, setForm] = useState({
        name: "",
        platform: "slack",
        destination: "",
        threadRef: "",
        notes: "",
    });
    const upsert = useActionMutation("upsert-destination", {
        onSuccess: () => {
            toast.success("Destination saved");
            setForm((current) => ({
                ...current,
                name: "",
                destination: "",
                threadRef: "",
                notes: "",
            }));
        },
    });
    const remove = useActionMutation("delete-destination", {
        onSuccess: () => toast.success("Destination removed"),
    });
    return (_jsx(DispatchShell, { title: "Destinations", description: "Saved outbound Slack channels, Telegram chats, and thread targets.", children: _jsxs("div", { className: "grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]", children: [_jsxs("section", { className: "rounded-2xl border bg-card p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Saved destinations" }), _jsxs("div", { className: "mt-4 space-y-3", children: [(data || []).map((destination) => (_jsxs("div", { className: "rounded-xl border bg-muted/30 p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: destination.name }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [destination.platform, " \u00B7 ", destination.destination, destination.threadRef
                                                                    ? ` · thread ${destination.threadRef}`
                                                                    : ""] }), destination.notes && (_jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: destination.notes }))] }), _jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", size: "sm", children: "Delete" }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Delete destination?" }), _jsxs(AlertDialogDescription, { children: ["\u201C", destination.name, "\u201D will be removed. Any saved workflows or jobs that target this destination will start failing on the next send."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { onClick: () => remove.mutate({ id: destination.id }), children: "Delete" })] })] })] })] }), _jsx(QuickSendRow, { destination: destination })] }, destination.id))), (data?.length || 0) === 0 && (_jsx("div", { className: "rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground", children: "No destinations saved yet. Add your first Slack channel or Telegram chat on the right." }))] })] }), _jsxs("section", { className: "rounded-2xl border bg-card p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Add destination" }), _jsxs("div", { className: "mt-4 space-y-3", children: [_jsx(Input, { value: form.name, onChange: (event) => setForm((current) => ({ ...current, name: event.target.value })), placeholder: "Daily digest channel" }), _jsxs(Select, { value: form.platform, onValueChange: (value) => setForm((current) => ({
                                        ...current,
                                        platform: value,
                                    })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "slack", children: "Slack" }), _jsx(SelectItem, { value: "telegram", children: "Telegram" }), _jsx(SelectItem, { value: "email", children: "Email" })] })] }), _jsx(Input, { value: form.destination, onChange: (event) => setForm((current) => ({
                                        ...current,
                                        destination: event.target.value,
                                    })), placeholder: form.platform === "slack"
                                        ? "C0123456789"
                                        : form.platform === "email"
                                            ? "teammate+qa@agent-native.test"
                                            : "123456789" }), _jsx(Input, { value: form.threadRef, onChange: (event) => setForm((current) => ({
                                        ...current,
                                        threadRef: event.target.value,
                                    })), placeholder: "Optional thread or topic id" }), _jsx(Textarea, { value: form.notes, onChange: (event) => setForm((current) => ({
                                        ...current,
                                        notes: event.target.value,
                                    })), placeholder: "What should use this destination?" }), _jsx(Button, { className: "w-full", onClick: () => upsert.mutate({
                                        name: form.name,
                                        platform: form.platform,
                                        destination: form.destination,
                                        threadRef: form.threadRef || undefined,
                                        notes: form.notes || undefined,
                                    }), disabled: !form.name || !form.destination, children: "Save destination" })] })] })] }) }));
}
//# sourceMappingURL=destinations.js.map