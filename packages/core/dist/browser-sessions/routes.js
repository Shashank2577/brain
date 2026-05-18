import { defineEventHandler, getMethod, setResponseHeader, setResponseStatus, } from "h3";
import { getH3App } from "../server/framework-request-handler.js";
import { readBody } from "../server/h3-helpers.js";
import { getSession } from "../server/auth.js";
import { claimBrowserSessionRequest, completeBrowserSessionRequest, createBrowserSessionRequest, disconnectBrowserSession, getBrowserSession, getBrowserSessionRequest, listBrowserSessions, registerBrowserSession, waitForBrowserSessionRequest, } from "./store.js";
function decodeSegment(value) {
    if (!value)
        return undefined;
    try {
        return decodeURIComponent(value);
    }
    catch {
        return value;
    }
}
async function defaultOwnerFromEvent(event) {
    const session = await getSession(event);
    if (!session?.email) {
        throw Object.assign(new Error("Authentication required"), {
            statusCode: 401,
        });
    }
    return session.email;
}
async function ownerFromEvent(event, options) {
    return options.getOwnerFromEvent
        ? options.getOwnerFromEvent(event)
        : defaultOwnerFromEvent(event);
}
function methodNotAllowed(event) {
    setResponseStatus(event, 405);
    return { error: "Method not allowed" };
}
function badRequest(event, error) {
    setResponseStatus(event, 400);
    return { error };
}
function notFound(event, error) {
    setResponseStatus(event, 404);
    return { error };
}
function errorResponse(event, error) {
    const statusCode = typeof error?.statusCode === "number"
        ? error.statusCode
        : 500;
    setResponseStatus(event, statusCode);
    return {
        error: error instanceof Error ? error.message : String(error),
    };
}
async function readJsonBody(event) {
    return ((await readBody(event).catch(() => ({}))) || {});
}
export function mountBrowserSessionRoutes(nitroApp, options = {}) {
    const routePrefix = options.routePrefix ?? "/_agent-native";
    const basePath = `${routePrefix}/browser-sessions`;
    getH3App(nitroApp).use(basePath, defineEventHandler(async (event) => {
        setResponseHeader(event, "Cache-Control", "no-store");
        const method = getMethod(event);
        const raw = (event.path || "/").split("?")[0];
        const segments = raw
            .replace(/^\/+/, "")
            .split("/")
            .filter(Boolean)
            .map(decodeSegment);
        try {
            const ownerEmail = await ownerFromEvent(event, options);
            if (segments.length === 0) {
                if (method === "GET") {
                    const sessions = await listBrowserSessions(ownerEmail);
                    return { ok: true, sessions };
                }
                if (method === "POST") {
                    const body = await readJsonBody(event);
                    const session = await registerBrowserSession(ownerEmail, body);
                    return { ok: true, session };
                }
                return methodNotAllowed(event);
            }
            const sessionId = segments[0];
            if (!sessionId)
                return badRequest(event, "sessionId is required");
            if (segments.length === 1) {
                if (method === "GET") {
                    const session = await getBrowserSession(ownerEmail, sessionId, {
                        includeExpired: true,
                    });
                    return session
                        ? { ok: true, session }
                        : notFound(event, "Session not found");
                }
                if (method === "DELETE") {
                    const deleted = await disconnectBrowserSession(ownerEmail, sessionId);
                    return { ok: true, deleted };
                }
                return methodNotAllowed(event);
            }
            if (segments[1] === "heartbeat") {
                if (method !== "POST")
                    return methodNotAllowed(event);
                const body = await readJsonBody(event);
                const session = await registerBrowserSession(ownerEmail, {
                    ...body,
                    session: {
                        ...(body.session ?? {}),
                        id: sessionId,
                    },
                    sessionId,
                });
                return { ok: true, session };
            }
            if (segments[1] !== "requests") {
                return notFound(event, "Unknown browser-session route");
            }
            if (segments.length === 2) {
                if (method !== "POST")
                    return methodNotAllowed(event);
                const body = await readJsonBody(event);
                const request = await createBrowserSessionRequest(ownerEmail, sessionId, body);
                if (body.wait === true) {
                    const result = await waitForBrowserSessionRequest(ownerEmail, request.id, { timeoutMs: body.timeoutMs });
                    return { ok: true, requestId: request.id, result };
                }
                return { ok: true, request };
            }
            if (segments.length === 3 && segments[2] === "claim") {
                if (method !== "POST")
                    return methodNotAllowed(event);
                const request = await claimBrowserSessionRequest(ownerEmail, sessionId);
                return { ok: true, request };
            }
            const requestId = segments[2];
            if (!requestId)
                return badRequest(event, "requestId is required");
            if (segments.length === 3) {
                if (method !== "GET")
                    return methodNotAllowed(event);
                const request = await getBrowserSessionRequest(ownerEmail, requestId);
                return request
                    ? { ok: true, request }
                    : notFound(event, "Request not found");
            }
            if (segments.length === 4 && segments[3] === "complete") {
                if (method !== "POST")
                    return methodNotAllowed(event);
                const body = await readJsonBody(event);
                const request = await completeBrowserSessionRequest(ownerEmail, sessionId, requestId, body.ok === false
                    ? { ok: false, error: body.error, result: body.result }
                    : { ok: true, result: body.result });
                return { ok: true, request };
            }
            return notFound(event, "Unknown browser-session route");
        }
        catch (error) {
            return errorResponse(event, error);
        }
    }));
}
//# sourceMappingURL=routes.js.map