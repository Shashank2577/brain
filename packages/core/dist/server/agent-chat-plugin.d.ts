import { type ActionEntry } from "../agent/production-agent.js";
import type { AgentChatAttachment, AgentChatEvent, AgentChatReference, MentionProvider } from "../agent/types.js";
import { McpClientManager } from "../mcp-client/index.js";
import { type A2AArtifactResponseOptions, type A2AToolResultSummary } from "../a2a/artifact-response.js";
export declare function assembleA2AFinalResponse(events: readonly AgentChatEvent[], toolResults: readonly A2AToolResultSummary[], options?: A2AArtifactResponseOptions & {
    event?: any;
}): {
    responseText: string;
    finalText: string;
};
type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
export interface AgentChatPluginOptions {
    /** Template-specific actions (email ops, booking ops, etc.) */
    actions?: Record<string, ActionEntry> | (() => Record<string, ActionEntry> | Promise<Record<string, ActionEntry>>);
    /** @deprecated Use `actions` instead */
    scripts?: Record<string, ActionEntry> | (() => Record<string, ActionEntry> | Promise<Record<string, ActionEntry>>);
    /** System prompt for the agent. A sensible default is provided. */
    systemPrompt?: string;
    /** Additional system prompt prepended in dev mode */
    devSystemPrompt?: string;
    /** Model to use. Defaults to the resolved engine's default model. */
    model?: string;
    /** Optional per-app agent run chunk budget in milliseconds. Defaults to
     * AGENT_RUN_SOFT_TIMEOUT_MS when set, otherwise no framework-imposed
     * timeout. When reached, long runs continue through the hidden continuation
     * path instead of surfacing a timeout warning. */
    runSoftTimeoutMs?: number;
    /** Anthropic API key. Falls back to ANTHROPIC_API_KEY env var */
    apiKey?: string;
    /**
     * Agent engine to use. Can be a pre-constructed AgentEngine, a registered
     * engine name (e.g. "anthropic", "ai-sdk:openai"), or an object with name
     * and config. Defaults to the "anthropic" engine using ANTHROPIC_API_KEY.
     */
    engine?: import("../agent/engine/types.js").AgentEngine | string | {
        name: string;
        config: Record<string, unknown>;
    };
    /** Route path. Default: /_agent-native/agent-chat */
    path?: string;
    /** Custom mention providers for @-tagging template entities */
    mentionProviders?: Record<string, MentionProvider> | (() => Record<string, MentionProvider> | Promise<Record<string, MentionProvider>>);
    /** App ID used to exclude self from agent discovery (e.g., "mail", "calendar") */
    appId?: string;
    /**
     * Optional callback to resolve the org ID for the current request.
     * When provided, the resolved value is set as AGENT_ORG_ID env var so
     * that db-query/db-exec automatically scope by org_id in addition to
     * owner_email.
     *
     * If not provided, the framework automatically uses `session.orgId` from
     * Better Auth's active organization. Only provide this callback when you
     * need custom org resolution logic (e.g., Atlassian org mapping).
     */
    resolveOrgId?: (event: any) => string | null | Promise<string | null>;
    /**
     * Optional owner resolver for public/anonymous chat surfaces. When the
     * normal app session is missing, this callback may return a synthetic
     * owner id for a narrowly-scoped public request (for example, a public
     * shared document page). Anonymous requests use a read-only tool set by
     * default so public viewers cannot mutate app data through the agent.
     */
    anonymousOwner?: (event: any) => string | null | Promise<string | null>;
    /**
     * Keep anonymous-owner requests on read-only template actions. Defaults to
     * true. Only disable for single-tenant apps that intentionally allow public
     * agent mutations.
     */
    anonymousReadOnly?: boolean;
    /**
     * Optional callback to append template-specific context to the system
     * prompt on each request. Runs after AGENTS.md / skills / memory are
     * loaded and before the schema block — use it to inject dynamic SQL
     * context like a data dictionary, active feature flags, or whatever
     * the agent should know about *right now* for this user/org.
     *
     * Return `null` or an empty string to skip. The string you return is
     * appended verbatim, so wrap it in your own XML tags (e.g.
     * `<data-dictionary>…</data-dictionary>`) to keep the prompt scannable.
     *
     * Called on every request in every prompt variant (lean, lazy, full).
     * Templates that want to suppress it in a particular mode should return
     * `null` from the callback based on their own logic.
     */
    extraContext?: (event: any, owner: string) => string | null | Promise<string | null>;
    /**
     * Optional final-answer guard. Templates can use this to require a
     * corrective retry before accepting a text-only final answer, e.g. forcing
     * real data-source tool calls for analytics requests.
     */
    finalResponseGuard?: import("../agent/production-agent.js").AgentLoopFinalResponseGuard;
    /**
     * Optional per-template request normalizer. Runs after authentication and
     * before the model sees the message, so apps can translate chat attachments
     * into template-native file handles while preserving the user's visible text.
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
        mode: "act" | "plan";
    }) => void | {
        message?: string;
        displayMessage?: string;
        attachments?: AgentChatAttachment[];
    } | Promise<void | {
        message?: string;
        displayMessage?: string;
        attachments?: AgentChatAttachment[];
    }>;
    /**
     * Use ONLY the template's `systemPrompt` and the actions list — skip the
     * framework prompt wrapper, resource loading (AGENTS.md/LEARNINGS.md/
     * memory), the SQL schema block, and the workspace files/skills/agents
     * inventory. Intended for minimal or voice-first apps where a long,
     * generic preamble adds latency and iteration noise without adding value.
     *
     * When set, the same lean prompt is used in both dev and prod modes. In
     * dev mode the tool registry is ALSO swapped to the template's actions
     * (same set as prod) — the dev-only shell/db-exec/file-system tools
     * and the resource/docs/chat/team/job/browser scripts are dropped. The
     * lean system prompt has no shell-usage guidance, so routing actions
     * through shell would break. If you need the full dev tool surface,
     * leave this off.
     */
    leanPrompt?: boolean;
    /**
     * Use a compact system prompt with on-demand context loading. The system
     * prompt includes essential behavioral rules and action signatures, but
     * defers verbose framework details, SQL schema, skills, learnings, and
     * memory behind tools (`get-framework-context`, `db-schema`,
     * `resources` (action: read)). The agent fetches these on-demand when needed.
     *
     * This reduces the system prompt by ~60-70%, significantly improving
     * time-to-first-token and reducing "thinking" time. The agent retains
     * all capabilities — it just loads context lazily instead of upfront.
     *
     * Defaults to `true`. Set to `false` to use the original full prompt.
     * Ignored when `leanPrompt` is set (lean mode is even more minimal).
     */
    lazyContext?: boolean;
    /**
     * In dev mode, register the template's actions as native tools the agent
     * can call directly with structured JSON args — skipping the default
     * `shell(command="pnpm action <name> ...")` indirection.
     *
     * The default dev behavior shells out because it "mirrors how Claude Code
     * works locally" and reduces empty-object tool calls for templates with
     * simple string args. But templates whose actions take structured data
     * (objects, arrays, nested JSON) can't round-trip those cleanly through
     * the CLI parser — stringified JSON on the way in, loss of type fidelity
     * on the way out.
     *
     * Set to `true` to get the same tool surface in dev that production uses.
     * `leanPrompt: true` implies this already (lean mode has no shell-usage
     * guidance, so actions must be native). Set this flag without
     * `leanPrompt` when you want native actions AND the full system prompt.
     *
     * Defaults to `false`.
     */
    nativeActionsInDev?: boolean;
}
export declare function createAgentChatPlugin(options?: AgentChatPluginOptions): NitroPluginDef;
/**
 * Default agent chat plugin with no template-specific actions.
 * In dev mode, provides file system, shell, and database tools.
 * In production, provides only the default system prompt.
 */
export declare const defaultAgentChatPlugin: NitroPluginDef;
/** Internal: access the current process's MCP client manager, if any. */
export declare function getGlobalMcpManager(): McpClientManager | null;
export {};
//# sourceMappingURL=agent-chat-plugin.d.ts.map