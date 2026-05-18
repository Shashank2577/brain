import type { ActionEntry } from "../agent/production-agent.js";
export interface CreateBrowserSessionActionEntriesOptions {
    getOwnerEmail: () => string | null | undefined;
    getDefaultTimeoutMs?: () => number | undefined;
}
export declare function createBrowserSessionActionEntries(options: CreateBrowserSessionActionEntriesOptions): Record<string, ActionEntry>;
//# sourceMappingURL=actions.d.ts.map