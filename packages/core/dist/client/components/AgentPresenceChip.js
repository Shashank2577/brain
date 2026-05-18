import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const pulseKeyframes = `
@keyframes _anChipPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
`;
let styleInjected = false;
function injectStyles() {
    if (styleInjected || typeof document === "undefined")
        return;
    const style = document.createElement("style");
    style.textContent = pulseKeyframes;
    document.head.appendChild(style);
    styleInjected = true;
}
export function AgentPresenceChip({ active, label = "AI editing", color = "#00B5FF", className, }) {
    if (!active)
        return null;
    injectStyles();
    return (_jsxs("span", { className: className, style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            height: 20,
            padding: "0 8px",
            borderRadius: 9999,
            backgroundColor: `${color}20`,
            color,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
        }, children: [_jsx("span", { style: {
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: color,
                    animation: "_anChipPulse 2s infinite",
                    flexShrink: 0,
                } }), label] }));
}
//# sourceMappingURL=AgentPresenceChip.js.map