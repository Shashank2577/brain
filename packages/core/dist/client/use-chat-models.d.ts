import { type ReasoningEffort } from "../shared/reasoning-effort.js";
export interface EngineModelGroup {
    engine: string;
    label: string;
    models: string[];
    configured: boolean;
}
export interface UseChatModelsResult {
    availableModels: EngineModelGroup[];
    defaultModel: string;
    selectedModel: string;
    selectedEngine: string;
    selectedEffort: ReasoningEffort;
    onModelChange: (model: string, engine: string) => void;
    onEffortChange: (effort: ReasoningEffort) => void;
    refreshEngines: () => void;
}
interface Options {
    /**
     * localStorage key used to persist the user's model + effort selection across
     * page loads. Pass `null` to disable persistence.
     */
    storageKey?: string | null;
    /**
     * Disable server-backed model discovery for hosts that provide their own
     * model list/state, such as Electron Code.
     */
    enabled?: boolean;
}
/**
 * Fetches available engines/models from the agent server and exposes the same
 * model picker state that `MultiTabAssistantChat` wires up — for surfaces like
 * the Dispatch homepage hero composer that need an identical model picker
 * without mounting the full tabbed chat.
 */
export declare function useChatModels({ storageKey, enabled, }?: Options): UseChatModelsResult;
export {};
//# sourceMappingURL=use-chat-models.d.ts.map