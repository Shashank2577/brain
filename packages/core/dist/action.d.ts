import type { StandardSchemaV1 } from "@standard-schema/spec";
export interface AgentActionStopOptions {
    /** Optional stable code surfaced in run metadata and tests. */
    errorCode?: string;
    /** Optional short tool-result text. Defaults to the user-facing message. */
    toolResult?: string;
}
/**
 * Throw from an action when the agent should stop the current turn instead of
 * feeding the failure back to the model for another retry.
 */
export declare class AgentActionStopError extends Error {
    readonly agentNativeStop = true;
    readonly errorCode?: string;
    readonly toolResult?: string;
    constructor(message: string, options?: AgentActionStopOptions);
}
export declare function isAgentActionStopError(err: unknown): err is AgentActionStopError;
/** HTTP exposure config for an action. */
export interface ActionHttpConfig {
    /** HTTP method. Default: "POST". Use "GET" for read-only actions. */
    method?: "GET" | "POST" | "PUT" | "DELETE";
    /** Override route path under /_agent-native/actions/. Default: action filename. */
    path?: string;
}
/** Schema definition for a single action parameter (legacy JSON schema style). */
export interface ParameterSchema {
    type: string;
    description?: string;
    enum?: string[];
}
/** Infer runtime parameter types from a legacy parameter schema map. */
type InferParams<T extends Record<string, ParameterSchema> | undefined> = T extends Record<string, ParameterSchema> ? {
    [K in keyof T]?: string;
} : Record<string, string>;
interface DefineActionWithSchema<TSchema extends StandardSchemaV1, TReturn = any> {
    description: string;
    /** Standard Schema-compatible schema (Zod, Valibot, ArkType). Provides runtime
     *  validation and full TypeScript type inference for `run()` args. The schema is
     *  also converted to JSON Schema for the Claude API tool definition. */
    schema: TSchema;
    /** Legacy parameters — ignored when `schema` is provided. */
    parameters?: never;
    run: (args: StandardSchemaV1.InferOutput<TSchema>) => Promise<TReturn> | TReturn;
    http?: ActionHttpConfig | false;
    /** If true, the framework will NOT emit a screen-refresh poll event after a
     *  successful call. Auto-inferred as `true` when `http.method === "GET"`.
     *  Only set this manually when you need to override the inference — e.g. a
     *  POST action that only reads data but can't use GET for a protocol reason. */
    readOnly?: boolean;
    /** If true, the agent may execute this action concurrently with other
     *  read-only or parallel-safe tool calls emitted in the same model turn.
     *  Only set this for mutating actions that are internally concurrency-safe
     *  and order-independent for same-turn execution. */
    parallelSafe?: boolean;
    /** Whether this action may be invoked from the tools (Alpine iframe) bridge
     *  via `appAction(name, params)` — see `packages/core/docs/content/actions.md`
     *  ("Tools Callability"). **Default-allow opt-out**: undefined / `true` both
     *  allow tool-iframe calls; only an explicit `false` returns 403. Set to
     *  `false` for high-blast-radius admin operations (account deletion, org
     *  membership changes, anything that modifies auth state) — used by the
     *  framework's `share-resource`, `unshare-resource`, and
     *  `set-resource-visibility` for defense-in-depth. Regular UI/agent/CLI/MCP/A2A
     *  calls are unaffected. Enforced by the action HTTP route layer — see
     *  `packages/core/src/server/action-routes.ts`. Audit reference: H5 in
     *  `security-audit/05-tools-sandbox.md`. */
    toolCallable?: boolean;
}
interface DefineActionWithParams<TParams extends Record<string, ParameterSchema> | undefined = Record<string, ParameterSchema> | undefined, TReturn = any> {
    description: string;
    /** Flat map of parameter names to their schema. Automatically wrapped in
     *  `{ type: "object", properties: ... }` for the Claude API. */
    parameters?: TParams;
    /** Standard Schema — not used in this overload. */
    schema?: never;
    run: (args: InferParams<TParams>) => Promise<TReturn> | TReturn;
    http?: ActionHttpConfig | false;
    /** If true, the framework will NOT emit a screen-refresh poll event after a
     *  successful call. Auto-inferred as `true` when `http.method === "GET"`. */
    readOnly?: boolean;
    /** If true, the agent may execute this action concurrently with other
     *  read-only or parallel-safe tool calls emitted in the same model turn. */
    parallelSafe?: boolean;
    /** Whether this action may be invoked from the tools (Alpine iframe) bridge
     *  via `appAction(name, params)`. See the schema overload above for details
     *  and the `toolCallable` section in actions.md. */
    toolCallable?: boolean;
}
/**
 * Define an agent action. Place in `actions/` directory — auto-discovered by the framework.
 *
 * Supports two modes:
 *
 * **Schema mode (recommended)** — pass a Standard Schema-compatible schema (Zod, Valibot,
 * ArkType) for runtime validation and full type inference:
 *
 * ```ts
 * import { defineAction } from "@agent-native/core";
 * import { z } from "zod";
 *
 * export default defineAction({
 *   description: "Create a form",
 *   schema: z.object({
 *     title: z.string().describe("Form title"),
 *     status: z.enum(["draft", "published", "closed"]).default("draft"),
 *   }),
 *   run: async (args) => {
 *     // args is { title: string; status: "draft" | "published" | "closed" }
 *     // Already validated — invalid inputs never reach here
 *   },
 * });
 * ```
 *
 * **Parameters mode (legacy)** — pass raw JSON schema-like parameter definitions:
 *
 * ```ts
 * export default defineAction({
 *   description: "List events",
 *   parameters: {
 *     from: { type: "string", description: "Start date" },
 *   },
 *   run: async (args) => { ... },
 * });
 * ```
 */
export declare function defineAction<TSchema extends StandardSchemaV1, TReturn>(options: DefineActionWithSchema<TSchema, TReturn>): any;
export declare function defineAction<TParams extends Record<string, ParameterSchema> | undefined, TReturn>(options: DefineActionWithParams<TParams, TReturn>): any;
export {};
//# sourceMappingURL=action.d.ts.map