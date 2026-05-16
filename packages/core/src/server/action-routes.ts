/**
 * Auto-mount actions as HTTP endpoints under /_agent-native/actions/:name.
 *
 * Actions are exposed as POST by default. Use `http: { method: "GET" }` in
 * defineAction to expose as GET. Use `http: false` to mark as agent-only.
 */
import { getH3App } from "./framework-request-handler.js";
import {
  defineEventHandler,
  setResponseStatus,
  setResponseHeader,
  getMethod,
  getQuery,
  getHeader,
} from "h3";
import type { ActionEntry } from "../agent/production-agent.js";
import { readBody } from "../server/h3-helpers.js";
import { runWithRequestContext } from "./request-context.js";
import { recordChange } from "./poll.js";
import {
  getAllowedCorsOrigin as resolveAllowedCorsOrigin,
  readCorsAllowedOrigins,
} from "./cors-origins.js";

const ROUTE_PREFIX = "/_agent-native/actions";

/**
 * Detect whether an unknown error is a Zod (or Standard Schema) validation
 * error. We can't `instanceof ZodError` here without forcing a hard `zod`
 * dependency on every consumer, so we duck-type on the standard surface:
 * `err.name === "ZodError"` plus an `issues` array. Standard Schema's
 * `~standard.validate` returns a `{ issues }` shape on failure that the
 * action wrapper already converts into an Error — this catches the case
 * where an action throws a raw ZodError or where another schema lib leaks
 * one upward.
 */
function isZodLikeError(
  err: any,
): err is { name?: string; issues: Array<Record<string, unknown>> } {
  return Boolean(
    err &&
    typeof err === "object" &&
    Array.isArray((err as { issues?: unknown }).issues) &&
    (err.name === "ZodError" ||
      err.constructor?.name === "ZodError" ||
      // Standard Schema failures don't always set .name, but they always
      // carry an `issues` array with path + message entries.
      (err.issues as any[]).every(
        (i) => i && typeof i === "object" && "message" in i,
      )),
  );
}

/**
 * Read the caller's IANA timezone from the `x-user-timezone` header. The core
 * client sends this on every action request so server-side "today" fallbacks
 * can honor the user's local day.
 */
function readTimezoneHeader(event: any): string | undefined {
  try {
    const raw = getHeader(event, "x-user-timezone");
    if (!raw || typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    return trimmed.length > 0 && trimmed.length < 64 ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

function getAllowedCorsOrigin(origin: string | undefined): string | null {
  return resolveAllowedCorsOrigin(origin, {
    allowedOrigins: readCorsAllowedOrigins(),
    allowLocalhostWhenNoAllowlist: true,
  });
}

function handleOptionsRequest(event: any): string {
  const origin = getHeader(event, "origin");
  const allowedOrigin = getAllowedCorsOrigin(
    typeof origin === "string" ? origin : undefined,
  );

  if (origin && !allowedOrigin) {
    setResponseStatus(event, 403);
    return "";
  }

  if (allowedOrigin) {
    setResponseHeader(event, "Access-Control-Allow-Origin", allowedOrigin);
    setResponseHeader(event, "Vary", "Origin");
    setResponseHeader(event, "Access-Control-Allow-Credentials", "true");
    setResponseHeader(
      event,
      "Access-Control-Allow-Methods",
      "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    setResponseHeader(
      event,
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With,X-Request-Source,X-Agent-Native-CSRF,X-Agent-Native-Tool-Bridge,X-Agent-Native-Tool-Id",
    );
  }

  setResponseStatus(event, 204);
  return "";
}

export interface MountActionRoutesOptions {
  /** Resolve owner email from the H3 event (for data scoping). */
  getOwnerFromEvent?: (event: any) => string | Promise<string>;
  /** Resolve display name from the H3 event, when available. */
  getUserNameFromEvent?: (
    event: any,
  ) => string | undefined | Promise<string | undefined>;
  /** Resolve org ID from the H3 event (for org scoping). */
  resolveOrgId?: (event: any) => string | null | Promise<string | null>;
}

/**
 * Mount discovered actions as HTTP endpoints.
 *
 * Only actions from `autoDiscoverActions` (template actions) are mounted.
 * Built-in actions (resource-*, chat-*, shell, etc.) are NOT passed here.
 */
export function mountActionRoutes(
  nitroApp: any,
  actions: Record<string, ActionEntry>,
  options?: MountActionRoutesOptions,
) {
  const mounted: string[] = [];
  // Track every action name we know about — including agent-only ones
  // (entry.http === false). The fallback handler below uses this set to
  // distinguish "action exists but is agent-only" (→ 403) from "action
  // does not exist at all" (→ 404) when an HTTP caller hits the action
  // dispatcher prefix. Without the fallback, unmatched POSTs would fall
  // through to the React Router SSR catch-all in `[...page].get.ts`,
  // which only handles GET — Nitro's renderer service then crashes with
  // `NitroViteError: No fetch handler exported from virtual:react-router/server-build`
  // because RR's request handler can't dispatch a POST to a route tree
  // that has no `action` exports. That 500 surfaced on 79 endpoints in
  // the 2026-05-16 HTTP coverage sweep (docs/qa-reports/HTTP-API-COVERAGE.md).
  const allActionNames = new Set<string>(Object.keys(actions));
  const agentOnlyActions = new Set<string>();

  for (const [name, entry] of Object.entries(actions)) {
    // Skip agent-only actions — but remember the name so the fallback
    // can return a structured 403 instead of letting the request fall
    // through to the SSR catch-all (which crashes the dev server).
    if (entry.http === false) {
      agentOnlyActions.add(name);
      continue;
    }

    const method = entry.http?.method ?? "POST";
    const path = entry.http?.path ?? name;
    const routePath = `${ROUTE_PREFIX}/${path}`;

    getH3App(nitroApp).use(
      routePath,
      defineEventHandler(async (event) => {
        try {
          const reqMethod = getMethod(event);
          const effectiveMethod =
            reqMethod === "HEAD" && method === "GET" ? "GET" : reqMethod;

          if (reqMethod === "OPTIONS") {
            return handleOptionsRequest(event);
          }

          setResponseHeader(event, "Cache-Control", "no-store");

          // Allow the declared method
          if (effectiveMethod !== method) {
            setResponseStatus(event, 405);
            return { error: `Method not allowed. Use ${method}.` };
          }

          // (audit H5) Per-action `toolCallable` opt-out for the tools-iframe
          // bridge. The bridge tags every outbound action call with
          // X-Agent-Native-Tool-Bridge: 1. When that header is present and the
          // action declares `toolCallable: false`, we 403 — used by the
          // framework's share-resource / unshare-resource /
          // set-resource-visibility for defense-in-depth on auth-adjacent
          // operations. Undefined defaults to allow: tools are intra-org and
          // typically authored by trusted teammates, so the default is to
          // trust the org-level access controls.
          // The header is set by the parent (the React host), not by the
          // iframe's user-authored content; sanitizeToolRequestOptions strips
          // iframe attempts to spoof it.
          const fromToolBridge =
            getHeader(event, "x-agent-native-tool-bridge") === "1";
          if (fromToolBridge && entry.toolCallable === false) {
            setResponseStatus(event, 403);
            return {
              error: `Action '${name}' is not callable from tools.`,
            };
          }

          // Resolve auth context for per-request scoping
          const userEmail = options?.getOwnerFromEvent
            ? await options.getOwnerFromEvent(event)
            : undefined;
          const userName = options?.getUserNameFromEvent
            ? await options.getUserNameFromEvent(event)
            : undefined;
          const orgId = options?.resolveOrgId
            ? ((await options.resolveOrgId(event)) ?? undefined)
            : undefined;
          const timezone = readTimezoneHeader(event);

          return runWithRequestContext(
            { userEmail, userName, orgId, timezone },
            async () => {
              // Parse params based on method. On web-standard runtimes (Netlify
              // Functions, CF Workers), event.req IS the web Request — use .json()
              // directly. H3's readBody fails on those runtimes because it expects
              // a Node.js stream on event.node.req.
              let params: Record<string, any>;
              try {
                if (method === "GET") {
                  // H3 v2: prefer web Request URL, fallback to getQuery
                  const webReq = (event as any).req;
                  if (webReq?.url) {
                    const url = new URL(webReq.url);
                    params = Object.fromEntries(url.searchParams);
                  } else {
                    params = getQuery(event) as Record<string, any>;
                  }
                } else {
                  const webReq = (event as any).req;
                  if (webReq && typeof webReq.json === "function") {
                    // H3 v2: event.req is the web Request — use .json() directly
                    params = (await webReq.json().catch(() => null)) ?? {};
                  } else {
                    // Fallback: H3's readBody (Node.js dev)
                    params = (await readBody(event)) ?? {};
                  }
                }
              } catch {
                params = {};
              }

              // Run the action
              try {
                const result = await entry.run(params);

                // Auto-refresh the UI after a successful mutating action. GET
                // actions and actions explicitly flagged readOnly are skipped.
                // Other tabs' useDbSync will see source:"action" and invalidate
                // their action queries. The calling tab already refetches via
                // useActionMutation's onSuccess, so this is mainly cross-tab
                // sync (and parity with the agent's tool-call path).
                // Explicit entry.readOnly (true OR false) wins over the method
                // heuristic. defineAction already auto-infers GET → readOnly=true,
                // so for actions registered through that path entry.readOnly is
                // always set and the fallback just guards legacy wrap paths.
                const isReadOnly =
                  typeof entry.readOnly === "boolean"
                    ? entry.readOnly
                    : method === "GET";
                if (!isReadOnly) {
                  try {
                    recordChange({
                      source: "action",
                      type: "change",
                      key: name,
                      owner: userEmail,
                    });
                  } catch {
                    // ignore
                  }
                }

                // If the action returned a string, try to parse as JSON for a clean response
                if (typeof result === "string") {
                  try {
                    return JSON.parse(result);
                  } catch {
                    return result;
                  }
                }

                return result;
              } catch (err: any) {
                // Classification order matters:
                //  1. Raw ZodError / Standard Schema failures → 400 with structured `issues`
                //  2. Pre-formatted "Invalid action parameters …" messages (from
                //     defineAction's wrapWithValidation) → 400 with the formatted message
                //  3. h3 createError-style errors with a numeric statusCode → use that
                //  4. Everything else → 500 JSON (never let it fall through to Nitro's
                //     HTML error renderer — that breaks fetch() callers that expect JSON)
                const msg = err?.message ?? String(err);

                if (isZodLikeError(err)) {
                  setResponseStatus(event, 400);
                  return {
                    error: "validation",
                    message: msg || "Request did not match the action schema.",
                    issues: err.issues.map((i: any) => ({
                      path: Array.isArray(i.path)
                        ? i.path.map((p: any) =>
                            p && typeof p === "object" && "key" in p
                              ? p.key
                              : p,
                          )
                        : i.path,
                      message: i.message,
                      code: i.code,
                    })),
                  };
                }

                if (
                  typeof msg === "string" &&
                  msg.startsWith("Invalid action parameters")
                ) {
                  setResponseStatus(event, 400);
                  return { error: "validation", message: msg };
                }

                const statusCode =
                  typeof err?.statusCode === "number" ? err.statusCode : 500;
                setResponseStatus(event, statusCode);
                return { error: msg };
              }
            },
          ); // end runWithRequestContext
        } catch (outerErr: any) {
          // Safety net: anything thrown before/around runWithRequestContext
          // (auth resolver crash, h3 parse failure, etc.) must still return
          // JSON. Without this catch, Nitro renders its default HTML error
          // page which breaks fetch callers and pollutes Sentry as a 500.
          const msg = outerErr?.message ?? String(outerErr);
          if (isZodLikeError(outerErr)) {
            setResponseStatus(event, 400);
            return {
              error: "validation",
              message: msg,
              issues: outerErr.issues.map((i: any) => ({
                path: Array.isArray(i.path)
                  ? i.path.map((p: any) =>
                      p && typeof p === "object" && "key" in p ? p.key : p,
                    )
                  : i.path,
                message: i.message,
                code: i.code,
              })),
            };
          }
          const statusCode =
            typeof outerErr?.statusCode === "number"
              ? outerErr.statusCode
              : 500;
          setResponseStatus(event, statusCode);
          return { error: msg };
        }
      }),
    );

    mounted.push(`${method} ${routePath}`);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Fallback handler for the `/_agent-native/actions` prefix.
  //
  // Registered AFTER every specific action handler so it only fires when
  // no specific route matched — typical cases:
  //   • The action exists but is declared `http: false` (agent-only).
  //   • The action name doesn't exist in the registry at all.
  //   • The caller used the wrong sub-path (e.g. `/actions/foo/bar`).
  //
  // Before this fallback existed, those requests fell through to the
  // React Router SSR catch-all in `server/routes/[...page].get.ts`,
  // which only handles GET. A POST to `/_agent-native/actions/navigate`
  // therefore crashed Nitro's renderer service with the misleading
  // `NitroViteError: No fetch handler exported from virtual:react-router/server-build`
  // — observed on 79 endpoints across 10 templates in
  // docs/qa-reports/HTTP-API-COVERAGE.md (2026-05-16). The fix is
  // strictly additive: known HTTP-callable actions still hit their own
  // handlers first; only unmatched calls now get a clean JSON error.
  getH3App(nitroApp).use(
    ROUTE_PREFIX,
    defineEventHandler(async (event) => {
      const reqMethod = getMethod(event);
      if (reqMethod === "OPTIONS") {
        return handleOptionsRequest(event);
      }
      setResponseHeader(event, "Cache-Control", "no-store");

      // Recover the action name from the URL. registerMiddleware strips
      // the mount prefix so `event.url.pathname` is the sub-path RELATIVE
      // to ROUTE_PREFIX (e.g. "/" or "/navigate" or "/foo/bar").
      const subPath = (event.url?.pathname ?? "/").replace(/^\/+/, "");
      const actionName = subPath.split("/")[0] || "";

      if (actionName && agentOnlyActions.has(actionName)) {
        setResponseStatus(event, 403);
        return {
          error: "agent_only",
          message: `Action '${actionName}' is agent-only (declared http: false) and cannot be called over HTTP.`,
        };
      }

      if (actionName && allActionNames.has(actionName)) {
        // Action exists and is HTTP-callable but the caller hit a sub-path
        // we don't recognize (the specific handler would have matched the
        // root). Treat as a wrong-path 404.
        setResponseStatus(event, 404);
        return {
          error: "not_found",
          message: `No action handler registered at '${event.url?.pathname ?? ""}'.`,
        };
      }

      setResponseStatus(event, 404);
      return {
        error: "unknown_action",
        message: `No action named '${actionName}' is registered on this app.`,
      };
    }),
  );

  if (mounted.length > 0 && process.env.DEBUG)
    console.log(
      `[action-routes] Mounted ${mounted.length} action route(s): ${mounted.join(", ")}`,
    );
}
