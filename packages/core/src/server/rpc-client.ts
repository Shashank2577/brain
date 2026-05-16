/**
 * Typed HTTP client for the dispatch RPC broker (Item A3).
 *
 * Workers that need to invoke a capability owned by a different mini-app POST
 * to `${dispatchUrl}/_agent-native/rpc/dispatch` with:
 *
 *   headers: { "x-fluid-identity": signIdentity({ userEmail, orgId }, secret) }
 *   body:    { fqid, input }
 *
 * Dispatch verifies the header, runs the capability under the carried
 * identity, and returns `{ ok: true, output }` or
 * `{ ok: false, error: { code, message, fqid? } }`.
 *
 * The header is signed HERE (in core), using `BETTER_AUTH_SECRET`, by
 * `ctx.call()` — see `./ctx.ts`. This client is intentionally narrow and
 * does not sign anything itself; the caller passes a fully formed header
 * string.
 *
 * Identity rule (CLAUDE.md, load-bearing): the propagated identity is the
 * END USER's, never the calling app's. There is no "caller app id" on the
 * wire — the broker has no field for it.
 */

const DEFAULT_TIMEOUT_MS = 5_000;
const BROKER_PATH = "/_agent-native/rpc/dispatch";

export interface CallViaDispatchOpts {
  /** Pre-signed identity header value (the full `h.p.s` string). */
  identityHeader: string;
  /** Origin of the dispatch server, e.g. `http://localhost:3001`. */
  dispatchUrl: string;
  /** Override the HTTP fetcher (tests). */
  fetchImpl?: typeof fetch;
  /** Override the 5s default request timeout. */
  timeoutMs?: number;
  /** Optional AbortSignal to chain into the request. */
  signal?: AbortSignal;
}

export interface RpcErrorEnvelope {
  code: string;
  message: string;
  fqid?: string;
}

/** Structured error thrown by `callViaDispatch` for any non-OK envelope. */
export class RpcError extends Error {
  readonly code: string;
  readonly fqid: string;
  readonly httpStatus: number;
  constructor(envelope: RpcErrorEnvelope, fqid: string, httpStatus: number) {
    super(envelope.message);
    this.name = "RpcError";
    this.code = envelope.code;
    this.fqid = envelope.fqid ?? fqid;
    this.httpStatus = httpStatus;
  }
}

/**
 * Invoke a capability on the dispatch broker. Returns the capability's
 * `output` on success; throws `RpcError` on any structured failure.
 */
export async function callViaDispatch<T = unknown>(
  fqid: string,
  input: unknown,
  opts: CallViaDispatchOpts,
): Promise<T> {
  if (!fqid || typeof fqid !== "string") {
    throw new RpcError(
      { code: "bad_request", message: "fqid is required" },
      fqid,
      400,
    );
  }
  if (!opts.dispatchUrl) {
    throw new RpcError(
      { code: "no_dispatch_url", message: "dispatchUrl is not configured" },
      fqid,
      500,
    );
  }
  if (!opts.identityHeader) {
    throw new RpcError(
      { code: "no_identity", message: "identityHeader is required" },
      fqid,
      401,
    );
  }

  const fetcher = opts.fetchImpl ?? fetch;
  const url = `${opts.dispatchUrl.replace(/\/+$/, "")}${BROKER_PATH}`;
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (opts.signal) {
    opts.signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  let response: Response;
  try {
    response = await fetcher(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-fluid-identity": opts.identityHeader,
      },
      body: JSON.stringify({ fqid, input }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === "AbortError") {
      throw new RpcError(
        { code: "timeout", message: `RPC timed out after ${timeoutMs}ms` },
        fqid,
        504,
      );
    }
    throw new RpcError(
      {
        code: "network_error",
        message: `RPC to ${url} failed: ${(err as Error).message}`,
      },
      fqid,
      502,
    );
  }
  clearTimeout(timer);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new RpcError(
      {
        code: "invalid_response",
        message: `Non-JSON response from broker (status ${response.status})`,
      },
      fqid,
      response.status,
    );
  }
  const envelope = body as
    | { ok: true; output: T }
    | { ok: false; error: RpcErrorEnvelope };
  if (!envelope || typeof envelope !== "object" || !("ok" in envelope)) {
    throw new RpcError(
      { code: "invalid_response", message: "Missing ok flag" },
      fqid,
      response.status,
    );
  }
  if (envelope.ok === false) {
    throw new RpcError(envelope.error, fqid, response.status);
  }
  return envelope.output;
}
