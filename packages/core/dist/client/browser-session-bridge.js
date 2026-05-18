import { agentNativePath } from "./api-path.js";
import { announceAgentNativeFrameReady, defaultAgentNativeHostCommands, requestAgentNativeHostActions, requestAgentNativeHostContext, runAgentNativeHostAction, sendAgentNativeHostCommand, } from "./host-bridge.js";
const DEFAULT_ENDPOINT = "/_agent-native/browser-sessions";
const DEFAULT_HEARTBEAT_MS = 5_000;
const DEFAULT_POLL_MS = 500;
function browserSessionId() {
    return `browser-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function messageError(error) {
    return error instanceof Error ? error : new Error(String(error));
}
function endpointBase(options) {
    return options.endpoint ?? agentNativePath(DEFAULT_ENDPOINT);
}
function endpointPath(options, path = "") {
    const base = endpointBase(options).replace(/\/+$/, "");
    return `${base}${path}`;
}
function encodePathSegment(value) {
    return encodeURIComponent(value);
}
function fetchImpl(options) {
    const fn = options.fetch ?? (typeof fetch !== "undefined" ? fetch : undefined);
    if (!fn)
        throw new Error("fetch is not available");
    return fn;
}
async function readJsonResponse(response) {
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok === false) {
        throw new Error(typeof body?.error === "string"
            ? body.error
            : `Browser-session request failed (${response.status})`);
    }
    return body;
}
async function postJson(options, path, body) {
    const response = await fetchImpl(options)(endpointPath(options, path), {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-Agent-Native-CSRF": "1",
        },
        body: JSON.stringify(body ?? {}),
    });
    return readJsonResponse(response);
}
async function deleteJson(options, path) {
    const response = await fetchImpl(options)(endpointPath(options, path), {
        method: "DELETE",
        credentials: "include",
        headers: {
            "X-Agent-Native-CSRF": "1",
        },
    });
    await readJsonResponse(response);
}
function hostRequestOptions(options) {
    const { endpoint: _endpoint, sessionId: _sessionId, session: _session, getContext: _getContext, actions: _actions, commands: _commands, origin: _origin, label: _label, heartbeatMs: _heartbeatMs, pollMs: _pollMs, ttlMs: _ttlMs, fetch: _fetch, ...hostOptions } = options;
    return hostOptions;
}
function hasDirectHost(options) {
    return Boolean(options.getContext ||
        options.actions ||
        options.commands ||
        options.session);
}
function directOrigin(options) {
    return options.origin || "agent-native-embedded";
}
function directSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function createDirectHostSession(session, fallbackId, contextUrl) {
    const now = new Date().toISOString();
    const base = typeof session === "string"
        ? { id: session }
        : session && typeof session === "object"
            ? session
            : {};
    return {
        id: base.id || fallbackId || directSessionId(),
        connectedAt: base.connectedAt || now,
        url: base.url ||
            contextUrl ||
            (typeof window !== "undefined" ? window.location.href : undefined),
        ...base,
    };
}
function serializeForBrowserSession(value, label) {
    if (value === undefined)
        return value;
    try {
        return JSON.parse(JSON.stringify(value));
    }
    catch {
        throw new Error(`${label} must be JSON-serializable`);
    }
}
async function resolveDirectContext(options) {
    const raw = options.getContext ? await options.getContext() : {};
    const context = serializeForBrowserSession(raw ?? {}, "Browser-session context");
    const session = createDirectHostSession(options.session, options.sessionId, context.url);
    return {
        ...context,
        session: {
            ...session,
            ...(context.session ?? {}),
        },
    };
}
async function resolveClientActions(actions) {
    const value = typeof actions === "function" ? await actions() : actions;
    return Array.isArray(value) ? value : [];
}
function toActionManifest(action) {
    if (!action?.name || !action.description)
        return null;
    const { run: _run, ...manifest } = action;
    return serializeForBrowserSession({
        source: "client",
        availability: "browser-session",
        ...manifest,
        schema: manifest.schema ?? manifest.parameters,
    }, "Client action manifest");
}
async function resolveDirectActionManifest(options) {
    const actions = await resolveClientActions(options.actions);
    return actions
        .map(toActionManifest)
        .filter(Boolean);
}
async function findDirectAction(options, name) {
    const actions = await resolveClientActions(options.actions);
    return actions.find((action) => action.name === name);
}
async function runDirectCommand(command, payload, requestId, options) {
    const handlers = {
        ...defaultAgentNativeHostCommands,
        ...(options.commands ?? {}),
    };
    const handler = handlers[command];
    if (!handler) {
        throw new Error(`Host command "${command}" is not available`);
    }
    return handler({
        command,
        payload,
        requestId,
        origin: directOrigin(options),
    }, undefined);
}
async function executeDirectBrowserSessionRequest(request, options) {
    if (request.type === "get-context") {
        return resolveDirectContext(options);
    }
    if (request.type === "list-actions") {
        return resolveDirectActionManifest(options);
    }
    if (request.type === "run-action") {
        if (!request.name) {
            throw new Error("Browser-session action request is missing name");
        }
        const action = await findDirectAction(options, request.name);
        if (!action) {
            throw new Error(`Client action "${request.name}" is not available`);
        }
        const context = await resolveDirectContext(options);
        const session = context.session ??
            createDirectHostSession(options.session, options.sessionId, context.url);
        return action.run(request.args, {
            requestId: request.id,
            origin: directOrigin(options),
            context,
            session,
            event: undefined,
            refresh: (payload) => runDirectCommand("refreshData", payload, request.id, options),
            command: (command, payload) => runDirectCommand(command, payload, request.id, options),
        });
    }
    if (request.type === "command") {
        return runDirectCommand(request.command || "refreshData", request.payload, request.id, options);
    }
    throw new Error(`Unknown browser-session request type: ${request.type}`);
}
function normalizeSession(sessionId, label, hostSession, contextUrl) {
    return {
        ...(hostSession ?? {}),
        id: sessionId,
        ...(label
            ? { label }
            : hostSession?.label
                ? { label: hostSession.label }
                : {}),
        connectedAt: hostSession?.connectedAt ?? new Date().toISOString(),
        ...(contextUrl || hostSession?.url
            ? { url: contextUrl ?? hostSession?.url }
            : {}),
    };
}
async function executeBrowserSessionRequest(request, options) {
    if (hasDirectHost(options)) {
        return executeDirectBrowserSessionRequest(request, options);
    }
    const hostOptions = hostRequestOptions(options);
    if (request.type === "get-context") {
        return requestAgentNativeHostContext(hostOptions);
    }
    if (request.type === "list-actions") {
        return requestAgentNativeHostActions(hostOptions);
    }
    if (request.type === "run-action") {
        if (!request.name)
            throw new Error("Browser-session action request is missing name");
        return runAgentNativeHostAction(request.name, request.args, hostOptions);
    }
    if (request.type === "command") {
        return sendAgentNativeHostCommand(request.command || "refreshData", request.payload, hostOptions);
    }
    throw new Error(`Unknown browser-session request type: ${request.type}`);
}
export function createAgentNativeBrowserSessionBridge(options = {}) {
    let currentSessionId = options.sessionId ?? null;
    let fallbackSessionId = null;
    let started = false;
    let heartbeatTimer;
    let pollTimer;
    let refreshing = false;
    let polling = false;
    async function refreshRegistration() {
        const direct = hasDirectHost(options);
        const hostOptions = hostRequestOptions(options);
        const [context, actions] = direct
            ? await Promise.all([
                resolveDirectContext(options),
                resolveDirectActionManifest(options).catch(() => []),
            ])
            : await Promise.all([
                requestAgentNativeHostContext(hostOptions),
                requestAgentNativeHostActions(hostOptions).catch(() => []),
            ]);
        const hostSession = context.session;
        if (!currentSessionId) {
            currentSessionId =
                hostSession?.id || fallbackSessionId || browserSessionId();
            fallbackSessionId = currentSessionId;
        }
        const session = normalizeSession(currentSessionId, options.label, hostSession, context.url);
        const body = await postJson(options, "", {
            session,
            sessionId: currentSessionId,
            context,
            actions,
            ttlMs: options.ttlMs,
        });
        return body.session;
    }
    async function heartbeat() {
        if (refreshing)
            return;
        refreshing = true;
        try {
            await refreshRegistration();
        }
        finally {
            refreshing = false;
        }
    }
    async function claimOnce() {
        if (!currentSessionId) {
            await refreshRegistration();
        }
        if (!currentSessionId)
            return null;
        const claim = await postJson(options, `/${encodePathSegment(currentSessionId)}/requests/claim`, {});
        const request = claim.request;
        if (!request)
            return null;
        try {
            const result = await executeBrowserSessionRequest(request, options);
            await postJson(options, `/${encodePathSegment(currentSessionId)}/requests/${encodePathSegment(request.id)}/complete`, { ok: true, result });
        }
        catch (error) {
            await postJson(options, `/${encodePathSegment(currentSessionId)}/requests/${encodePathSegment(request.id)}/complete`, { ok: false, error: messageError(error).message }).catch(() => { });
        }
        return request;
    }
    async function poll() {
        if (polling)
            return;
        polling = true;
        try {
            await claimOnce();
        }
        finally {
            polling = false;
        }
    }
    const bridge = {
        get sessionId() {
            return currentSessionId;
        },
        start() {
            if (started)
                return bridge;
            started = true;
            if (!hasDirectHost(options)) {
                announceAgentNativeFrameReady(hostRequestOptions(options));
            }
            void heartbeat();
            void poll();
            heartbeatTimer = setInterval(() => void heartbeat(), options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS);
            pollTimer = setInterval(() => void poll(), options.pollMs ?? DEFAULT_POLL_MS);
            return bridge;
        },
        stop() {
            if (!started)
                return;
            started = false;
            if (heartbeatTimer)
                clearInterval(heartbeatTimer);
            if (pollTimer)
                clearInterval(pollTimer);
            heartbeatTimer = undefined;
            pollTimer = undefined;
            if (currentSessionId) {
                void deleteJson(options, `/${encodePathSegment(currentSessionId)}`).catch(() => { });
            }
        },
        refreshRegistration,
        claimOnce,
    };
    return bridge;
}
export function startAgentNativeBrowserSessionBridge(options = {}) {
    return createAgentNativeBrowserSessionBridge(options).start();
}
//# sourceMappingURL=browser-session-bridge.js.map