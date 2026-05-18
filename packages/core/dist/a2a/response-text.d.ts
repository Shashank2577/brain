import type { AgentChatEvent } from "../agent/types.js";
export interface CollectFinalResponseTextOptions {
    fallbackToPreToolText?: boolean;
}
export declare function collectFinalResponseTextFromAgentEvents(events: readonly AgentChatEvent[], options?: CollectFinalResponseTextOptions): string;
//# sourceMappingURL=response-text.d.ts.map