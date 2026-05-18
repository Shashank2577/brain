import type { ActionEntry } from "./production-agent.js";
export declare const TOOL_SEARCH_ACTION_NAME = "tool-search";
type ToolSearchArgs = {
    query?: unknown;
    limit?: unknown;
    includeSchemas?: unknown;
};
type ToolParameterSummary = {
    name: string;
    type?: string;
    required: boolean;
    description?: string;
    enum?: string[];
};
type ToolSearchResult = {
    name: string;
    kind: "action" | "mcp";
    source?: string;
    description: string;
    score: number;
    parameters: ToolParameterSummary[];
    inputSchema?: unknown;
};
type ToolSearchOptions = {
    defaultLimit?: number;
    maxLimit?: number;
};
export declare function createToolSearchEntry(getRegistry: () => Record<string, ActionEntry>, options?: ToolSearchOptions): ActionEntry;
export declare function attachToolSearch(registry: Record<string, ActionEntry>, options?: ToolSearchOptions): Record<string, ActionEntry>;
export declare function searchToolRegistry(registry: Record<string, ActionEntry>, args?: ToolSearchArgs, options?: ToolSearchOptions): {
    query: string;
    totalTools: number;
    count: number;
    results: ToolSearchResult[];
};
export {};
//# sourceMappingURL=tool-search.d.ts.map