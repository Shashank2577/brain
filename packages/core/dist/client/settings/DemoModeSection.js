import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * <DemoModeSection /> — toggle that replaces names, emails, and numbers with
 * realistic fake data everywhere (UI + what the agent sees) while preserving
 * IDs and structure so the app keeps working.
 *
 * The toggle is stored in application_state under `demo-mode`
 * (`{ enabled: boolean }`) and written via `PUT
 * /_agent-native/application-state/demo-mode` (optimistic — flip first,
 * write in the background). It READS from `/_agent-native/demo/status`
 * instead, which ORs the per-user toggle with the `DEMO_MODE` env: a hosted
 * demo deployment is forced on and the switch is locked so it can't be
 * accidentally turned off on stage.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { agentNativePath } from "../api-path.js";
import { IconEyeOff } from "@tabler/icons-react";
const DEMO_STATUS_URL = agentNativePath("/_agent-native/demo/status");
const DEMO_MODE_WRITE_URL = agentNativePath("/_agent-native/application-state/demo-mode");
export function DemoModeSection() {
    const [enabled, setEnabled] = useState(null);
    const { data } = useQuery({
        queryKey: ["agent-native", "demo-mode"],
        queryFn: async () => {
            const res = await fetch(DEMO_STATUS_URL, { credentials: "include" });
            if (!res.ok)
                return null;
            return (await res.json());
        },
        refetchInterval: 4_000,
        staleTime: 2_000,
    });
    const serverEnabled = data?.enabled;
    const forced = data?.forced === true;
    // Surface the server value once it arrives (and on subsequent polls), but
    // never clobber an in-flight optimistic toggle with a stale read. When
    // forced by env, always reflect the locked-on state.
    useEffect(() => {
        if (forced) {
            setEnabled(true);
        }
        else if (typeof serverEnabled === "boolean") {
            setEnabled((prev) => (prev === null ? serverEnabled : prev));
        }
        else if (serverEnabled === undefined && data !== undefined) {
            setEnabled((prev) => (prev === null ? false : prev));
        }
    }, [serverEnabled, forced, data]);
    const toggle = async (next) => {
        if (forced)
            return;
        const previous = enabled;
        // Optimistic: flip immediately, write in the background.
        setEnabled(next);
        try {
            const res = await fetch(DEMO_MODE_WRITE_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ enabled: next }),
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
        }
        catch {
            setEnabled(previous);
        }
    };
    return (_jsxs("div", { className: "flex items-start justify-between gap-3 rounded-md border border-border bg-accent/30 px-2.5 py-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-[11px] font-medium text-foreground", children: "Enable demo mode" }), _jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: "Replace names, emails, and numbers with realistic fake data everywhere \u2014 in the UI and what the agent sees. IDs and structure are preserved so the app keeps working." }), forced && (_jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: ["Enforced by the ", _jsx("code", { children: "DEMO_MODE" }), " environment variable \u2014 can't be turned off here."] }))] }), _jsx("button", { type: "button", role: "switch", "aria-checked": !!enabled, "aria-label": "Enable demo mode", disabled: enabled === null || forced, onClick: () => toggle(!enabled), 
                // Theme tokens; streaming agent owns layout.
                className: `relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors ${enabled
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"} ${enabled === null || forced ? "opacity-60" : ""}`, children: _jsx("span", { className: `inline-block h-3 w-3 transform rounded-full bg-background transition-transform ${enabled ? "translate-x-3.5" : "translate-x-0.5"}` }) })] }));
}
export function DemoModeIcon() {
    return _jsx(IconEyeOff, { size: 14 });
}
//# sourceMappingURL=DemoModeSection.js.map