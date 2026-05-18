/**
 * Dev-only session bootstrap for `pnpm action <name>` (and any other CLI
 * caller of `runScript`).
 *
 * After changes-53, db-exec / db-query / db-patch refuse to run unless
 * `getRequestUserEmail()` returns a real identity. In an HTTP request the
 * Nitro plugin wraps the handler in `runWithRequestContext({ userEmail })`
 * so scoping just works. CLI invocations have no such wrapper, so without
 * this helper every db-* CLI run hands the user a stack trace.
 *
 * What this does: when the runner is about to dispatch, resolve a real
 * email by reading the most-recent row from the legacy `sessions` table
 * (the same table that `addSession()` writes from google-oauth.ts and the
 * A2A receiver fallback already consults). The runner then wraps dispatch
 * in `runWithRequestContext({ userEmail })` so the action sees a real
 * identity.
 *
 * SHARED-DEV-BOX CAVEAT: the `SELECT email FROM sessions ORDER BY
 * created_at DESC LIMIT 1` query is unscoped — on a machine where
 * multiple developers have signed in (or after a `pnpm action …` run
 * from another team's app), this will bind to whoever signed in most
 * recently across *all* sessions in the DB. If that is wrong, set
 * `AGENT_USER_EMAIL=<your-email>` in your shell or `.env`; explicit env
 * always wins. A `[dev-session]` log line is emitted so wrong-binding
 * is easy to spot.
 *
 * Strict gating mirrors the A2A precedent in
 * `server/agent-chat-plugin.ts` (search for "latest session"):
 *   - NODE_ENV !== "production".
 *   - AUTH_MODE unset or === "local" — don't auto-impersonate when an
 *     admin or hosted auth mode is in use.
 *
 * If `process.env.AGENT_USER_EMAIL` is already set we return it unchanged
 * — explicit env wins over any DB-derived guess (matches how
 * `getRequestUserEmail()` itself behaves).
 */
/**
 * Resolve the local dev user's email for the current CLI invocation.
 *
 * Returns the resolved email, or `undefined` when no real identity is
 * available. Callers should let the downstream "no authenticated user"
 * error propagate — its message points the user at the two fixes
 * (sign in via the running app, or set `AGENT_USER_EMAIL`).
 */
export declare function resolveDevUserEmail(): Promise<string | undefined>;
//# sourceMappingURL=dev-session.d.ts.map