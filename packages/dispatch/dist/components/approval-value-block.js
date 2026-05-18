import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function parseApprovalValue(value) {
    if (!value)
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
}
export function approvalValuePreview(value) {
    if (value === null || value === undefined)
        return "None";
    if (typeof value === "string")
        return value;
    return JSON.stringify(value, null, 2);
}
export function ApprovalValueBlock({ label, value, }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "text-[11px] font-medium uppercase text-muted-foreground", children: label }), _jsx("pre", { className: "max-h-40 overflow-auto rounded-lg border bg-background p-2 text-[11px] leading-relaxed text-foreground", children: approvalValuePreview(value) })] }));
}
//# sourceMappingURL=approval-value-block.js.map