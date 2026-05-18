/**
 * Wraps `runAgentLoop` with two layered recovery mechanisms so a single hosted
 * invocation can survive interruptions without showing the user a dead chat:
 *
 * 1. **Soft timeout** — an inner timer that aborts the LLM call before the
 *    hosting function's hard limit (Lambda 75s, Vercel 60s, etc.) so we have a
 *    chance to gracefully wind down and append a continuation nudge. Without
 *    this the function gets killed mid-stream and the user sees a frozen
 *    spinner.
 *
 * 2. **Resumable-error continuation** — when the LLM call errors with a
 *    transport- or gateway-level interruption (Builder gateway 45s timeout,
 *    socket hang up, ECONNRESET, upstream 5xx that survived engine retries),
 *    we save the conversation prefix, append a "continue from where you left
 *    off" message, and run another LLM call. Anthropic's prompt cache makes
 *    the resume call dramatically faster than the cold first attempt, and the
 *    agent gets explicit context that it was cut off so it doesn't re-do
 *    completed work.
 *
 * Both paths route through `appendAgentLoopContinuation` so the agent sees a
 * uniform "continue" instruction regardless of which recovery fired.
 */
import { runAgentLoop } from "./production-agent.js";
/**
 * Cap on continuation iterations inside a single
 * `runAgentLoopDirectWithSoftTimeout` invocation. The host's hard function
 * timeout usually bounds this naturally — but a defensive cap prevents an
 * instant-error spiral from looping forever inside hosting environments with a
 * generous budget.
 *
 * 6 leaves room for: 1 normal completion + a few resume rounds for design
 * generation (prompt + 3 variants ≈ 4 LLM calls), with a small safety margin.
 */
export declare const MAX_RUN_LOOP_CONTINUATIONS = 6;
/**
 * Internal entry point used by the agent-chat plugin's run handler. Wraps
 * `runAgentLoop` with soft-timeout + resumable-error continuation recovery.
 *
 * The `softTimeoutMs` argument falls back to `resolveRunSoftTimeoutMs(...)` so
 * different hosting environments (Lambda, Vercel, Cloudflare, local dev) get
 * an appropriate inner budget. Setting it to <= 0 disables both layers — the
 * call goes straight to `runAgentLoop` with no wrapping.
 */
export declare function runAgentLoopDirectWithSoftTimeout(opts: Parameters<typeof runAgentLoop>[0], softTimeoutMs?: number): Promise<Awaited<ReturnType<typeof runAgentLoop>>>;
//# sourceMappingURL=run-loop-with-resume.d.ts.map