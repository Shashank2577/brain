import type { H3Event } from "h3";
import type { PlatformAdapter, IncomingMessage } from "./types.js";
import { type ActionEntry } from "../agent/production-agent.js";
import type { AgentEngine } from "../agent/engine/types.js";
import { type PendingTask } from "./pending-tasks-store.js";
export interface WebhookHandlerOptions {
    adapter: PlatformAdapter;
    /** Resolved system prompt string */
    systemPrompt: string;
    /** Action entries for the agent */
    actions: Record<string, ActionEntry>;
    /** Model to use. Defaults to the resolved engine's default model. */
    model?: string;
    /** Anthropic API key */
    apiKey: string;
    /** Agent engine to use. Defaults to the same resolver as web chat. */
    engine?: AgentEngine | string | {
        name: string;
        config: Record<string, unknown>;
    };
    /** Thread owner for personal/shared resource loading */
    ownerEmail: string;
    /**
     * Pre-parsed incoming message. When provided, handleWebhook skips its own
     * verification + parsing steps. Required when the caller has already read
     * the request body (h3 doesn't reliably cache parsed bodies, so re-parsing
     * the same event hangs on streaming providers).
     */
    incoming?: IncomingMessage;
    /** Optional hook to intercept inbound commands before agent execution */
    beforeProcess?: (incoming: IncomingMessage, adapter: PlatformAdapter) => Promise<{
        handled: true;
        responseText?: string;
    } | {
        handled: false;
    }>;
}
/**
 * Process an incoming webhook from a messaging platform.
 *
 * Flow:
 * 1. Handle verification challenges (Slack url_verification, etc.)
 * 2. Verify webhook signature
 * 3. Parse incoming message (null = ignored event)
 * 4. Persist task to SQL
 * 5. Fire-and-forget POST to /_agent-native/integrations/process-task
 *    (a fresh function execution with its own timeout budget)
 * 6. Return HTTP 200 immediately (within Slack's 3s SLA)
 *
 * The processor endpoint runs the actual agent loop. This split is essential
 * for serverless platforms (Netlify Lambda, Vercel, Cloudflare Workers) which
 * freeze the function as soon as the response is returned, killing any
 * lingering background promises.
 */
export declare function handleWebhook(event: H3Event, options: WebhookHandlerOptions): Promise<{
    status: number;
    body: unknown;
}>;
/**
 * Resolve the base URL we should dispatch the processor request to.
 * Prefers explicit env vars (most reliable on serverless), falls back to the
 * inbound request's headers.
 */
export declare function resolveBaseUrl(event: H3Event): string;
/**
 * Run the actual agent loop for a previously-enqueued task. Called by the
 * processor endpoint in `plugin.ts`. This is a fresh function execution, so
 * it gets its own timeout budget independent of the inbound webhook handler.
 */
export declare function processIntegrationTask(task: PendingTask, options: WebhookHandlerOptions): Promise<void>;
//# sourceMappingURL=webhook-handler.d.ts.map