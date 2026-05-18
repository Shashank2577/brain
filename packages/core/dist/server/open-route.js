import { defineEventHandler, getMethod } from "h3";
import { getSession, getConfiguredLoginHtml } from "./auth.js";
import { appStatePut, appStateGet } from "../application-state/store.js";
import { AGENT_SIDEBAR_QUERY_PARAM, withCollapsedAgentSidebarParam, } from "../shared/agent-sidebar-url.js";
/** Query keys that are route control, not navigation payload. */
const RESERVED = new Set([
    "app",
    "view",
    "to",
    "compose",
    AGENT_SIDEBAR_QUERY_PARAM,
]);
// Control-char guard (NUL..US + DEL). Defined via codepoints so the source
// file stays plain ASCII.
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001f\\u007f]");
// Compose-draft id charset. Mirrors `sanitizeDraftId` in
// templates/mail/actions/manage-draft.ts so the id we concatenate into the
// `compose-<id>` application-state key can't escape the key namespace
// (path-traversal / key injection guard).
const COMPOSE_ID = /^[a-zA-Z0-9_-]{1,64}$/;
function getRequestUrl(event) {
    return event.node?.req?.url ?? event.path ?? "/";
}
/** Decode a base64url string to UTF-8 (Node Buffer; this route is Node-only). */
function decodeBase64Url(input) {
    return Buffer.from(input, "base64url").toString("utf8");
}
/**
 * Normalize a candidate redirect path to a safe, same-origin, leading-slash
 * relative path. Rejects absolute URLs, scheme-relative `//host`, and control
 * chars (open-redirect guard). Returns `null` when unsafe.
 */
function safeRelativePath(raw) {
    if (!raw)
        return null;
    if (CONTROL_CHARS.test(raw))
        return null;
    if (!raw.startsWith("/"))
        return null;
    if (raw.startsWith("//") || raw.startsWith("/\\"))
        return null;
    if (/^\/[a-z][a-z0-9+.-]*:/i.test(raw))
        return null;
    return raw;
}
function redirect(location) {
    // Native web Response (not h3 v2's reworked sendRedirect) — matches the
    // redirect pattern used elsewhere in auth.ts.
    return new Response("", { status: 302, headers: { Location: location } });
}
function appendSearchParams(target, params) {
    if (!params.toString())
        return target;
    try {
        const url = new URL(target, "http://an.invalid");
        for (const [k, v] of params.entries())
            url.searchParams.set(k, v);
        return `${url.pathname}${url.search}${url.hash}`;
    }
    catch {
        return target;
    }
}
export function createOpenRouteHandler(options = {}) {
    return defineEventHandler(async (event) => {
        const method = getMethod(event);
        if (method !== "GET" && method !== "HEAD") {
            return new Response(JSON.stringify({ error: "Method not allowed" }), {
                status: 405,
                headers: { "Content-Type": "application/json" },
            });
        }
        const rawUrl = getRequestUrl(event);
        let search;
        try {
            search = new URL(rawUrl, "http://an.invalid").searchParams;
        }
        catch {
            search = new URLSearchParams();
        }
        const app = search.get("app") ?? undefined;
        const view = search.get("view") ?? undefined;
        const toParam = search.get("to") ?? undefined;
        const compose = search.get("compose") ?? undefined;
        // Resolve the BROWSER session. When unauthenticated, serve the same login
        // form the guard would — at this URL — so the post-login reload returns
        // here authenticated.
        const session = await getSession(event);
        if (!session?.email) {
            const html = getConfiguredLoginHtml(event);
            if (html) {
                return new Response(html, {
                    status: 200,
                    headers: { "Content-Type": "text/html; charset=utf-8" },
                });
            }
            // No auth guard configured (fully open app) — best effort: still send
            // the user to the view; nothing to scope the navigate write to.
        }
        // Build the navigation payload from every non-reserved query param
        // (record ids + filters: threadId, eventId, dashboardId, f_*, ...).
        const navParams = {};
        for (const [k, v] of search.entries()) {
            if (RESERVED.has(k))
                continue;
            navParams[k] = v;
        }
        const navPayload = { ...navParams };
        if (view)
            navPayload.view = view;
        if (session?.email) {
            try {
                await appStatePut(session.email, "navigate", navPayload, {
                    requestSource: "deep-link",
                });
                if (compose) {
                    try {
                        const draft = JSON.parse(decodeBase64Url(compose));
                        // Validate the id before using it as a key segment. An unsafe id
                        // could escape the `compose-` namespace and clobber an unrelated
                        // application-state key; skip the write (the view still opens),
                        // mirroring the malformed-payload branch below.
                        if (draft &&
                            typeof draft === "object" &&
                            typeof draft.id === "string" &&
                            COMPOSE_ID.test(draft.id)) {
                            const composeKey = `compose-${draft.id}`;
                            // A compact deep link may carry only `{ id, subject }` when the
                            // full draft was too large to inline in the URL. The complete
                            // draft is already persisted at `compose-<id>` by manage-draft
                            // on create/update. Never let the truncated stub overwrite that
                            // richer saved draft (would silently lose body / recipients /
                            // reply metadata). Only write when the payload actually carries
                            // content, or when nothing is saved yet (composer still opens).
                            const hasContent = (typeof draft.body === "string" && draft.body.length > 0) ||
                                !!draft.to ||
                                !!draft.cc ||
                                !!draft.bcc ||
                                !!draft.html ||
                                !!draft.replyToThreadId;
                            const existing = hasContent
                                ? null
                                : await appStateGet(session.email, composeKey);
                            if (hasContent || !existing) {
                                await appStatePut(session.email, composeKey, draft, {
                                    requestSource: "deep-link",
                                });
                            }
                        }
                    }
                    catch {
                        // Malformed compose payload — skip; the view still opens.
                    }
                }
            }
            catch {
                // App-state write failure shouldn't 500 the click; the redirect
                // below still lands the user on the right view.
            }
        }
        // Resolve the SPA path to redirect to.
        let target = safeRelativePath(toParam) ??
            safeRelativePath(options.resolveOpenPath?.({ app, view, params: navParams }) ??
                (view ? `/${view}` : null)) ??
            "/";
        // Forward filter params (f_*) onto the redirect so dashboards/lists open
        // pre-filtered even before the navigate command is drained.
        const filters = new URLSearchParams();
        for (const [k, v] of search.entries()) {
            if (k.startsWith("f_"))
                filters.set(k, v);
        }
        target = appendSearchParams(target, filters);
        target = withCollapsedAgentSidebarParam(target);
        return redirect(target);
    });
}
//# sourceMappingURL=open-route.js.map