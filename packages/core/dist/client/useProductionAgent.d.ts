export interface ProductionAgentMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    toolCalls?: Array<{
        tool: string;
        input: Record<string, string>;
        result?: string;
    }>;
}
export interface UseProductionAgentOptions {
    /** API endpoint URL. Default: "/_agent-native/agent-chat" */
    apiUrl?: string;
}
export interface UseProductionAgentResult {
    messages: ProductionAgentMessage[];
    isGenerating: boolean;
    sendMessage: (text: string) => void;
    clearHistory: () => void;
}
/** @deprecated Use `AssistantChat` component instead */
export declare function useProductionAgent(options?: UseProductionAgentOptions): UseProductionAgentResult;
//# sourceMappingURL=useProductionAgent.d.ts.map