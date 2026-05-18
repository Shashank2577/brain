import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconLock, IconBuilding, IconWorld } from "@tabler/icons-react";
/**
 * Tiny visibility chip for list views. Renders a small icon + label so users
 * can spot shared/public resources at a glance.
 */
export function VisibilityBadge({ visibility, size = 12, className, }) {
    const v = visibility ?? "private";
    const Icon = v === "public" ? IconWorld : v === "org" ? IconBuilding : IconLock;
    const label = v === "public" ? "Public" : v === "org" ? "Org" : "Private";
    return (_jsxs("span", { className: className, style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: size,
            color: "hsl(var(--muted-foreground))",
        }, children: [_jsx(Icon, { size: size + 2 }), label] }));
}
//# sourceMappingURL=VisibilityBadge.js.map