/**
 * React Query hooks for calling actions via their auto-mounted HTTP endpoints.
 *
 * Actions are mounted at `/_agent-native/actions/:name` by the framework.
 *
 * ## End-to-end type safety
 *
 * When the action type registry is generated (via the Vite plugin or CLI),
 * `useActionQuery` and `useActionMutation` automatically infer the correct
 * return type and parameter types from the action definitions — no manual
 * type annotations needed.
 *
 * ```ts
 * // Fully typed — return type and params inferred from the action's defineAction()
 * const { data } = useActionQuery("list-forms", { status: "published" });
 * //      ^? Form[]  (inferred from the action's run() return type)
 * ```
 *
 * Without the registry, the hooks fall back to `any` types for backward
 * compatibility.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentNativePath } from "./api-path.js";
const ACTION_PREFIX = agentNativePath("/_agent-native/actions");
// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------
/**
 * Resolve the browser's IANA timezone (e.g. "America/Los_Angeles"). This is
 * sent on every action request as `x-user-timezone` so server-side defaults
 * like "today" honor the user's local day rather than the server's UTC clock.
 */
function resolveUserTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    }
    catch {
        return undefined;
    }
}
async function actionFetch(name, method, params) {
    let url = `${ACTION_PREFIX}/${name}`;
    const headers = {
        "Content-Type": "application/json",
    };
    const tz = resolveUserTimezone();
    if (tz)
        headers["x-user-timezone"] = tz;
    const init = {
        method,
        headers,
        cache: "no-store",
    };
    if (method === "GET" && params && Object.keys(params).length > 0) {
        // Skip null/undefined so optional filters don't turn into literal "null"
        // strings in the query string (e.g. `?folderId=null`).
        const entries = Object.entries(params).filter(([, v]) => v !== null && v !== undefined);
        if (entries.length > 0) {
            const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
            url += `?${qs}`;
        }
    }
    else if (method !== "GET" && params) {
        init.body = JSON.stringify(params);
    }
    let res;
    try {
        res = await fetch(url, init);
    }
    catch (err) {
        // Network failures, CORS, server unreachable, etc. — give the caller a
        // useful message instead of the opaque "Failed to fetch".
        const cause = err instanceof Error ? err.message : String(err);
        throw new Error(`Action ${name} failed: ${cause}`);
    }
    // 204 No Content — nothing to parse.
    if (res.status === 204)
        return null;
    // Read the body as text first so we can:
    //   - tolerate empty bodies (avoids "Unexpected end of JSON input")
    //   - surface non-JSON error responses (HTML 401/404 pages, plain text, etc.)
    //   - preserve the original HTTP status in the thrown error
    // Track read failures separately from "no body" — a stream interruption /
    // decode failure on a 2xx response should error rather than silently
    // succeed with `null`.
    let raw = "";
    let readFailed = false;
    let readError;
    try {
        raw = await res.text();
    }
    catch (err) {
        readFailed = true;
        readError = err;
    }
    let data = undefined;
    let parseFailed = false;
    if (raw.length > 0) {
        try {
            data = JSON.parse(raw);
        }
        catch {
            // Body wasn't JSON — keep `data` undefined and use the raw text below.
            parseFailed = true;
        }
    }
    if (!res.ok) {
        const message = (data && (data.error || data.message)) ||
            // Truncate non-JSON bodies so we don't dump entire HTML pages into the
            // console, but still give the developer a hint as to what came back.
            (raw && raw.slice(0, 200)) ||
            res.statusText ||
            `HTTP ${res.status}`;
        const error = new Error(`Action ${name} failed: ${message}`);
        error.status = res.status;
        throw error;
    }
    // 2xx but the body couldn't even be read (mid-stream abort, decode failure,
    // etc.). Don't silently treat that as a `null` success.
    if (readFailed) {
        const cause = readError instanceof Error ? readError.message : String(readError);
        const error = new Error(`Action ${name} returned ${res.status} but the body could not be read: ${cause}`);
        error.status = res.status;
        throw error;
    }
    // 2xx with a non-empty, non-JSON body. Action callers expect typed data, so
    // returning `null` here would silently mask a real server bug (e.g. a proxy
    // returning HTML 200 instead of JSON). Throw instead — empty bodies (handled
    // above by the `raw.length > 0` guard and the 204 short-circuit) still
    // correctly resolve to `null`.
    if (parseFailed) {
        const error = new Error(`Action ${name} returned a non-JSON ${res.status} response: ${raw.slice(0, 200)}`);
        error.status = res.status;
        throw error;
    }
    return (data ?? null);
}
// ---------------------------------------------------------------------------
// Query hook
// ---------------------------------------------------------------------------
/**
 * Query an action exposed as GET.
 *
 * When the action type registry is generated, the return type and parameter
 * types are inferred automatically from the action's `defineAction()` call.
 *
 * ```ts
 * // Type-safe — no manual generic needed
 * const { data } = useActionQuery("list-meals", { date: "2025-01-01" });
 *
 * // Manual override still works when needed
 * const { data } = useActionQuery<CustomType>("list-meals");
 * ```
 */
export function useActionQuery(actionName, params, options) {
    return useQuery({
        queryKey: ["action", actionName, params],
        queryFn: () => actionFetch(actionName, "GET", params),
        ...options,
    });
}
// ---------------------------------------------------------------------------
// Mutation hook
// ---------------------------------------------------------------------------
/**
 * Mutate via an action exposed as POST (default), PUT, or DELETE.
 *
 * When the action type registry is generated, the return type and parameter
 * types are inferred automatically.
 *
 * ```ts
 * // Type-safe
 * const { mutate } = useActionMutation("log-meal");
 * mutate({ name: "Salad", calories: 350 });
 * ```
 */
export function useActionMutation(actionName, options) {
    const queryClient = useQueryClient();
    const { method: methodOpt, onSuccess, ...restOptions } = options ?? {};
    const method = methodOpt ?? "POST";
    return useMutation({
        ...restOptions,
        mutationFn: (params) => actionFetch(actionName, method, params),
        onSuccess: (...args) => {
            // Invalidate related action queries
            queryClient.invalidateQueries({ queryKey: ["action"] });
            onSuccess?.(...args);
        },
    });
}
//# sourceMappingURL=use-action.js.map