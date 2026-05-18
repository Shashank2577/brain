export const WORKSPACE_APP_AUDIENCES = ["internal", "public"];
export const DEFAULT_WORKSPACE_APP_AUDIENCE = "internal";
export function normalizeWorkspaceAppAudience(value) {
    return value === "public" ? "public" : DEFAULT_WORKSPACE_APP_AUDIENCE;
}
export function normalizeWorkspaceAppPathList(value) {
    let rawPaths = [];
    if (Array.isArray(value)) {
        rawPaths = value;
    }
    else if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed)
            return [];
        try {
            const parsed = JSON.parse(trimmed);
            // When JSON parses to a non-array (e.g. a single quoted string
            // `"/api"`), use the parsed value, not the original quoted form —
            // otherwise the `/`-prefix filter below silently drops it.
            rawPaths = Array.isArray(parsed) ? parsed : [parsed];
        }
        catch {
            rawPaths = trimmed.split(",");
        }
    }
    const paths = rawPaths
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => entry.startsWith("/"))
        .map((entry) => entry.length > 1 && entry.endsWith("/") ? entry.slice(0, -1) : entry);
    return Array.from(new Set(paths));
}
export function workspaceAppAudienceFromEnv(env) {
    const source = env ?? (typeof process !== "undefined" ? process.env : {});
    const raw = source.AGENT_NATIVE_WORKSPACE_APP_AUDIENCE ??
        source.VITE_AGENT_NATIVE_WORKSPACE_APP_AUDIENCE;
    if (raw === undefined)
        return undefined;
    return normalizeWorkspaceAppAudience(raw);
}
export function workspaceAppRouteAccessFromEnv(env) {
    const source = env ?? (typeof process !== "undefined" ? process.env : {});
    return {
        publicPaths: normalizeWorkspaceAppPathList(source.AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS ??
            source.VITE_AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS),
        protectedPaths: normalizeWorkspaceAppPathList(source.AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS ??
            source.VITE_AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS),
    };
}
export function workspaceAppAudienceFromPackageJson(pkg) {
    const config = workspaceAppConfigFromPackageJson(pkg);
    const raw = config?.workspaceApp?.audience ??
        config?.workspace?.audience ??
        config?.audience ??
        config?.root?.workspaceAppAudience;
    if (raw === undefined)
        return undefined;
    return normalizeWorkspaceAppAudience(raw);
}
export function workspaceAppRouteAccessFromPackageJson(pkg) {
    const config = workspaceAppConfigFromPackageJson(pkg);
    const rawPublic = config?.workspaceApp?.publicPaths ??
        config?.workspaceApp?.publicPagePaths ??
        config?.workspace?.publicPaths ??
        config?.publicPaths ??
        config?.root?.workspaceAppPublicPaths;
    const rawProtected = config?.workspaceApp?.protectedPaths ??
        config?.workspaceApp?.privatePaths ??
        config?.workspaceApp?.authRequiredPaths ??
        config?.workspace?.protectedPaths ??
        config?.protectedPaths ??
        config?.root?.workspaceAppProtectedPaths;
    return {
        ...(isPathConfigValueSet(rawPublic)
            ? { publicPaths: normalizeWorkspaceAppPathList(rawPublic) }
            : {}),
        ...(isPathConfigValueSet(rawProtected)
            ? { protectedPaths: normalizeWorkspaceAppPathList(rawProtected) }
            : {}),
    };
}
/**
 * Only treat a package.json field as "explicitly set" when its raw value is a
 * supported type — an array, a string, or explicit null. Garbage types like
 * `false`, `0`, or `{}` are ignored (left as undefined) so a typo such as
 * `"publicPaths": false` doesn't silently clear an inherited manifest
 * override. (`normalizeWorkspaceAppPathList` happily turns those into `[]`,
 * which without this guard would be indistinguishable from a deliberate
 * empty array.)
 */
function isPathConfigValueSet(value) {
    if (value === undefined)
        return false;
    if (value === null)
        return true;
    if (Array.isArray(value))
        return true;
    return typeof value === "string";
}
function workspaceAppConfigFromPackageJson(pkg) {
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
        audience: nested.audience,
        publicPaths: nested.publicPaths,
        protectedPaths: nested.protectedPaths,
    };
}
//# sourceMappingURL=workspace-app-audience.js.map