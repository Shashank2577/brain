import { parseMcpToolName } from "../mcp-client/manager.js";
import { isMcpToolAllowedForRequest } from "../mcp-client/visibility.js";
export const TOOL_SEARCH_ACTION_NAME = "tool-search";
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 25;
export function createToolSearchEntry(getRegistry, options = {}) {
    return {
        tool: {
            description: "Search the live registry of callable tools/actions, including connected MCP server tools named `mcp__<server>__<tool>`. Use this when you need a capability but are not sure which tool to call, especially after users connect new MCP servers. Returns exact tool names and parameter summaries so you can call the matching tool directly.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "What capability to find, e.g. `send slack message`, `create calendar event`, `zapier gmail`, or `browser screenshot`.",
                    },
                    limit: {
                        type: "number",
                        description: `Maximum results to return. Defaults to ${options.defaultLimit ?? DEFAULT_LIMIT}.`,
                    },
                    includeSchemas: {
                        type: "boolean",
                        description: "When true, include each matching tool's full input schema. Default false.",
                    },
                },
                required: ["query"],
            },
        },
        http: false,
        readOnly: true,
        run: async (args) => searchToolRegistry(getRegistry(), args, options),
    };
}
export function attachToolSearch(registry, options = {}) {
    registry[TOOL_SEARCH_ACTION_NAME] = createToolSearchEntry(() => registry, options);
    return registry;
}
export function searchToolRegistry(registry, args = {}, options = {}) {
    const query = String(args.query ?? "").trim();
    const includeSchemas = parseBoolean(args.includeSchemas);
    const limit = parseLimit(args.limit, options.defaultLimit ?? DEFAULT_LIMIT, options.maxLimit ?? MAX_LIMIT);
    const queryTokens = tokenize(query);
    const candidates = [];
    let totalTools = 0;
    for (const [name, entry] of Object.entries(registry)) {
        if (!entry?.tool || name === TOOL_SEARCH_ACTION_NAME)
            continue;
        if (name.startsWith("mcp__") && !isMcpToolAllowedForRequest(name)) {
            continue;
        }
        totalTools++;
        const description = normalizeWhitespace(entry.tool.description ?? "");
        const parameters = summarizeParameters(entry.tool.parameters);
        const parsedMcp = parseMcpToolName(name);
        const kind = parsedMcp ? "mcp" : "action";
        const source = parsedMcp?.serverId;
        const score = scoreTool({
            query,
            queryTokens,
            name,
            source,
            description,
            parameters,
            kind,
        });
        if (queryTokens.length > 0 && score <= 0)
            continue;
        candidates.push({
            name,
            kind,
            ...(source ? { source } : {}),
            description,
            score,
            parameters,
            ...(includeSchemas ? { inputSchema: entry.tool.parameters ?? {} } : {}),
        });
    }
    candidates.sort((a, b) => {
        if (b.score !== a.score)
            return b.score - a.score;
        return a.name.localeCompare(b.name);
    });
    return {
        query,
        totalTools,
        count: Math.min(candidates.length, limit),
        results: candidates.slice(0, limit),
    };
}
function parseLimit(value, fallback, max) {
    const n = typeof value === "number"
        ? value
        : typeof value === "string" && value.trim()
            ? Number(value)
            : fallback;
    if (!Number.isFinite(n) || n <= 0)
        return fallback;
    return Math.max(1, Math.min(max, Math.floor(n)));
}
function parseBoolean(value) {
    if (typeof value === "boolean")
        return value;
    if (typeof value !== "string")
        return false;
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
}
function summarizeParameters(schema) {
    if (!schema || typeof schema !== "object")
        return [];
    const obj = schema;
    const properties = obj.properties;
    if (!properties || typeof properties !== "object")
        return [];
    const required = new Set(Array.isArray(obj.required)
        ? obj.required.filter((value) => typeof value === "string")
        : []);
    return Object.entries(properties).map(([name, raw]) => {
        const prop = raw && typeof raw === "object" ? raw : {};
        const enumValues = Array.isArray(prop.enum)
            ? prop.enum.map((value) => String(value)).slice(0, 20)
            : undefined;
        return {
            name,
            type: summarizeType(prop.type),
            required: required.has(name),
            description: typeof prop.description === "string"
                ? normalizeWhitespace(prop.description)
                : undefined,
            ...(enumValues && enumValues.length > 0 ? { enum: enumValues } : {}),
        };
    });
}
function summarizeType(value) {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value)) {
        const parts = value.filter((v) => typeof v === "string");
        return parts.length > 0 ? parts.join(" | ") : undefined;
    }
    return undefined;
}
function scoreTool(input) {
    if (input.queryTokens.length === 0)
        return 1;
    const name = searchableText(input.name);
    const source = searchableText(input.source ?? "");
    const description = searchableText(input.description);
    const params = searchableText(input.parameters
        .map((p) => `${p.name} ${p.type ?? ""} ${p.description ?? ""}`)
        .join(" "));
    const all = `${name} ${source} ${description} ${params} ${input.kind}`;
    const phrase = searchableText(input.query);
    let score = 0;
    if (name.includes(phrase))
        score += 14;
    if (source && source.includes(phrase))
        score += 10;
    if (description.includes(phrase))
        score += 8;
    if (params.includes(phrase))
        score += 5;
    for (const token of input.queryTokens) {
        if (name.split(" ").includes(token))
            score += 9;
        else if (name.includes(token))
            score += 6;
        if (source) {
            if (source.split(" ").includes(token))
                score += 6;
            else if (source.includes(token))
                score += 3;
        }
        if (description.includes(token))
            score += 3;
        if (params.includes(token))
            score += 2;
        if (all.includes(token))
            score += 1;
    }
    return score;
}
function tokenize(value) {
    const seen = new Set();
    for (const token of searchableText(value).split(" ")) {
        if (token.length > 0)
            seen.add(token);
    }
    return Array.from(seen);
}
function searchableText(value) {
    return value
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}
function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
}
//# sourceMappingURL=tool-search.js.map