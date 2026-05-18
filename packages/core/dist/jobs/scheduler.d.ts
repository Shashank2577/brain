import { type ActionEntry } from "../agent/production-agent.js";
import type { AgentEngine } from "../agent/engine/types.js";
export interface JobFrontmatter {
    schedule: string;
    enabled: boolean;
    createdBy?: string;
    orgId?: string;
    runAs?: "creator" | "shared";
    lastRun?: string;
    lastStatus?: "success" | "error" | "running" | "skipped";
    lastError?: string;
    nextRun?: string;
}
export declare function parseJobFrontmatter(content: string): {
    meta: JobFrontmatter;
    body: string;
};
export declare function buildJobContent(meta: JobFrontmatter, body: string): string;
export interface SchedulerDeps {
    getActions: () => Record<string, ActionEntry>;
    getSystemPrompt: (owner: string) => Promise<string>;
    /** Optional engine override. Defaults to the resolved request engine. */
    engine?: AgentEngine;
    apiKey?: string;
    model?: string;
    /** App/template id used for org-scoped per-app model defaults. */
    appId?: string;
}
/**
 * Process all due recurring jobs. Called every 60 seconds.
 * Sequential execution with 5-minute timeout per job.
 */
export declare function processRecurringJobs(deps: SchedulerDeps): Promise<void>;
//# sourceMappingURL=scheduler.d.ts.map