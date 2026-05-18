import type { EventHandler as H3EventHandler } from "h3";
import type { ActionTool, AgentChatAttachment, AgentChatEvent, AgentChatReference, AgentChatStructuredMessage } from "./types.js";
import type { AgentEngine, EngineTool, EngineMessage, EngineContentPart } from "./engine/types.js";
import { PROVIDER_TO_ENV } from "./engine/provider-env-vars.js";
import { subscribeToRun, getActiveRunForThread, getActiveRunForThreadAsync, getRun, abortRun } from "./run-manager.js";
import type { ActiveRun } from "./run-manager.js";
import { type ReasoningEffort } from "../shared/reasoning-effort.js";
export { PROVIDER_TO_ENV };
/**
 * Look up a user's persisted API key for the given provider. Returns
 * `undefined` for unauthenticated callers.
 *
 * Read order:
 *   1. `app_secrets` — encrypted user override, then active org/workspace.
 *   2. Legacy `user-api-key:<provider>:<email>` settings row — pre-migration
 *      data that hasn't been backfilled yet. Surfaced for compat only;
 *      writes always go to app_secrets now.
 */
export declare function getOwnerApiKey(provider: string, ownerEmail: string | null | undefined): Promise<string | undefined>;
/**
 * Derive the provider name from the active engine setting.
 * "ai-sdk:openai" → "openai", "anthropic" → "anthropic"
 */
export declare function engineToProvider(engineName: string): string;
/**
 * Resolve the active engine's provider and look up the user's API key for it.
 *
 * In shared hosted deploys we deliberately refuse the deploy-level fallback
 * for authenticated users. Without that gate any
 * signed-in user who hasn't configured their own provider key would silently
 * inherit the deployment's key (uncapped billing on the owner's account,
 * prompt logging tied to the deployment owner) — exactly the prior-incident
 * pattern we hit on 2026-04-29.
 *
 * Single-tenant (local-dev, self-hosted SQLite) keeps the env fallback.
 *
 * Callers in `agent-chat-plugin.ts`, `triggers/dispatcher.ts`,
 * `jobs/scheduler.ts`, and `integrations/plugin.ts` historically layer
 * another deployment-key fallback after this must keep the same gate.
 */
export declare function getOwnerActiveApiKey(ownerEmail: string | null | undefined): Promise<string | undefined>;
/** @deprecated Use getOwnerApiKey("anthropic", ownerEmail) instead */
export declare function getOwnerAnthropicApiKey(ownerEmail: string | null | undefined): Promise<string | undefined>;
/** Context passed to action run() for emitting intermediate events */
export interface ActionRunContext {
    /** Emit an SSE event to the client (e.g., agent_call_text for streaming) */
    send: (event: AgentChatEvent) => void;
}
export interface ActionEntry {
    tool: ActionTool;
    run: (args: Record<string, string>, context?: ActionRunContext) => Promise<any>;
    /** HTTP exposure config. `false` = agent-only. Omitted = auto-inferred from name. */
    http?: import("../action.js").ActionHttpConfig | false;
    /** If true, completion does NOT trigger a screen-refresh poll event.
     *  Set automatically by `defineAction` when `http.method === "GET"`. */
    readOnly?: boolean;
    /** If true, this action can run concurrently with other same-turn
     *  read-only/parallel-safe tool calls. Only use for actions that handle
     *  their own write ordering and idempotency. */
    parallelSafe?: boolean;
    /** Whether this action may be invoked from the tools-iframe bridge.
     *  **Default-allow opt-out**: only an explicit `false` returns 403.
     *  - `true` / `undefined` — allow.
     *  - `false` — explicit deny; the tools bridge returns 403.
     *  See `defineAction` (`packages/core/src/action.ts`) and audit H5 in
     *  `security-audit/05-tools-sandbox.md`. */
    toolCallable?: boolean;
}
/** @deprecated Use `ActionEntry` instead */
export type ScriptEntry = ActionEntry;
export type AgentExecutionMode = "act" | "plan";
export declare const PLAN_MODE_SYSTEM_PROMPT = "## Plan Mode Active\n\nYou are in Plan mode. This turn is for research, clarification, and a proposed approach only.\n\nHard rules:\n- Use only read-only tools. Do not edit files, write resources, run shell commands, mutate SQL rows, navigate the UI, send notifications, create jobs, create tools, call external agents, or change external systems.\n- If a needed detail is unclear, ask a concise clarifying question before proposing a plan.\n- When ready, present a concrete plan with the files/tools you expect to touch, the intended changes, validation steps, and notable risks.\n- Do not treat approval as implicit while Plan mode is still active. Tell the user to switch to Act mode with the mode selector or /act before implementation.";
export declare function isPlanModeToolCallAllowed(name: string, input: unknown, entry: ActionEntry): boolean;
export declare function createPlanModeActionRegistry(actions: Record<string, ActionEntry>): Record<string, ActionEntry>;
export interface ProductionAgentOptions {
    /** Action entries for the agent. Use `actions` (preferred) or `scripts` (deprecated alias). */
    actions?: Record<string, ActionEntry>;
    /** @deprecated Use `actions` instead */
    scripts?: Record<string, ActionEntry>;
    /** Static system prompt string, or async function called per-request with the H3 event */
    systemPrompt: string | ((event: any) => string | Promise<string>);
    /** Falls back to ANTHROPIC_API_KEY env var. Ignored when `engine` is provided. */
    apiKey?: string;
    /** Agent engine to use. Defaults to the "anthropic" engine. */
    engine?: AgentEngine | string | {
        name: string;
        config: Record<string, unknown>;
    };
    /** Model to use. Defaults to the resolved engine's default model. */
    model?: string;
    /** Default reasoning effort for requests that do not supply an override. */
    reasoningEffort?: ReasoningEffort;
    /** Provider-specific options passed through to the engine */
    providerOptions?: EngineMessage extends never ? never : any;
    /** Called when a run completes (for server-side thread persistence) */
    onRunComplete?: (run: ActiveRun, threadId: string | undefined) => void;
    /** Called after request validation but before a run is started. */
    onRunPrepared?: (details: {
        runId: string;
        threadId: string | undefined;
        message: string;
        attachments?: AgentChatAttachment[];
    }) => void | Promise<void>;
    /**
     * Optional per-template request normalizer. Runs after owner resolution and
     * before system/context assembly so templates can materialize uploaded chat
     * attachments or append app-specific, non-visible instructions.
     */
    prepareRequest?: (details: {
        event: any;
        ownerEmail: string | null;
        message: string;
        displayMessage?: string;
        attachments: AgentChatAttachment[];
        references: AgentChatReference[];
        threadId?: string;
        internalContinuation?: boolean;
        mode: AgentExecutionMode;
    }) => void | {
        message?: string;
        displayMessage?: string;
        attachments?: AgentChatAttachment[];
    } | Promise<void | {
        message?: string;
        displayMessage?: string;
        attachments?: AgentChatAttachment[];
    }>;
    /** Optional per-app agent run chunk budget in milliseconds. Defaults to
     *  AGENT_RUN_SOFT_TIMEOUT_MS when set, otherwise no framework-imposed
     *  timeout. When reached, the client receives an internal auto-continuation
     *  signal instead of a user-facing warning. */
    runSoftTimeoutMs?: number;
    /** Called when a run starts, with the send function for emitting events and the threadId */
    onRunStart?: (send: (event: AgentChatEvent) => void, threadId: string) => void | Promise<void>;
    /**
     * Called after the engine + model are resolved for this request. Used by
     * the plugin layer to thread the parent's choices into sub-agents so
     * delegated tasks don't default back to Anthropic + Claude.
     */
    onEngineResolved?: (engine: AgentEngine, model: string) => void;
    /** Resolve the owner email from the H3 event (for usage tracking) */
    resolveOwnerEmail?: (event: any) => string | Promise<string>;
    /**
     * Optional final-answer guard. If it returns a message after a text-only
     * assistant turn, the loop clears that draft once and asks the model to
     * continue with the returned corrective instruction before allowing a final.
     */
    finalResponseGuard?: AgentLoopFinalResponseGuard;
    /**
     * Skip auto-injecting the workspace files/skills/agents inventory on the
     * first message of a conversation. Useful for minimal/voice apps where
     * the ~2KB inventory of unrelated resources is noise, not signal.
     * Default: false (inventory is injected).
     */
    skipFilesContext?: boolean;
}
export declare function resolveAgentOwnerEmail(options: Pick<ProductionAgentOptions, "resolveOwnerEmail">, event: any): Promise<string | null>;
export declare function buildUserContentWithAttachments(opts: {
    text: string;
    attachments?: AgentChatAttachment[];
}): EngineContentPart[];
export declare function structuredHistoryToEngineMessages(history: AgentChatStructuredMessage[] | undefined): EngineMessage[] | null;
/** Accumulated token usage from an agent loop run */
export interface AgentLoopUsage {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    model: string;
}
export interface AgentLoopToolCallSummary {
    name: string;
    input: unknown;
}
export interface AgentLoopToolResultSummary {
    name: string;
    content: string;
    isError: boolean;
}
export interface AgentLoopFinalResponseGuardContext {
    messages: EngineMessage[];
    assistantContent: EngineContentPart[];
    text: string;
    toolCalls: AgentLoopToolCallSummary[];
    toolResults: AgentLoopToolResultSummary[];
    retryCount: number;
}
export type AgentLoopFinalResponseGuardResult = string | {
    retryMessage: string;
    fallbackMessage?: string;
};
export type AgentLoopFinalResponseGuard = (context: AgentLoopFinalResponseGuardContext) => AgentLoopFinalResponseGuardResult | null | undefined | Promise<AgentLoopFinalResponseGuardResult | null | undefined>;
export declare const AGENT_INTERNAL_CONTINUE_PROMPT = "Continue from where you left off and finish the user's original request. Do not repeat completed work, do not mention internal reconnects, time limits, or step limits, and continue as if this is the same uninterrupted run.";
export type AgentLoopContinuationReason = "run_timeout" | "loop_limit" | "stream_ended" | "gateway_timeout" | "network_interrupted";
export declare function appendAgentLoopContinuation(messages: EngineMessage[], reason: AgentLoopContinuationReason): void;
/**
 * True when an error thrown by `runAgentLoop` is a recoverable transport- or
 * gateway-level interruption that the agent can resume from rather than a
 * terminal failure. The continuation pattern works because the LLM call's
 * conversation prefix is preserved on the next attempt — Anthropic's prompt
 * cache rescues the latency, and the agent gets a "you got cut off, continue"
 * nudge so it doesn't redo work it already finished.
 *
 * Distinct from `isRetryableError` which guides per-engine quick retries:
 * `isResumableEngineError` is checked AFTER engine retries are exhausted, at
 * the run level. It catches both gateway-reported timeouts (where engine
 * retries don't apply because the gateway already gave up) and transport
 * errors that survived engine retry budgets.
 */
export declare function isResumableEngineError(err: unknown): boolean;
/**
 * Map a resumable error to the most descriptive continuation reason. Used
 * when surfacing the resume to the agent and to clients via the
 * `auto_continue` event.
 */
export declare function continuationReasonForResumableError(err: unknown): "gateway_timeout" | "network_interrupted";
/**
 * Convert ActionEntry registry to EngineTool array.
 */
export declare function actionsToEngineTools(actions: Record<string, ActionEntry>): EngineTool[];
/**
 * The core agent loop — calls the engine iteratively until no more tool calls.
 * Decoupled from HTTP transport so it can run in the background.
 * Returns accumulated token usage for cost tracking.
 */
export declare function runAgentLoop(opts: {
    engine: AgentEngine;
    model: string;
    systemPrompt: string;
    tools: EngineTool[];
    messages: EngineMessage[];
    actions: Record<string, ActionEntry>;
    send: (event: AgentChatEvent) => void;
    signal: AbortSignal;
    ownerEmail?: string | null;
    orgId?: string | null;
    reasoningEffort?: ReasoningEffort;
    providerOptions?: any;
    executionMode?: AgentExecutionMode;
    maxIterations?: number;
    finalResponseGuard?: AgentLoopFinalResponseGuard;
}): Promise<AgentLoopUsage>;
export declare function createProductionAgentHandler(options: ProductionAgentOptions): H3EventHandler;
export { getActiveRunForThread, getActiveRunForThreadAsync, getRun, abortRun, subscribeToRun, };
//# sourceMappingURL=production-agent.d.ts.map