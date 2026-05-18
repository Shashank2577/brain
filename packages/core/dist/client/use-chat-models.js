import { useCallback, useEffect, useRef, useState } from "react";
import { agentNativePath } from "./api-path.js";
import { DEFAULT_MODEL } from "../agent/default-model.js";
import { getReasoningEffortOptionsForModel, } from "../shared/reasoning-effort.js";
const DEFAULT_STORAGE_KEY = "agent-native:chat-models:selection";
function readPersisted(key) {
    if (!key || typeof window === "undefined")
        return {};
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : {};
    }
    catch {
        return {};
    }
}
function writePersisted(key, value) {
    if (!key || typeof window === "undefined")
        return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
    catch { }
}
/**
 * Fetches available engines/models from the agent server and exposes the same
 * model picker state that `MultiTabAssistantChat` wires up — for surfaces like
 * the Dispatch homepage hero composer that need an identical model picker
 * without mounting the full tabbed chat.
 */
export function useChatModels({ storageKey = DEFAULT_STORAGE_KEY, } = {}) {
    const [availableModels, setAvailableModels] = useState([]);
    const [defaultModel, setDefaultModel] = useState(DEFAULT_MODEL);
    const initialPersisted = readPersisted(storageKey);
    const [selectedModel, setSelectedModel] = useState(initialPersisted.model ?? DEFAULT_MODEL);
    const [selectedEngine, setSelectedEngine] = useState(initialPersisted.engine ?? "");
    const [selectedEffort, setSelectedEffort] = useState(initialPersisted.effort ?? "auto");
    const selectionRef = useRef({
        selectedModel,
        selectedEngine,
        selectedEffort,
    });
    useEffect(() => {
        selectionRef.current = {
            selectedModel,
            selectedEngine,
            selectedEffort,
        };
    }, [selectedEffort, selectedEngine, selectedModel]);
    const onModelChange = useCallback((model, engine) => {
        const effortOptions = getReasoningEffortOptionsForModel(model);
        setSelectedModel(model);
        setSelectedEngine(engine);
        setSelectedEffort((prevEffort) => {
            const next = prevEffort === "auto" || effortOptions.includes(prevEffort)
                ? prevEffort
                : "auto";
            writePersisted(storageKey, { model, engine, effort: next });
            return next;
        });
    }, [storageKey]);
    const onEffortChange = useCallback((effort) => {
        setSelectedEffort(effort);
        writePersisted(storageKey, {
            model: selectedModel,
            engine: selectedEngine,
            effort,
        });
    }, [selectedEngine, selectedModel, storageKey]);
    const refreshEngines = useCallback(() => {
        Promise.all([
            fetch(agentNativePath("/_agent-native/actions/manage-agent-engine"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "list" }),
            }).then((r) => (r.ok ? r.json() : null)),
            fetch(agentNativePath("/_agent-native/env-status"))
                .then((r) => (r.ok ? r.json() : []))
                .catch(() => []),
            fetch(agentNativePath("/_agent-native/builder/status"))
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null),
        ])
            .then(([enginesData, envKeys, builderStatus]) => {
            if (!enginesData?.engines)
                return;
            const configuredKeys = new Set(envKeys
                .filter((k) => k.configured)
                .map((k) => k.key));
            const builderConnected = builderStatus?.configured === true;
            const currentEngineName = enginesData.current?.engine;
            const currentModel = enginesData.current?.model;
            let groups;
            if (builderConnected) {
                const builderEngine = enginesData.engines.find((e) => e.name === "builder");
                const builderModels = builderEngine?.supportedModels ?? [];
                const claude = builderModels.filter((m) => m.startsWith("claude-"));
                const openai = builderModels.filter((m) => m.startsWith("gpt-"));
                const gemini = builderModels.filter((m) => m.startsWith("gemini-"));
                const other = builderModels.filter((m) => !m.startsWith("claude-") &&
                    !m.startsWith("gpt-") &&
                    !m.startsWith("gemini-"));
                groups = [
                    ...(claude.length
                        ? [
                            {
                                engine: "builder",
                                label: "Claude",
                                models: claude,
                                configured: true,
                            },
                        ]
                        : []),
                    ...(openai.length
                        ? [
                            {
                                engine: "builder",
                                label: "OpenAI",
                                models: openai,
                                configured: true,
                            },
                        ]
                        : []),
                    ...(gemini.length
                        ? [
                            {
                                engine: "builder",
                                label: "Gemini",
                                models: gemini,
                                configured: true,
                            },
                        ]
                        : []),
                    ...(other.length
                        ? [
                            {
                                engine: "builder",
                                label: "More",
                                models: other,
                                configured: true,
                            },
                        ]
                        : []),
                ];
                if (currentModel && !builderModels.includes(currentModel)) {
                    const firstGroup = groups[0];
                    if (firstGroup)
                        firstGroup.models.unshift(currentModel);
                }
            }
            else {
                const allowedEngines = new Set([
                    "anthropic",
                    "ai-sdk:openai",
                    "ai-sdk:google",
                ]);
                groups = enginesData.engines
                    .filter((e) => allowedEngines.has(e.name))
                    .map((e) => {
                    const models = [...e.supportedModels];
                    if (e.name === currentEngineName &&
                        currentModel &&
                        !models.includes(currentModel)) {
                        models.unshift(currentModel);
                    }
                    return {
                        engine: e.name,
                        label: e.label,
                        models,
                        configured: e.requiredEnvVars.length === 0 ||
                            e.requiredEnvVars.some((v) => configuredKeys.has(v)) ||
                            e.name === currentEngineName,
                    };
                });
            }
            const nextDefaultModel = currentModel ?? DEFAULT_MODEL;
            setAvailableModels(groups);
            setDefaultModel(nextDefaultModel);
            const selection = selectionRef.current;
            const selectedGroup = groups.find((group) => group.models.includes(selection.selectedModel) &&
                (!selection.selectedEngine ||
                    group.engine === selection.selectedEngine));
            if (!selectedGroup) {
                const defaultGroup = groups.find((group) => group.models.includes(nextDefaultModel)) ??
                    groups[0];
                const nextModel = defaultGroup?.models.find((model) => model === nextDefaultModel) ??
                    defaultGroup?.models[0] ??
                    nextDefaultModel;
                const nextEngine = defaultGroup?.engine ?? "";
                const effortOptions = getReasoningEffortOptionsForModel(nextModel);
                const nextEffort = selection.selectedEffort === "auto" ||
                    effortOptions.includes(selection.selectedEffort)
                    ? selection.selectedEffort
                    : "auto";
                setSelectedModel(nextModel);
                setSelectedEngine(nextEngine);
                setSelectedEffort(nextEffort);
                writePersisted(storageKey, {
                    model: nextModel,
                    engine: nextEngine,
                    effort: nextEffort,
                });
            }
        })
            .catch(() => { });
    }, [storageKey]);
    useEffect(() => {
        refreshEngines();
    }, [refreshEngines]);
    return {
        availableModels,
        defaultModel,
        selectedModel,
        selectedEngine,
        selectedEffort,
        onModelChange,
        onEffortChange,
        refreshEngines,
    };
}
//# sourceMappingURL=use-chat-models.js.map