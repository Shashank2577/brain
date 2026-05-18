import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { PromptComposer, agentNativePath, appBasePath, isInBuilderFrame, sendToAgentChat, useDevMode, } from "@agent-native/core/client";
import { getWorkspaceAppIdValidationError } from "@agent-native/core/shared";
import { IconArrowLeft, IconArrowUpRight, IconBook, IconCheck, IconChevronDown, IconFileText, IconKey, IconLoader2, IconPlus, } from "@tabler/icons-react";
import { Popover, PopoverContent, PopoverTrigger, } from "../components/ui/popover.js";
import { Button } from "../components/ui/button.js";
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/^[^a-z]+/, "")
        .slice(0, 48);
}
function titleFromPrompt(prompt) {
    const cleaned = prompt
        .replace(/\b(build|create|make|an?|the|app|tool|dashboard)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    return slugify(cleaned || "new-app") || "new-app";
}
function buildAppCreationPrompt(input) {
    const keyList = input.selectedKeys.join(", ");
    const grantRequest = input.vaultAccessMode === "all-apps"
        ? `Dispatch vault access: all saved vault keys are available to every workspace app by default. No per-app vault grants are needed.`
        : keyList
            ? `Requested Dispatch vault key grants for this app: ${keyList}`
            : `Requested Dispatch vault key grants for this app: none`;
    const resourceList = input.selectedResources.length
        ? input.selectedResources
            .map((resource) => `- ${resource.name} (${resource.kind}, ${resource.path})`)
            .join("\n")
        : "none";
    return [
        `Create a new agent-native app in this workspace.`,
        `This is a new workspace app request, not a feature request for the current app.`,
        ``,
        `Suggested app name: ${input.appId} (you may adjust the slug if it conflicts)`,
        `User prompt: ${input.prompt.trim()}`,
        `Generate a concise one-sentence app description from the user prompt before coding; save it in apps/${input.appId}/package.json "description" so Dispatch and A2A can describe the app.`,
        `If the user mentions a product or company such as Granola, Loom, Superhuman, Linear, or Notion, treat it as product inspiration unless they explicitly ask to connect to that service. Do not invent or require third-party API keys like GRANOLA_API_KEY just because a product is named.`,
        grantRequest,
        `Requested Dispatch workspace resources for this app:\n${resourceList}`,
        `Dispatch workspace resources with scope=all are inherited workspace context. Do not copy or sync them into the new app; every workspace app reads them at runtime and may override with app shared or personal resources.`,
        ``,
        `Pick a starter template that fits the user's prompt — analytics, brain, calendar, content, design, dispatch, forms, mail, slides, clips, or starter when none of the others fit.`,
        `Use the workspace app layout: create it under apps/${input.appId}, mount it at /${input.appId}, keep it on the shared workspace database/hosting model, and avoid table-name collisions by namespacing any new domain tables to the app.`,
        `Important routing rule: from outside the app, link to /${input.appId}; inside apps/${input.appId}, React Router routes are app-local. Use <Link to="/review"> and navigate("/review"), not "/${input.appId}/review"; APP_BASE_PATH supplies the mounted prefix, and hardcoding it causes doubled URLs like /${input.appId}/${input.appId}/review.`,
        `Prefer useActionQuery/useActionMutation for actions. If you must raw-fetch framework endpoints, wrap them with agentNativePath("/_agent-native/actions/<name>") so mounted apps call the right URL.`,
        `Use relative workspace links like /${input.appId}. Do not hardcode localhost, 127.0.0.1, 8080, 8100, or any dev port; the active workspace gateway/browser origin owns the port.`,
        `Use the framework/template UI stack: shadcn/ui components and @tabler/icons-react. Do not add lucide-react or another icon library for standard UI.`,
        `Existing first-party apps are neighbors, not implementation details for this app. If the user's prompt mentions Mail, Calendar, Analytics, Brain, Dispatch, or other templates, treat them as existing hosted/connected apps that this app can link to or call through A2A/default connected agents. For example, Mail, Calendar, Analytics, and Brain already exist at https://mail.agent-native.com, https://calendar.agent-native.com, https://analytics.agent-native.com, and https://brain.agent-native.com.`,
        `Do not clone first-party templates, create wrapper apps, or scaffold child apps/routes for Mail, Calendar, Analytics, Brain, etc. inside apps/${input.appId} just so this app can access them. If the request is a cross-app dashboard or overview, build only the new dashboard/overview app and delegate to the existing apps for domain work.`,
        `Only create another first-party app copy when the user explicitly asks for a customized fork/copy of that app; otherwise keep using the hosted/shared app so improvements to the base template keep flowing to users.`,
        `Do not satisfy this by adding a route, page, component, or file inside apps/starter or another existing app unless the user explicitly asks to modify that existing app.`,
        input.vaultAccessMode === "all-apps"
            ? `Do not create per-app Dispatch vault grants unless the workspace switches vault access to manual or the user explicitly asks for manual grants.`
            : keyList
                ? `After the app exists, grant the selected Dispatch vault keys to appId "${input.appId}" and sync them once the app server is available. Treat these as requested grants, not active grants before creation succeeds.`
                : `Do not grant any Dispatch vault keys unless the user asks later.`,
        input.selectedResources.length
            ? `After the app exists, grant the selected Dispatch workspace resources to appId "${input.appId}". Do not sync All-app workspace resources; they are inherited.`
            : `Do not grant any selected-only Dispatch workspace resources unless the user asks later.`,
        ``,
        `App readiness requirements before handing off:`,
        `- Ensure apps/${input.appId}/package.json exists with displayName/name and a concise description; Dispatch discovers workspace apps from apps/<app-id>/package.json, not a separate app registry.`,
        `- Update the app manifest/package/deploy metadata needed by the existing workspace deployment model.`,
        `- Ensure the React Router client entry preserves APP_BASE_PATH/VITE_APP_BASE_PATH via appBasePath() so /${input.appId} hydrates correctly.`,
        `- Verify the app's agent card/A2A metadata is ready so Dispatch can discover and delegate to the app after deployment. Every sibling workspace app is available over A2A by default through call-agent, with names and descriptions from the workspace app registry.`,
        `When it is ready, start or update the workspace dev server and navigate the user to the absolute path /${input.appId} on the workspace origin. Do not prefix with /dispatch/, /apps/, /workspace/, or any other Dispatch tab — the new app is mounted at the workspace root, not under Dispatch. If you have a navigate tool available, pass /${input.appId} verbatim; if you only have a window.location-style escape hatch, set it to /${input.appId}.`,
    ].join("\n");
}
async function fetchJson(url, init) {
    const res = await fetch(url, init);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(data?.error || data?.message || `Request failed ${res.status}`);
    }
    return data;
}
function defaultDispatchBasePath() {
    const base = appBasePath();
    if (base === "/dispatch")
        return null;
    return null;
}
function actionUrl(basePath, action) {
    const path = `/_agent-native/actions/${action}`;
    if (basePath === null)
        return agentNativePath(path);
    const normalized = basePath.replace(/\/+$/, "");
    return `${normalized}${path}`;
}
/**
 * Inline two-step app-creation flow: prompt → optional access picker → submit.
 * Used both in the popover form and in the dedicated `/new-app` page so the
 * same UX shows up everywhere a teammate kicks off a new workspace app.
 */
export function CreateAppFlow({ onClose, className = "", }) {
    const [step, setStep] = useState("prompt");
    const [prompt, setPrompt] = useState("");
    const [selectedSecretIds, setSelectedSecretIds] = useState([]);
    const [selectedResourceIds, setSelectedResourceIds] = useState([]);
    const [secrets, setSecrets] = useState([]);
    const [resources, setResources] = useState([]);
    const [vaultAccessMode, setVaultAccessMode] = useState("all-apps");
    const [secretsError, setSecretsError] = useState(null);
    const [resourcesError, setResourcesError] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null);
    const [branchUrl, setBranchUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isDevMode } = useDevMode();
    const basePath = useMemo(() => defaultDispatchBasePath(), []);
    // Fetch access options eagerly so step 2 has them ready immediately.
    useEffect(() => {
        let cancelled = false;
        fetchJson(actionUrl(basePath, "list-vault-secret-options"))
            .then((data) => {
            if (cancelled)
                return;
            setSecrets(Array.isArray(data) ? data : []);
            setSecretsError(null);
        })
            .catch((err) => {
            if (cancelled)
                return;
            setSecrets([]);
            setSecretsError(err?.message || "Could not load Dispatch keys");
        });
        fetchJson(actionUrl(basePath, "get-vault-access-settings"))
            .then((data) => {
            if (cancelled)
                return;
            setVaultAccessMode(data?.mode === "manual" ? "manual" : "all-apps");
        })
            .catch(() => {
            if (cancelled)
                return;
            setVaultAccessMode("manual");
        });
        fetchJson(actionUrl(basePath, "list-workspace-resource-options"))
            .then((data) => {
            if (cancelled)
                return;
            setResources(Array.isArray(data) ? data : []);
            setResourcesError(null);
        })
            .catch((err) => {
            if (cancelled)
                return;
            setResources([]);
            setResourcesError(err?.message || "Could not load Dispatch resources");
        });
        return () => {
            cancelled = true;
        };
    }, [basePath]);
    const selectedSecrets = useMemo(() => secrets.filter((s) => selectedSecretIds.includes(s.id)), [secrets, selectedSecretIds]);
    const selectedResources = useMemo(() => resources.filter((r) => selectedResourceIds.includes(r.id)), [resources, selectedResourceIds]);
    const selectedSecretLabel = vaultAccessMode === "all-apps"
        ? "all keys"
        : selectedSecretIds.length === 0
            ? "no keys"
            : `${selectedSecretIds.length} key${selectedSecretIds.length === 1 ? "" : "s"}`;
    const selectedResourceLabel = selectedResourceIds.length === 0
        ? "no resources"
        : `${selectedResourceIds.length} resource${selectedResourceIds.length === 1 ? "" : "s"}`;
    const selectedAccessLabel = [selectedSecretLabel, selectedResourceLabel].join(" · ");
    function toggleSecret(id) {
        setSelectedSecretIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
    }
    function toggleResource(id) {
        setSelectedResourceIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
    }
    async function submit(rawPrompt) {
        const trimmed = rawPrompt.trim();
        if (!trimmed || isSubmitting)
            return;
        const appId = titleFromPrompt(trimmed);
        const validationError = getWorkspaceAppIdValidationError(appId);
        if (validationError) {
            setStatusMessage(validationError);
            return;
        }
        const message = buildAppCreationPrompt({
            appId,
            prompt: trimmed,
            selectedKeys: vaultAccessMode === "manual"
                ? selectedSecrets.map((s) => s.credentialKey)
                : [],
            selectedResources,
            vaultAccessMode,
        });
        setIsSubmitting(true);
        setStatusMessage(null);
        setBranchUrl(null);
        try {
            if (isInBuilderFrame()) {
                sendToAgentChat({ message, submit: true, type: "code" });
                setStatusMessage("Sent to Builder chat.");
                onClose?.();
            }
            else if (isDevMode) {
                sendToAgentChat({ message, submit: true, type: "code", newTab: true });
                setStatusMessage("Sent to the local agent.");
                onClose?.();
            }
            else {
                const result = await fetchJson(actionUrl(basePath, "start-workspace-app-creation"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: trimmed,
                        appId,
                        secretIds: vaultAccessMode === "manual" && selectedSecretIds.length > 0
                            ? selectedSecretIds
                            : [],
                        resourceIds: selectedResourceIds.length > 0 ? selectedResourceIds : [],
                    }),
                });
                if (result?.mode === "builder") {
                    setBranchUrl(result?.url || null);
                    setStatusMessage("Builder branch created.");
                }
                else {
                    setStatusMessage(result?.message ||
                        "Builder app creation is coming soon. Open this workspace in Builder to create an app from this prompt.");
                }
            }
        }
        catch (err) {
            setStatusMessage(err?.message || "Could not start the new app flow.");
        }
        finally {
            setIsSubmitting(false);
        }
    }
    const submitWithSelectedAccess = () => submit(prompt);
    return (_jsxs("div", { className: `flex flex-col gap-3 ${className}`, children: [step === "prompt" ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between gap-2 px-1", children: [_jsx("p", { className: "text-sm font-semibold text-foreground", children: "Create app" }), _jsxs("button", { type: "button", onClick: () => setStep("access"), className: "inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/50", children: [_jsx(IconKey, { size: 11 }), selectedAccessLabel] })] }), _jsx(PromptComposer, { autoFocus: true, disabled: isSubmitting, placeholder: "Describe the app your teammate should be able to use...", draftScope: "dispatch:create-app", preserveDraftOnSubmit: true, onSubmit: (text) => {
                            setPrompt(text);
                            submit(text);
                        } })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between gap-2 px-1", children: [_jsxs("button", { type: "button", onClick: () => setStep("prompt"), className: "inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground", children: [_jsx(IconArrowLeft, { size: 12 }), "Back"] }), _jsx("span", { className: "text-[11px] text-muted-foreground/70", children: selectedAccessLabel })] }), _jsxs("div", { className: "max-h-[180px] space-y-2 overflow-y-auto rounded-md border border-border bg-card p-2", children: [_jsxs("div", { className: "flex items-center gap-1.5 px-1 pb-1 text-[11px] font-medium text-muted-foreground", children: [_jsx(IconKey, { size: 12 }), "Dispatch keys"] }), vaultAccessMode === "all-apps" ? (_jsx("p", { className: "rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground", children: "Every saved Dispatch vault key is available to new apps." })) : secretsError ? (_jsx("p", { className: "rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground", children: secretsError })) : secrets.length === 0 ? (_jsx("p", { className: "rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground", children: "No Dispatch vault keys found yet." })) : (secrets.map((secret) => {
                                const selected = selectedSecretIds.includes(secret.id);
                                return (_jsxs("div", { className: `group rounded-md border text-sm ${selected
                                        ? "border-primary/45 bg-primary/5"
                                        : "border-border hover:border-muted-foreground/40 hover:bg-accent/35"}`, children: [_jsxs("button", { type: "button", "aria-pressed": selected, onClick: () => toggleSecret(secret.id), className: "flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-left", children: [_jsx("span", { className: `mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected
                                                        ? "border-primary/60 bg-primary/10 text-primary"
                                                        : "border-muted-foreground/35 text-transparent"}`, children: selected ? _jsx(IconCheck, { className: "h-3 w-3" }) : null }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate font-medium", children: secret.credentialKey }), _jsx("span", { className: "block truncate text-xs text-muted-foreground/70", children: selected
                                                                ? "Will be requested for this app"
                                                                : "Click to request" })] })] }), (secret.provider || secret.name) && (_jsxs("details", { className: "group/details border-t border-border/60 px-3 py-1.5 text-xs text-muted-foreground/75", children: [_jsxs("summary", { className: "flex cursor-pointer list-none items-center gap-1.5 text-[11px] hover:text-muted-foreground [&::-webkit-details-marker]:hidden", children: [_jsx(IconChevronDown, { className: "h-3 w-3 transition-transform group-open/details:rotate-180" }), "Details"] }), _jsxs("div", { className: "mt-1.5 space-y-1 pb-0.5 pl-4", children: [_jsxs("div", { className: "truncate", children: ["Provider: ", secret.provider || "Not specified"] }), _jsxs("div", { className: "truncate", children: ["Name: ", secret.name] })] })] }))] }, secret.id));
                            }))] }), _jsxs("div", { className: "max-h-[180px] space-y-2 overflow-y-auto rounded-md border border-border bg-card p-2", children: [_jsxs("div", { className: "flex items-center gap-1.5 px-1 pb-1 text-[11px] font-medium text-muted-foreground", children: [_jsx(IconBook, { size: 12 }), "Resource packs"] }), resourcesError ? (_jsx("p", { className: "rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground", children: resourcesError })) : resources.length === 0 ? (_jsx("p", { className: "rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground", children: "No Dispatch resource packs found yet." })) : (resources.map((resource) => {
                                const selected = selectedResourceIds.includes(resource.id);
                                return (_jsxs("div", { className: `group rounded-md border text-sm ${selected
                                        ? "border-primary/45 bg-primary/5"
                                        : "border-border hover:border-muted-foreground/40 hover:bg-accent/35"}`, children: [_jsxs("button", { type: "button", "aria-pressed": selected, onClick: () => toggleResource(resource.id), className: "flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-left", children: [_jsx("span", { className: `mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected
                                                        ? "border-primary/60 bg-primary/10 text-primary"
                                                        : "border-muted-foreground/35 text-transparent"}`, children: selected ? _jsx(IconCheck, { className: "h-3 w-3" }) : null }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsxs("span", { className: "flex min-w-0 items-center gap-1.5", children: [_jsx(IconFileText, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground/70" }), _jsx("span", { className: "block truncate font-medium", children: resource.name })] }), _jsxs("span", { className: "block truncate text-xs text-muted-foreground/70", children: [resource.kind, " \u00B7 ", resource.path] })] })] }), _jsxs("details", { className: "group/details border-t border-border/60 px-3 py-1.5 text-xs text-muted-foreground/75", children: [_jsxs("summary", { className: "flex cursor-pointer list-none items-center gap-1.5 text-[11px] hover:text-muted-foreground [&::-webkit-details-marker]:hidden", children: [_jsx(IconChevronDown, { className: "h-3 w-3 transition-transform group-open/details:rotate-180" }), "Details"] }), _jsxs("div", { className: "mt-1.5 space-y-1 pb-0.5 pl-4", children: [_jsxs("div", { className: "truncate", children: ["Scope:", " ", resource.scope === "all"
                                                                    ? "All apps"
                                                                    : "Selected apps"] }), resource.description ? (_jsx("div", { className: "line-clamp-2", children: resource.description })) : null] })] })] }, resource.id));
                            }))] }), _jsx("div", { className: "flex items-center justify-end gap-2", children: _jsxs(Button, { type: "button", size: "sm", onClick: submitWithSelectedAccess, disabled: !prompt.trim() || isSubmitting, children: [isSubmitting ? (_jsx(IconLoader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(IconPlus, { className: "h-3.5 w-3.5" })), "Create app"] }) }), !prompt.trim() ? (_jsx("p", { className: "px-1 text-[11px] text-muted-foreground/70", children: "Add a prompt on the previous step before creating the app." })) : null] })), statusMessage ? (_jsxs("div", { className: "rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground", children: [statusMessage, branchUrl ? (_jsxs("a", { href: branchUrl, target: "_blank", rel: "noreferrer", className: "ml-2 inline-flex items-center gap-1 font-medium text-foreground underline", children: ["Open branch ", _jsx(IconArrowUpRight, { className: "h-3 w-3" })] })) : null] })) : null] }));
}
export function CreateAppPopover({ trigger, align = "center", }) {
    const [open, setOpen] = useState(false);
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: trigger ?? (_jsx("button", { type: "button", className: "flex min-h-32 cursor-pointer items-center justify-center rounded-lg border border-dashed bg-card p-4 text-sm font-medium text-muted-foreground transition hover:border-foreground/30 hover:text-foreground", children: _jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx(IconPlus, { size: 16 }), "Create app"] }) })) }), _jsx(PopoverContent, { align: align, sideOffset: 10, className: "w-[calc(100vw-2rem)] rounded-xl p-3 shadow-xl sm:w-[460px]", children: _jsx(CreateAppFlow, { onClose: () => setOpen(false) }) })] }));
}
//# sourceMappingURL=create-app-popover.js.map