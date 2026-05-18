import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Full-screen loading spinner rendered during SSR and initial hydration.
 * Uses inline SVG + styles because Tailwind may not be loaded yet on the server.
 * Respects the user's OS color scheme so dark-mode users don't get a white flash.
 */
export function DefaultSpinner() {
    return (_jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100%",
        }, children: [_jsx("svg", { role: "status", "aria-label": "Loading", width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: { animation: "an-spin 1s linear infinite", opacity: 0.7 }, children: _jsx("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }) }), _jsx("style", { children: `
        @keyframes an-spin { to { transform: rotate(360deg) } }
        @media (prefers-color-scheme: dark) {
          html { background: #09090b; color: #fafafa }
        }
      ` })] }));
}
//# sourceMappingURL=DefaultSpinner.js.map