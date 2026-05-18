import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function MissingKeyCard({ label, message, settingsPath, }) {
    return (_jsxs("div", { style: {
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "24px 28px",
            maxWidth: 420,
            margin: "32px auto",
            background: "#f8fafc",
            textAlign: "center",
        }, children: [_jsx("div", { style: {
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: 8,
                }, children: label }), _jsx("p", { style: { fontSize: 13, color: "#64748b", margin: "0 0 16px" }, children: message }), _jsx("a", { href: settingsPath, style: {
                    display: "inline-block",
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#fff",
                    background: "#3b82f6",
                    borderRadius: 6,
                    textDecoration: "none",
                }, children: "Go to Settings" })] }));
}
//# sourceMappingURL=MissingKeyCard.js.map