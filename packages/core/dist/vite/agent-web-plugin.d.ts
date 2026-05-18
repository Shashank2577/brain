import type { Plugin } from "vite";
import { type AgentWebInputConfig, type AgentWebPage } from "../agent-web/index.js";
export interface AgentWebVitePluginOptions {
    siteName: string;
    siteUrl: string;
    description?: string;
    pages: AgentWebPage[] | (() => AgentWebPage[]);
    agentWeb?: AgentWebInputConfig | boolean;
    outputDirs?: string[];
    organization?: {
        name: string;
        url?: string;
        sameAs?: string[];
    };
}
export declare function createAgentWebVitePlugin(options: AgentWebVitePluginOptions): Plugin;
//# sourceMappingURL=agent-web-plugin.d.ts.map