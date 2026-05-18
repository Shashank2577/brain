function normalizeBasePath(value) {
    if (!value || value === "/")
        return "";
    const trimmed = value.trim();
    if (!trimmed || trimmed === "/")
        return "";
    return `/${trimmed.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}
function normalizePathname(value) {
    if (value === "/")
        return "/";
    return value.replace(/\/+$/, "") || "/";
}
const DISPATCH_PAGE_PATHS = new Set([
    "/overview",
    "/metrics",
    "/login",
    "/signup",
    "/apps",
    "/new-app",
    "/vault",
    "/integrations",
    "/agents",
    "/workspace",
    "/tools",
    "/messaging",
    "/destinations",
    "/identities",
    "/approvals",
    "/audit",
    "/team",
]);
const DISPATCH_ROOT_ALIASES = new Map([
    ...Array.from(DISPATCH_PAGE_PATHS, (path) => [path, path]),
    ["/approval", "/approval"],
    ["/extensions", "/extensions"],
    ["/tools", "/tools"],
    ["/apps/new-app", "/new-app"],
]);
const MOUNTED_DISPATCH_ALIASES = new Map([
    ["/apps/new-app", "/new-app"],
]);
function isDispatchPagePath(pathname) {
    if (DISPATCH_PAGE_PATHS.has(pathname))
        return true;
    if (pathname === "/approval" || pathname === "/extensions")
        return true;
    if (pathname === "/tools")
        return true;
    return (/^\/extensions\/[^/]+$/.test(pathname) ||
        /^\/tools\/[^/]+$/.test(pathname) ||
        /^\/apps\/[^/]+$/.test(pathname));
}
function isDispatchAssetOrFrameworkPath(pathname) {
    return (pathname === "/__manifest" ||
        pathname.startsWith("/__manifest/") ||
        pathname === "/_agent-native" ||
        pathname.startsWith("/_agent-native/") ||
        pathname === "/.well-known" ||
        pathname.startsWith("/.well-known/") ||
        pathname.startsWith("/assets/") ||
        pathname.startsWith("/_build/") ||
        pathname.endsWith(".js") ||
        pathname.endsWith(".css") ||
        pathname.endsWith(".map") ||
        pathname.endsWith(".ico") ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".svg") ||
        pathname.endsWith(".woff2") ||
        pathname.endsWith(".woff"));
}
function dispatchNotFoundResponse() {
    return new Response("Dispatch route not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
    });
}
export function rootDispatchRedirect(pathname, search) {
    const normalizedPathname = normalizePathname(pathname);
    const basePath = normalizeBasePath(process.env.VITE_APP_BASE_PATH || process.env.APP_BASE_PATH);
    if (!basePath)
        return null;
    if (normalizedPathname === "/__manifest" ||
        normalizedPathname.startsWith("/__manifest/") ||
        normalizedPathname === "/_agent-native" ||
        normalizedPathname.startsWith("/_agent-native/")) {
        return null;
    }
    if (normalizedPathname === "/.well-known" ||
        normalizedPathname.startsWith("/.well-known/")) {
        return null;
    }
    if (normalizedPathname === "/") {
        return new Response(null, {
            status: 302,
            headers: { Location: `${basePath}/overview${search}` },
        });
    }
    if (normalizedPathname === basePath) {
        return new Response(null, {
            status: 302,
            headers: { Location: `${basePath}/overview${search}` },
        });
    }
    if (normalizedPathname.startsWith(`${basePath}/`)) {
        const dispatchPath = normalizedPathname.slice(basePath.length);
        const mountedAlias = MOUNTED_DISPATCH_ALIASES.get(dispatchPath);
        if (mountedAlias) {
            return new Response(null, {
                status: 302,
                headers: { Location: `${basePath}${mountedAlias}${search}` },
            });
        }
        if (isDispatchPagePath(dispatchPath) ||
            isDispatchAssetOrFrameworkPath(dispatchPath)) {
            return null;
        }
        return dispatchNotFoundResponse();
    }
    const rootAlias = DISPATCH_ROOT_ALIASES.get(normalizedPathname);
    if (rootAlias) {
        return new Response(null, {
            status: 302,
            headers: { Location: `${basePath}${rootAlias}${search}` },
        });
    }
    if (/^\/apps\/[^/]+$/.test(normalizedPathname)) {
        return new Response(null, {
            status: 302,
            headers: { Location: `${basePath}${normalizedPathname}${search}` },
        });
    }
    return dispatchNotFoundResponse();
}
//# sourceMappingURL=pre-auth-routing.js.map