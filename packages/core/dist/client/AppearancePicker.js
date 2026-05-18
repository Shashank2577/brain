import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconCheck } from "@tabler/icons-react";
import { APPEARANCE_PRESETS, applyAppearance, useAppearance, } from "./appearance.js";
import { cn } from "./utils.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "./components/ui/tooltip.js";
export function AppearancePicker({ className, onChange, }) {
    const current = useAppearance();
    return (_jsx(TooltipProvider, { delayDuration: 250, children: _jsx("div", { role: "radiogroup", "aria-label": "Appearance", className: cn("flex flex-wrap items-center gap-2", className), children: APPEARANCE_PRESETS.map((preset) => {
                const active = current === preset.id;
                return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { type: "button", role: "radio", "aria-checked": active, "aria-label": preset.label, onClick: () => {
                                    applyAppearance(preset.id);
                                    onChange?.(preset.id);
                                }, className: cn("relative flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring", active && "border-foreground"), children: [_jsx("span", { "aria-hidden": true, className: "h-5 w-5 rounded-full", style: { background: preset.swatch } }), active && (_jsx("span", { className: "pointer-events-none absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background", children: _jsx(IconCheck, { className: "h-3 w-3 text-foreground", stroke: 3 }) }))] }) }), _jsx(TooltipContent, { children: preset.label })] }, preset.id));
            }) }) }));
}
//# sourceMappingURL=AppearancePicker.js.map