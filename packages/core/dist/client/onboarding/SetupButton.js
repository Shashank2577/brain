import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconChecklist } from "@tabler/icons-react";
import { useOnboarding } from "./use-onboarding.js";
import { useDevMode } from "../use-dev-mode.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
const DEV_ONLY_STEP_IDS = new Set(["database", "auth"]);
export function SetupButton({ className }) {
    const { dismissed, loading, steps, reopen } = useOnboarding();
    const { isDevMode } = useDevMode();
    const visibleSteps = isDevMode
        ? steps
        : steps.filter((s) => !DEV_ONLY_STEP_IDS.has(s.id));
    const totalCount = visibleSteps.length;
    const allComplete = visibleSteps
        .filter((s) => s.required)
        .every((s) => s.complete);
    if (loading || totalCount === 0)
        return null;
    if (!dismissed)
        return null;
    if (allComplete)
        return null;
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { type: "button", onClick: reopen, "aria-label": "Re-open setup", className: className, style: {
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 5,
                        border: "1px solid rgba(96,165,250,0.3)",
                        background: "rgba(59,130,246,0.08)",
                        color: "#60a5fa",
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                    }, children: [_jsx(IconChecklist, { size: 12 }), "Setup"] }) }), _jsx(TooltipContent, { children: "Re-open setup" })] }));
}
//# sourceMappingURL=SetupButton.js.map