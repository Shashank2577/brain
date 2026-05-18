import { normalizeWorkspaceAppAudience, normalizeWorkspaceAppPathList, } from "../shared/workspace-app-audience.js";
export const AGENT_WEB_CRAWLER_CATEGORIES = [
    "training",
    "search",
    "userTriggered",
    "codingAgents",
    "autonomousAgents",
];
export const DEFAULT_AGENT_WEB_CRAWLER_POLICY = "discoverable-no-training";
export function normalizeAgentWebConfig(value, options = {}) {
    const record = value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
    const disabled = value === false;
    const hasPublicRoutes = options.hasPublicRoutes === true;
    return {
        discoverable: disabled
            ? false
            : typeof record.discoverable === "boolean"
                ? record.discoverable
                : hasPublicRoutes,
        markdownTwins: typeof record.markdownTwins === "boolean" ? record.markdownTwins : true,
        llmsTxt: typeof record.llmsTxt === "boolean" ? record.llmsTxt : true,
        jsonLd: typeof record.jsonLd === "boolean" ? record.jsonLd : true,
        publicAgentCard: typeof record.publicAgentCard === "boolean"
            ? record.publicAgentCard
            : true,
        publicMcp: typeof record.publicMcp === "boolean" ? record.publicMcp : false,
        crawlerPolicy: isCrawlerPolicy(record.crawlerPolicy)
            ? record.crawlerPolicy
            : DEFAULT_AGENT_WEB_CRAWLER_POLICY,
        crawlers: normalizeCrawlerOverrides(record.crawlers),
    };
}
export function agentWebConfigFromPackageJson(pkg) {
    const config = agentNativeConfigFromPackageJson(pkg);
    const raw = config?.workspaceApp?.agentWeb ??
        config?.workspace?.agentWeb ??
        config?.agentWeb ??
        config?.root?.agentWeb;
    if (raw === undefined)
        return undefined;
    if (raw === false)
        return false;
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
        return undefined;
    return raw;
}
export function resolveAgentWebCrawlerPolicy(config) {
    const baseline = config.crawlerPolicy === "allow-all"
        ? {
            training: "allow",
            search: "allow",
            userTriggered: "allow",
            codingAgents: "allow",
            autonomousAgents: "allow",
        }
        : config.crawlerPolicy === "disallow-all"
            ? {
                training: "disallow",
                search: "disallow",
                userTriggered: "disallow",
                codingAgents: "disallow",
                autonomousAgents: "disallow",
            }
            : {
                training: "disallow",
                search: "allow",
                userTriggered: "allow",
                codingAgents: "allow",
                autonomousAgents: "allow",
            };
    for (const category of AGENT_WEB_CRAWLER_CATEGORIES) {
        const override = config.crawlers[category];
        if (override)
            baseline[category] = override;
    }
    return baseline;
}
export function deriveAgentWebPublicRoutes(options) {
    const audience = normalizeWorkspaceAppAudience(options.audience);
    const publicPaths = normalizeWorkspaceAppPathList(options.publicPaths ?? []);
    const protectedPaths = normalizeWorkspaceAppPathList(options.protectedPaths ?? []);
    const routes = normalizeWorkspaceAppPathList(options.routes ?? []);
    const sourceRoutes = routes.length > 0
        ? routes
        : audience === "public"
            ? publicPaths.length > 0
                ? publicPaths
                : ["/"]
            : publicPaths;
    const publicRoutes = audience === "public"
        ? sourceRoutes.filter((route) => !protectedPaths.some((pattern) => pathPatternMatches(pattern, route)))
        : sourceRoutes.filter((route) => publicPaths.some((pattern) => pathPatternMatches(pattern, route)));
    return Array.from(new Set(publicRoutes)).sort((a, b) => {
        if (a === "/")
            return -1;
        if (b === "/")
            return 1;
        return a.localeCompare(b);
    });
}
export function pathPatternMatches(pattern, route) {
    const normalizedPattern = normalizeWorkspaceAppPathList([pattern])[0];
    const normalizedRoute = normalizeWorkspaceAppPathList([route])[0];
    if (!normalizedPattern || !normalizedRoute)
        return false;
    if (normalizedPattern === "/*" || normalizedPattern === "/**")
        return true;
    if (normalizedPattern.endsWith("/*") || normalizedPattern.endsWith("/**")) {
        const base = normalizedPattern.replace(/\/\*\*?$/, "") || "/";
        return (normalizedRoute === base ||
            (base === "/"
                ? normalizedRoute.startsWith("/")
                : normalizedRoute.startsWith(`${base}/`)));
    }
    return normalizedPattern === normalizedRoute;
}
function normalizeCrawlerOverrides(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return {};
    const record = value;
    const out = {};
    for (const category of AGENT_WEB_CRAWLER_CATEGORIES) {
        const decision = record[category];
        if (decision === "allow" || decision === "disallow") {
            out[category] = decision;
        }
    }
    return out;
}
function isCrawlerPolicy(value) {
    return (value === "discoverable-no-training" ||
        value === "allow-all" ||
        value === "disallow-all");
}
function agentNativeConfigFromPackageJson(pkg) {
    if (!pkg || typeof pkg !== "object" || Array.isArray(pkg))
        return undefined;
    const record = pkg;
    const config = record["agent-native"] ?? record.agentNative;
    const nested = config && typeof config === "object" && !Array.isArray(config)
        ? config
        : {};
    const workspaceApp = nested.workspaceApp &&
        typeof nested.workspaceApp === "object" &&
        !Array.isArray(nested.workspaceApp)
        ? nested.workspaceApp
        : undefined;
    const workspace = nested.workspace &&
        typeof nested.workspace === "object" &&
        !Array.isArray(nested.workspace)
        ? nested.workspace
        : undefined;
    return {
        root: record,
        workspaceApp,
        workspace,
        agentWeb: nested.agentWeb,
    };
}
//# sourceMappingURL=config.js.map