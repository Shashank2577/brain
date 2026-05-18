import type { ChatThreadScope } from "./use-chat-threads.js";
export interface AgentDynamicSuggestionContext {
    navigation: unknown;
    selection: unknown;
    pendingSelection: unknown;
    url: unknown;
    scope?: ChatThreadScope | null;
}
export interface AgentDynamicSuggestionsConfig {
    /** Enable/disable dynamic suggestions. Defaults to true. */
    enabled?: boolean;
    /** Maximum number of suggestion chips after merging dynamic + static. */
    max?: number;
    /** Keep the caller-provided static suggestions after dynamic ones. Default true. */
    includeStatic?: boolean;
    /** Optional app-specific deterministic suggestion builder. */
    getSuggestions?: (context: AgentDynamicSuggestionContext) => string[];
}
export type AgentDynamicSuggestionsOption = boolean | AgentDynamicSuggestionsConfig;
interface NormalizedAgentDynamicSuggestionsConfig {
    enabled: boolean;
    max: number;
    includeStatic: boolean;
    getSuggestions?: (context: AgentDynamicSuggestionContext) => string[];
}
export declare function normalizeAgentDynamicSuggestionsConfig(option?: AgentDynamicSuggestionsOption): NormalizedAgentDynamicSuggestionsConfig;
export declare function buildDynamicAgentSuggestions(context: AgentDynamicSuggestionContext): string[];
export declare function dedupeSuggestions(suggestions: readonly string[]): string[];
export declare function mergeAgentSuggestions(options: {
    dynamicSuggestions: readonly string[];
    staticSuggestions?: readonly string[];
    includeStatic: boolean;
    max: number;
}): string[];
export declare function useAgentDynamicSuggestions(options: {
    staticSuggestions?: readonly string[];
    dynamicSuggestions?: AgentDynamicSuggestionsOption;
    browserTabId?: string;
    scope?: ChatThreadScope | null;
    enabled?: boolean;
}): string[] | undefined;
export {};
//# sourceMappingURL=dynamic-suggestions.d.ts.map