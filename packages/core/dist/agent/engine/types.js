/**
 * Pluggable Agent Engine abstraction.
 *
 * AgentEngine is the thin LLM adapter that sits beneath runAgentLoop.
 * Every caller (HTTP handler, A2A, MCP, sub-agents, webhooks, jobs) uses
 * an AgentEngine instead of a raw @anthropic-ai/sdk client.
 *
 * The framework's tool dispatch loop, sub-agents, SSE event stream, and all
 * other harness features live above this layer and are unaffected by engine
 * selection.
 */
/**
 * Thrown when an engine emits a terminal stop-error event. Carries optional
 * structured fields (errorCode / upgradeUrl) that propagate up to the SSE
 * "error" event so the chat UI can render a structured CTA — e.g. an
 * Upgrade button for Builder gateway 402 quota errors.
 *
 * Lives in the engine types module (not production-agent) so run-manager and
 * other consumers can `instanceof` it without an import cycle.
 */
export class EngineError extends Error {
    errorCode;
    upgradeUrl;
    constructor(message, opts) {
        super(message);
        this.name = "EngineError";
        this.errorCode = opts?.errorCode;
        this.upgradeUrl = opts?.upgradeUrl;
    }
}
//# sourceMappingURL=types.js.map