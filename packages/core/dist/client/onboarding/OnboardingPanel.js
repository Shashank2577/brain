import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
/**
 * <OnboardingPanel /> — the setup checklist that sits above the agent chat.
 *
 * The active step is expanded; completed steps collapse with a green check;
 * remaining steps sit dimmed below. Each method renders differently based on
 * its `kind` (link / form / builder-cli-auth / agent-task).
 */
import { useState, useEffect } from "react";
import { IconCheck, IconChecklist, IconChevronDown, IconChevronRight, IconChevronUp, IconExternalLink, IconKey, IconLoader2, } from "@tabler/icons-react";
import { useOnboarding } from "./use-onboarding.js";
import { useOnboardingPreviewMode } from "./use-preview-mode.js";
import { sendToAgentChat } from "../agent-chat.js";
import { useDevMode } from "../use-dev-mode.js";
import { useBuilderConnectFlow } from "../settings/useBuilderStatus.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
export function OnboardingPanel({ className, title = "Setup", }) {
    const previewMode = useOnboardingPreviewMode();
    const onboarding = useOnboarding({ preview: previewMode });
    const { isDevMode } = useDevMode();
    const { steps: rawSteps, currentStepId: rawCurrentStepId, dismissed, loading, refresh, complete, dismiss, } = onboarding;
    // `database` and `auth` steps only apply to local dev (SQLite default,
    // local-mode auth bypass). In production those are configured via env
    // vars / deployment config, so don't nag the user about them.
    const DEV_ONLY_STEP_IDS = new Set(["database", "auth"]);
    const steps = isDevMode
        ? rawSteps
        : rawSteps.filter((s) => !DEV_ONLY_STEP_IDS.has(s.id));
    const totalCount = steps.length;
    const completeCount = steps.filter((s) => s.complete).length;
    const allComplete = steps.filter((s) => s.required).every((s) => s.complete);
    const currentStepId = steps.some((s) => s.id === rawCurrentStepId)
        ? rawCurrentStepId
        : (steps.find((s) => s.required && !s.complete)?.id ??
            steps.find((s) => !s.complete)?.id ??
            null);
    // Default expanded. (Older code used `useState(!allComplete)`, but the first
    // render fires with `steps === []` — `[].every()` is vacuously true, so
    // `allComplete` was true and `expanded` got locked to false even after the
    // real incomplete steps loaded.)
    const [expanded, setExpanded] = useState(true);
    if (loading || totalCount === 0)
        return null;
    // Preview mode (dev overlay) bypasses the auto-hide so template authors
    // can render the new-user flow even when their own setup is done.
    if (!previewMode) {
        if (dismissed)
            return null;
        // Auto-hide once every required step is done — no need to take up sidebar
        // space when there's nothing left to do.
        if (allComplete)
            return null;
    }
    if (!expanded) {
        return (_jsx("div", { className: className, style: styles.compactBanner, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { type: "button", onClick: () => setExpanded(true), style: styles.compactBannerBtn, "aria-label": "Expand setup", children: [_jsx("span", { style: allComplete ? styles.checkDone : styles.checkTodo, children: allComplete ? _jsx(IconCheck, { size: 12, strokeWidth: 3 }) : null }), _jsx("span", { style: styles.headerTitle, children: title }), _jsxs("span", { style: styles.headerCounter, children: [completeCount, " of ", totalCount] }), _jsx("span", { style: { marginLeft: "auto", opacity: 0.5, display: "flex" }, children: _jsx(IconChevronDown, { size: 14 }) })] }) }), _jsx(TooltipContent, { children: "Expand setup" })] }) }));
    }
    return (_jsxs("div", { className: className, style: styles.root, children: [_jsxs("div", { style: styles.header, children: [_jsxs("div", { style: styles.headerLeft, children: [allComplete ? (_jsx("span", { style: styles.checkDone, children: _jsx(IconCheck, { size: 12, strokeWidth: 3 }) })) : (_jsx(IconChecklist, { size: 14, style: styles.headerIcon, "aria-hidden": true })), _jsx("span", { style: styles.headerTitle, children: title }), _jsxs("span", { style: styles.headerCounter, children: [completeCount, " of ", totalCount] })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => setExpanded(false), "aria-label": "Collapse onboarding", style: styles.dismissBtn, children: _jsx(IconChevronUp, { size: 14 }) }) }), _jsx(TooltipContent, { children: "Collapse" })] })] }), _jsx("div", { style: styles.list, children: steps.map((step) => (_jsx(StepCard, { step: step, expanded: step.id === currentStepId, onMarkComplete: () => complete(step.id), onRefresh: refresh }, step.id))) }), _jsx("div", { style: styles.footer, children: _jsx("button", { type: "button", onClick: dismiss, style: styles.hideLink, children: "Hide setup" }) })] }));
}
// ─── StepCard ──────────────────────────────────────────────────────────────
function StepCard({ step, expanded: expandedProp, onMarkComplete, onRefresh, }) {
    const [expanded, setExpanded] = useState(expandedProp);
    useEffect(() => setExpanded(expandedProp), [expandedProp]);
    const isDone = step.complete;
    const sortedMethods = [...step.methods].sort((a, b) => {
        if (!!a.primary === !!b.primary)
            return 0;
        return a.primary ? -1 : 1;
    });
    const handleCompleted = async () => {
        await onRefresh();
    };
    return (_jsxs("div", { style: {
            ...styles.card,
            ...(isDone ? styles.cardDone : null),
        }, children: [_jsxs("button", { type: "button", style: styles.cardHeader, onClick: () => setExpanded((e) => !e), "aria-expanded": expanded, children: [_jsxs("span", { style: styles.cardHeaderLeft, children: [_jsx("span", { style: isDone ? styles.checkDone : styles.checkTodo, children: isDone ? _jsx(IconCheck, { size: 12, strokeWidth: 3 }) : null }), _jsxs("span", { style: styles.cardTitle, children: [step.title, step.required && !isDone && (_jsx("span", { style: styles.requiredPill, children: "required" }))] })] }), _jsx("span", { style: styles.chevron, children: expanded ? (_jsx(IconChevronDown, { size: 14 })) : (_jsx(IconChevronRight, { size: 14 })) })] }), expanded && (_jsxs("div", { style: styles.cardBody, children: [_jsx("p", { style: styles.cardDesc, children: step.description }), _jsx(StepMethods, { step: step, methods: sortedMethods, onCompleted: handleCompleted, onMarkManualComplete: onMarkComplete })] }))] }));
}
function isFormMethod(method) {
    return method.kind === "form";
}
function StepMethods({ step, methods, onCompleted, onMarkManualComplete, }) {
    const formMethods = methods.filter(isFormMethod);
    if (step.id === "llm" || step.id === "image-generation") {
        return (_jsx(ManagedProviderMethodGroup, { methods: methods, formMethods: formMethods, stepId: step.id, secondaryLabel: step.id === "image-generation"
                ? "Add a Gemini API key"
                : "Add your own provider key", onCompleted: onCompleted, onMarkManualComplete: onMarkManualComplete }));
    }
    if (methods.length > 1 && formMethods.length === methods.length) {
        const pickerLabel = step.id === "auth" ? "Sign-in path" : "Provider";
        return (_jsx("div", { style: styles.methods, children: _jsx(FormMethodPicker, { methods: formMethods, label: pickerLabel, onCompleted: onCompleted }) }));
    }
    return (_jsx("div", { style: styles.methods, children: methods.map((method) => (_jsx(MethodBlock, { method: method, stepId: step.id, onCompleted: onCompleted, onMarkManualComplete: onMarkManualComplete }, method.id))) }));
}
function ManagedProviderMethodGroup({ methods, formMethods, stepId, secondaryLabel, onCompleted, onMarkManualComplete, }) {
    const [showKeyForm, setShowKeyForm] = useState(false);
    const primaryMethod = methods.find((method) => method.kind === "builder-cli-auth") ??
        methods.find((method) => method.primary);
    const otherMethods = methods.filter((method) => method !== primaryMethod && !isFormMethod(method));
    return (_jsxs("div", { style: styles.methods, children: [primaryMethod && (_jsx(MethodBlock, { method: primaryMethod, stepId: stepId, onCompleted: onCompleted, onMarkManualComplete: onMarkManualComplete })), formMethods.length > 0 && (_jsxs("div", { style: styles.secondaryPanel, children: [_jsxs("button", { type: "button", onClick: () => setShowKeyForm((value) => !value), style: styles.secondaryToggle, "aria-expanded": showKeyForm, children: [_jsxs("span", { style: styles.secondaryToggleLeft, children: [_jsx(IconKey, { size: 13, "aria-hidden": true }), _jsx("span", { children: secondaryLabel })] }), _jsx("span", { style: styles.chevron, children: showKeyForm ? (_jsx(IconChevronDown, { size: 14 })) : (_jsx(IconChevronRight, { size: 14 })) })] }), showKeyForm && (_jsx(FormMethodPicker, { methods: formMethods, label: "Provider", onCompleted: onCompleted, embedded: true }))] })), otherMethods.map((method) => (_jsx(MethodBlock, { method: method, stepId: stepId, onCompleted: onCompleted, onMarkManualComplete: onMarkManualComplete }, method.id)))] }));
}
function FormMethodPicker({ methods, label, onCompleted, embedded, }) {
    const [selectedId, setSelectedId] = useState(methods[0]?.id ?? "");
    useEffect(() => {
        if (!methods.some((method) => method.id === selectedId)) {
            setSelectedId(methods[0]?.id ?? "");
        }
    }, [methods, selectedId]);
    const selectedMethod = methods.find((method) => method.id === selectedId) ?? methods[0];
    if (!selectedMethod)
        return null;
    return (_jsxs("div", { style: embedded ? styles.methodPickerEmbedded : styles.method, children: [_jsxs("label", { style: styles.pickerLabel, children: [_jsx("span", { style: styles.formLabelText, children: label }), _jsx("select", { value: selectedMethod.id, onChange: (event) => setSelectedId(event.target.value), style: styles.select, children: methods.map((method) => (_jsx("option", { value: method.id, children: method.label }, method.id))) })] }), selectedMethod.description && (_jsx("p", { style: styles.methodDesc, children: selectedMethod.description })), _jsx(FormMethod, { method: selectedMethod, onCompleted: onCompleted }, selectedMethod.id)] }));
}
// ─── MethodBlock ───────────────────────────────────────────────────────────
function MethodBlock({ method, stepId, onCompleted, onMarkManualComplete, }) {
    return (_jsxs("div", { style: method.primary ? styles.methodPrimary : styles.method, children: [_jsx("div", { style: styles.methodHeader, children: _jsxs("span", { style: styles.methodLabel, children: [method.label, method.badge && (_jsx("span", { style: badgeStyle(method.badge), children: method.badge }))] }) }), method.description && (_jsx("p", { style: styles.methodDesc, children: method.description })), _jsx(MethodBody, { method: method, stepId: stepId, onCompleted: onCompleted, onMarkManualComplete: onMarkManualComplete })] }));
}
function MethodBody({ method, stepId, onCompleted, onMarkManualComplete, }) {
    if (method.disabled) {
        return (_jsx("button", { type: "button", disabled: true, style: buttonDisabled(method.primary), "aria-disabled": "true", children: method.disabledLabel ?? "Coming soon" }));
    }
    switch (method.kind) {
        case "link":
            return (_jsx(LinkMethod, { method: method, onMarkComplete: onMarkManualComplete }));
        case "form":
            return _jsx(FormMethod, { method: method, onCompleted: onCompleted });
        case "builder-cli-auth":
            return (_jsx(BuilderCliAuthMethod, { onCompleted: onCompleted, primary: method.primary }));
        case "agent-task":
            return _jsx(AgentTaskMethod, { method: method, stepId: stepId });
    }
}
// ─── link ──────────────────────────────────────────────────────────────────
function LinkMethod({ method, onMarkComplete, }) {
    const { url, external } = method.payload;
    const isNoop = !url || url === "#";
    if (isNoop) {
        // Sentinel URL — treat as "mark this method as the chosen one".
        return (_jsx("button", { type: "button", style: buttonPrimary(method.primary), onClick: onMarkComplete, children: "Use this option" }));
    }
    return (_jsxs("a", { href: url, target: external ? "_blank" : undefined, rel: external ? "noopener noreferrer" : undefined, style: { ...buttonPrimary(method.primary), textDecoration: "none" }, children: ["Continue", external && _jsx(IconExternalLink, { size: 12, style: { marginLeft: 4 } })] }));
}
// ─── form ──────────────────────────────────────────────────────────────────
function FormMethod({ method, onCompleted, }) {
    const { fields, writeScope } = method.payload;
    const [values, setValues] = useState({});
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr(null);
        try {
            const vars = fields
                .map((f) => ({ key: f.key, value: (values[f.key] ?? "").trim() }))
                .filter((v) => v.value !== "");
            if (vars.length === 0) {
                setErr("Enter a value first.");
                return;
            }
            const res = await fetch(agentNativePath("/_agent-native/env-vars"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vars, scope: writeScope ?? "workspace" }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? `Save failed: ${res.status}`);
            }
            setValues({});
            await onCompleted();
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : "Save failed");
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, style: styles.form, children: [fields.map((f) => (_jsxs("label", { style: styles.formLabel, children: [_jsx("span", { style: styles.formLabelText, children: f.label }), _jsx("input", { type: f.secret ? "password" : "text", value: values[f.key] ?? "", placeholder: f.placeholder, onChange: (e) => setValues((v) => ({ ...v, [f.key]: e.target.value })), style: styles.input, autoComplete: "off", spellCheck: false })] }, f.key))), err && _jsx("p", { style: styles.errText, children: err }), _jsx("button", { type: "submit", disabled: saving, style: { ...buttonPrimary(method.primary), opacity: saving ? 0.6 : 1 }, children: saving ? "Saving..." : "Save" })] }));
}
// ─── builder-cli-auth ──────────────────────────────────────────────────────
function BuilderCliAuthMethod({ onCompleted, primary, }) {
    const { connecting, error, start } = useBuilderConnectFlow({
        trackingSource: "onboarding_builder_cli_auth",
        onConnected: onCompleted,
    });
    return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => start(), disabled: connecting, style: { ...buttonPrimary(primary), opacity: connecting ? 0.7 : 1 }, children: connecting ? (_jsxs(_Fragment, { children: [_jsx(IconLoader2, { size: 12, style: { marginRight: 4 }, className: "animate-spin" }), "Waiting for Builder..."] })) : ("Connect Builder") }), connecting && (_jsx("p", { style: styles.methodHint, children: "A Builder tab opened. Choose your team or app space there; setup will continue here automatically." })), error && _jsx("p", { style: styles.errText, children: error })] }));
}
// ─── agent-task ────────────────────────────────────────────────────────────
function AgentTaskMethod({ method, stepId: _stepId, }) {
    const handleClick = () => {
        sendToAgentChat({ message: method.payload.prompt, submit: true });
    };
    return (_jsx("button", { type: "button", onClick: handleClick, style: buttonPrimary(method.primary), children: "Ask the agent" }));
}
// ─── styles ────────────────────────────────────────────────────────────────
function buttonPrimary(primary) {
    return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 12px",
        borderRadius: 6,
        border: primary
            ? "1px solid transparent"
            : "1px solid rgba(255,255,255,0.15)",
        background: primary ? "#3b82f6" : "rgba(255,255,255,0.04)",
        color: primary ? "#fff" : "inherit",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
    };
}
function buttonDisabled(primary) {
    return {
        ...buttonPrimary(primary),
        border: "1px solid rgba(255,255,255,0.12)",
        background: primary ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.5)",
        cursor: "not-allowed",
    };
}
function badgeStyle(kind) {
    const palette = {
        recommended: { bg: "rgba(59,130,246,0.15)", fg: "#60a5fa" },
        beta: { bg: "rgba(6,182,212,0.15)", fg: "#22d3ee" },
        free: { bg: "rgba(34,197,94,0.15)", fg: "#4ade80" },
        soon: { bg: "rgba(148,163,184,0.15)", fg: "#cbd5e1" },
    }[kind];
    return {
        marginLeft: 6,
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 4,
        background: palette.bg,
        color: palette.fg,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: 0.3,
    };
}
const styles = {
    root: {
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
        maxHeight: "60vh",
        minHeight: 0,
    },
    compactBanner: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(34,197,94,0.04)",
        fontSize: 12,
    },
    compactBannerBtn: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        color: "inherit",
        cursor: "pointer",
        padding: "6px 12px",
        flex: 1,
        minWidth: 0,
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: 6,
    },
    headerIcon: { color: "#60a5fa" },
    headerTitle: { fontWeight: 600, fontSize: 12 },
    headerCounter: {
        opacity: 0.5,
        fontSize: 11,
        marginLeft: 4,
    },
    dismissBtn: {
        background: "transparent",
        border: "none",
        color: "inherit",
        opacity: 0.5,
        cursor: "pointer",
        padding: 2,
        display: "flex",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "4px 8px 10px",
        overflowY: "auto",
        minHeight: 0,
        flex: "1 1 auto",
    },
    card: {
        border: "1px solid hsl(var(--border, 0 0% 100%) / 0.06)",
        borderRadius: 6,
        background: "hsl(var(--muted, 0 0% 0%) / 0.12)",
    },
    cardDone: {
        borderColor: "rgba(34,197,94,0.12)",
        background: "rgba(34,197,94,0.025)",
    },
    cardHeader: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "transparent",
        border: "none",
        color: "inherit",
        padding: "7px 9px",
        cursor: "pointer",
        textAlign: "left",
    },
    cardHeaderLeft: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
        flexWrap: "wrap",
    },
    requiredPill: {
        fontSize: 10,
        padding: "1px 5px",
        borderRadius: 4,
        background: "rgba(239,68,68,0.12)",
        color: "#f87171",
        fontWeight: 500,
    },
    chevron: { opacity: 0.5 },
    checkDone: {
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#22c55e",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    checkTodo: {
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.2)",
    },
    cardBody: {
        padding: "0 10px 10px 34px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    cardDesc: {
        margin: 0,
        opacity: 0.65,
        fontSize: 12,
        lineHeight: 1.4,
    },
    methods: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    method: {
        padding: "8px 10px",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 6,
        background: "rgba(255,255,255,0.02)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    methodPrimary: {
        padding: "10px",
        border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: 6,
        background: "rgba(59,130,246,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    methodHeader: { display: "flex", alignItems: "center" },
    methodLabel: { fontSize: 12, fontWeight: 500 },
    methodDesc: { margin: 0, opacity: 0.6, fontSize: 11, lineHeight: 1.4 },
    secondaryPanel: {
        paddingTop: 2,
    },
    secondaryToggle: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "7px 8px",
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.025)",
        color: "inherit",
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 500,
        textAlign: "left",
    },
    secondaryToggleLeft: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
    },
    methodPickerEmbedded: {
        paddingTop: 8,
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    pickerLabel: { display: "flex", flexDirection: "column", gap: 3 },
    form: { display: "flex", flexDirection: "column", gap: 6 },
    formLabel: { display: "flex", flexDirection: "column", gap: 2 },
    formLabelText: { fontSize: 11, opacity: 0.6 },
    select: {
        width: "100%",
        padding: "6px 8px",
        fontSize: 12,
        borderRadius: 5,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.25)",
        color: "inherit",
        outline: "none",
        boxSizing: "border-box",
    },
    input: {
        width: "100%",
        padding: "6px 8px",
        fontSize: 12,
        borderRadius: 5,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.25)",
        color: "inherit",
        outline: "none",
        boxSizing: "border-box",
    },
    methodHint: { margin: 0, fontSize: 11, color: "rgba(255,255,255,0.62)" },
    errText: { margin: 0, fontSize: 11, color: "#f87171" },
    footer: {
        padding: "0 12px 10px",
        display: "flex",
        justifyContent: "flex-end",
    },
    hideLink: {
        background: "transparent",
        border: "none",
        color: "inherit",
        opacity: 0.5,
        cursor: "pointer",
        fontSize: 11,
        padding: "2px 4px",
    },
};
//# sourceMappingURL=OnboardingPanel.js.map