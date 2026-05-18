/**
 * Registers built-in agent engines (anthropic, ai-sdk:*, bedrock) into the global registry.
 *
 * This module is imported once at server startup via the agent-chat plugin.
 * Additional engines can be registered by calling registerAgentEngine() from
 * any server plugin after startup.
 */
/**
 * Register all built-in engines. Safe to call multiple times (idempotent).
 */
export declare function registerBuiltinEngines(): void;
//# sourceMappingURL=builtin.d.ts.map