import { type AgentWebConfig, type AgentWebCrawlerCategory } from "./config.js";
export interface AgentWebPage {
    path: string;
    title: string;
    description?: string;
    markdown?: string;
    markdownPath?: string;
    lastmod?: string | Date;
}
export interface BuildAgentWebStaticFilesOptions {
    siteName: string;
    siteUrl: string;
    description?: string;
    pages: AgentWebPage[];
    config: AgentWebConfig;
    organization?: {
        name: string;
        url?: string;
        sameAs?: string[];
    };
}
export interface AgentWebStaticFile {
    path: string;
    content: string;
}
export interface MarkdownResponseHeadersOptions {
    siteUrl: string;
    pagePath: string;
    markdownPath?: string;
    markdown: string;
}
export declare const AGENT_WEB_CRAWLER_USER_AGENTS: Record<AgentWebCrawlerCategory, string[]>;
export declare function buildAgentWebStaticFiles(options: BuildAgentWebStaticFilesOptions): AgentWebStaticFile[];
export declare function buildRobotsTxt(options: {
    siteUrl: string;
    config: Pick<AgentWebConfig, "crawlerPolicy" | "crawlers">;
    sitemapPath?: string;
}): string;
export declare function buildSitemapXml(pages: AgentWebPage[], siteUrl: string): string;
export declare function buildLlmsTxt(options: Omit<BuildAgentWebStaticFilesOptions, "config">): string;
export declare function buildLlmsFullTxt(options: Omit<BuildAgentWebStaticFilesOptions, "config">): string;
export declare function buildBaseJsonLd(options: {
    siteName: string;
    siteUrl: string;
    description?: string;
    organization?: {
        name: string;
        url?: string;
        sameAs?: string[];
    };
}): ({
    sameAs?: string[];
    "@context": string;
    "@type": string;
    name: string;
    url: string;
} | {
    description?: string;
    "@context": string;
    "@type": string;
    name: string;
    url: string;
})[];
export declare function buildPageJsonLd(options: {
    siteName: string;
    siteUrl: string;
    page: AgentWebPage;
}): ({
    isPartOf: {
        "@type": string;
        name: string;
        url: string;
    };
    description?: string;
    "@context": string;
    "@type": string;
    name: string;
    url: string;
    itemListElement?: undefined;
} | {
    "@context": string;
    "@type": string;
    itemListElement: {
        "@type": string;
        position: number;
        name: string;
        item: string;
    }[];
})[];
export declare function buildMarkdownResponseHeaders(options: MarkdownResponseHeadersOptions): Record<string, string>;
export declare function estimateMarkdownTokens(markdown: string): number;
export declare function markdownUrlForPage(pagePath: string, markdownPath?: string): string;
export declare function markdownFilePathForPage(pagePath: string, markdownPath?: string): string;
export declare function absoluteUrl(siteUrl: string, pagePath: string): string;
//# sourceMappingURL=generator.d.ts.map