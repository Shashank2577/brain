import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconChecklist, IconChevronRight } from "@tabler/icons-react";
import { useOnboarding } from "./use-onboarding.js";
export function OnboardingBanner({ onContinue, className, }) {
    const { loading, totalCount, completeCount, allComplete, dismissed } = useOnboarding();
    if (loading || totalCount === 0 || allComplete || dismissed)
        return null;
    return (_jsxs("button", { type: "button", onClick: onContinue, className: className, style: styles.root, children: [_jsxs("span", { style: styles.left, children: [_jsx(IconChecklist, { size: 14, style: { color: "#60a5fa" } }), _jsx("span", { style: styles.title, children: "Setup" }), _jsxs("span", { style: styles.counter, children: [completeCount, " of ", totalCount, " complete"] })] }), _jsxs("span", { style: styles.cta, children: ["Continue", _jsx(IconChevronRight, { size: 12 })] })] }));
}
const styles = {
    root: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "8px 12px",
        border: "none",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(59,130,246,0.06)",
        color: "inherit",
        fontSize: 12,
        cursor: "pointer",
        textAlign: "left",
    },
    left: { display: "flex", alignItems: "center", gap: 6 },
    title: { fontWeight: 600 },
    counter: { opacity: 0.65, marginLeft: 4 },
    cta: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        color: "#60a5fa",
        fontWeight: 500,
    },
};
//# sourceMappingURL=OnboardingBanner.js.map