import type { ActionTool } from "../agent/types.js";
import type { ActionRunContext } from "../agent/production-agent.js";
export declare const tool: ActionTool;
export declare function run(args: Record<string, string>, context?: ActionRunContext, selfAppId?: string): Promise<string>;
export declare function expandRelativeUrls(text: string, agentUrl: string): string;
//# sourceMappingURL=call-agent.d.ts.map