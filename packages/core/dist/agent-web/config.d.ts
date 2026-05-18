import { type WorkspaceAppAudience } from "../shared/workspace-app-audience.js";
export declare const AGENT_WEB_CRAWLER_CATEGORIES: readonly ["training", "search", "userTriggered", "codingAgents", "autonomousAgents"];
export type AgentWebCrawlerCategory = (typeof AGENT_WEB_CRAWLER_CATEGORIES)[number];
export type AgentWebCrawlerDecision = "allow" | "disallow";
export type AgentWebCrawlerPolicy = "discoverable-no-training" | "allow-all" | "disallow-all";
export type AgentWebCrawlerOverrides = Partial<Record<AgentWebCrawlerCategory, AgentWebCrawlerDecision>>;
export interface AgentWebInputConfig {
    discoverable?: boolean;
    markdownTwins?: boolean;
    llmsTxt?: boolean;
    jsonLd?: boolean;
    publicAgentCard?: boolean;
    publicMcp?: boolean;
    crawlerPolicy?: AgentWebCrawlerPolicy;
    crawlers?: AgentWebCrawlerOverrides;
}
export interface AgentWebConfig {
    discoverable: boolean;
    markdownTwins: boolean;
    llmsTxt: boolean;
    jsonLd: boolean;
    publicAgentCard: boolean;
    publicMcp: boolean;
    crawlerPolicy: AgentWebCrawlerPolicy;
    crawlers: AgentWebCrawlerOverrides;
}
export interface DeriveAgentWebPublicRoutesOptions {
    audience?: WorkspaceAppAudience;
    publicPaths?: string[];
    protectedPaths?: string[];
    routes?: string[];
}
export declare const DEFAULT_AGENT_WEB_CRAWLER_POLICY: AgentWebCrawlerPolicy;
export declare function normalizeAgentWebConfig(value: unknown, options?: {
    hasPublicRoutes?: boolean;
}): AgentWebConfig;
export declare function agentWebConfigFromPackageJson(pkg: unknown): AgentWebInputConfig | boolean | undefined;
export declare function resolveAgentWebCrawlerPolicy(config: Pick<AgentWebConfig, "crawlerPolicy" | "crawlers">): Record<AgentWebCrawlerCategory, AgentWebCrawlerDecision>;
export declare function deriveAgentWebPublicRoutes(options: DeriveAgentWebPublicRoutesOptions): string[];
export declare function pathPatternMatches(pattern: string, route: string): boolean;
//# sourceMappingURL=config.d.ts.map