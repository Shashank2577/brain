/**
 * Throw from an action when the agent should stop the current turn instead of
 * feeding the failure back to the model for another retry.
 */
export class AgentActionStopError extends Error {
    agentNativeStop = true;
    errorCode;
    toolResult;
    constructor(message, options = {}) {
        super(message);
        this.name = "AgentActionStopError";
        this.errorCode = options.errorCode;
        this.toolResult = options.toolResult;
    }
}
export function isAgentActionStopError(err) {
    return (err instanceof AgentActionStopError ||
        Boolean(err &&
            typeof err === "object" &&
            "agentNativeStop" in err &&
            err.agentNativeStop === true));
}
export function defineAction(options) {
    const hasSchema = options.schema && "~standard" in options.schema;
    // Build tool definition for the Claude API
    let toolParameters;
    if (hasSchema) {
        // Convert Standard Schema to JSON Schema for Claude
        toolParameters = schemaToJsonSchema(options.schema, options.description);
    }
    else if (options.parameters) {
        toolParameters = {
            type: "object",
            properties: options.parameters,
        };
    }
    // Wrap run() with validation when schema is provided.
    // Pass toolParameters so the validation error can echo the expected signature
    // (required vs optional fields) and help the caller self-correct.
    const run = hasSchema
        ? wrapWithValidation(options.schema, options.run, toolParameters)
        : options.run;
    // Auto-infer readOnly from http.method === "GET" unless explicitly set.
    // GET actions are idempotent reads; their completion should NOT trigger a
    // screen refresh. Everything else is assumed to mutate — the dispatcher
    // emits a poll event on success so the UI auto-refetches its queries.
    const httpConfig = options.http;
    const inferredReadOnly = httpConfig !== false &&
        httpConfig !== undefined &&
        httpConfig.method === "GET";
    // Explicit `readOnly` (true OR false) wins. Otherwise infer from http.method.
    // We store the resolved boolean so downstream checks can trust entry.readOnly
    // without re-running method inference — including when a caller explicitly
    // passes readOnly:false to override a GET (rare but valid).
    const readOnly = typeof options.readOnly === "boolean"
        ? options.readOnly
        : inferredReadOnly
            ? true
            : undefined;
    // toolCallable: thread through whatever the caller declared. We DO NOT
    // default to `true` here — the absence of an explicit field is meaningful
    // to the tools bridge: it lets us emit a one-shot warning when an action
    // without a declared `toolCallable` flag is invoked from a tool, so the
    // ecosystem can migrate over time. The bridge treats `undefined` as
    // "implicit allow with a deprecation warning"; only an explicit `false`
    // refuses the call. See `extensions/routes.ts` and audit H5.
    const toolCallable = typeof options.toolCallable === "boolean"
        ? options.toolCallable
        : undefined;
    const parallelSafe = typeof options.parallelSafe === "boolean"
        ? options.parallelSafe
        : undefined;
    const publicAgent = options.publicAgent &&
        typeof options.publicAgent === "object" &&
        !Array.isArray(options.publicAgent)
        ? options.publicAgent
        : undefined;
    const link = typeof options.link === "function" ? options.link : undefined;
    return {
        tool: {
            description: options.description,
            parameters: toolParameters,
        },
        run,
        ...(hasSchema ? { schema: options.schema } : {}),
        ...(options.http !== undefined ? { http: options.http } : {}),
        ...(typeof readOnly === "boolean" ? { readOnly } : {}),
        ...(typeof parallelSafe === "boolean" ? { parallelSafe } : {}),
        ...(typeof toolCallable === "boolean" ? { toolCallable } : {}),
        ...(publicAgent ? { publicAgent } : {}),
        ...(link ? { link } : {}),
    };
}
// ---------------------------------------------------------------------------
// Schema → JSON Schema conversion
// ---------------------------------------------------------------------------
/**
 * Convert a Standard Schema to JSON Schema for the Claude API.
 * Tries vendor-specific toJSONSchema first (Zod v4), then falls back
 * to a basic introspection of the schema shape.
 */
function schemaToJsonSchema(schema, _description) {
    const s = schema;
    // Prefer Zod's own JSON Schema output — it handles descriptions,
    // enums, coerce, and all type wrappers correctly.
    if (s["~standard"]?.jsonSchema?.input) {
        try {
            const result = s["~standard"].jsonSchema.input({
                target: "draft-07",
            });
            // Strip $schema — the Claude API validates against draft 2020-12
            // and a mismatched $schema declaration can cause rejections.
            if (result && typeof result === "object") {
                delete result.$schema;
            }
            return result;
        }
        catch {
            // Fall through to manual converter
        }
    }
    // Fallback: manual conversion from Zod v4 internal defs
    if (s._zod?.def) {
        return zodDefToJsonSchema(s._zod.def);
    }
    // Last resort: empty object schema
    return { type: "object", properties: {} };
}
/**
 * Convert a Zod v4 internal def to JSON Schema.
 * Handles the common types used in action parameters.
 */
function zodDefToJsonSchema(def) {
    const type = def.type;
    if (type === "object") {
        const properties = {};
        const required = [];
        const shape = def.shape;
        if (shape) {
            for (const [key, fieldSchema] of Object.entries(shape)) {
                const fieldDef = fieldSchema?._zod?.def;
                if (fieldDef) {
                    const prop = zodDefToJsonSchema(fieldDef);
                    // Zod v4 stores .describe() on the schema object, not in the def
                    const desc = fieldSchema?.description;
                    if (desc && !prop.description)
                        prop.description = desc;
                    properties[key] = prop;
                    if (fieldDef.type !== "optional" && fieldDef.type !== "default") {
                        required.push(key);
                    }
                }
            }
        }
        const result = { type: "object", properties };
        if (required.length > 0)
            result.required = required;
        return result;
    }
    if (type === "string") {
        const result = { type: "string" };
        if (def.description)
            result.description = def.description;
        return result;
    }
    if (type === "number" || type === "float" || type === "int") {
        const result = { type: type === "int" ? "integer" : "number" };
        if (def.description)
            result.description = def.description;
        return result;
    }
    if (type === "boolean") {
        const result = { type: "boolean" };
        if (def.description)
            result.description = def.description;
        return result;
    }
    if (type === "enum") {
        // Zod v4 stores enum entries as an object {a: "a", b: "b"};
        // JSON Schema requires an array.
        const entries = def.entries;
        const enumValues = Array.isArray(entries)
            ? entries
            : typeof entries === "object" && entries !== null
                ? Object.values(entries)
                : entries;
        const result = { type: "string", enum: enumValues };
        if (def.description)
            result.description = def.description;
        return result;
    }
    if (type === "literal") {
        return { type: typeof def.value, enum: [def.value] };
    }
    if (type === "array") {
        const result = { type: "array" };
        if (def.element?._zod?.def) {
            result.items = zodDefToJsonSchema(def.element._zod.def);
        }
        if (def.description)
            result.description = def.description;
        return result;
    }
    if (type === "optional") {
        if (def.innerType?._zod?.def) {
            return zodDefToJsonSchema(def.innerType._zod.def);
        }
    }
    if (type === "default") {
        if (def.innerType?._zod?.def) {
            const inner = zodDefToJsonSchema(def.innerType._zod.def);
            inner.default =
                typeof def.defaultValue === "function"
                    ? def.defaultValue()
                    : def.defaultValue;
            return inner;
        }
    }
    if (type === "nullable") {
        if (def.innerType?._zod?.def) {
            return zodDefToJsonSchema(def.innerType._zod.def);
        }
    }
    if (type === "union") {
        if (def.options?.length) {
            // Check if it's a simple enum-like union of literals
            const allLiterals = def.options.every((o) => o?._zod?.def?.type === "literal");
            if (allLiterals) {
                return {
                    type: "string",
                    enum: def.options.map((o) => o._zod.def.value),
                };
            }
            return {
                anyOf: def.options.map((o) => zodDefToJsonSchema(o._zod?.def ?? {})),
            };
        }
    }
    // Fallback
    return { type: "string" };
}
// ---------------------------------------------------------------------------
// Runtime validation wrapper
// ---------------------------------------------------------------------------
/**
 * Wrap an action's run function with schema validation.
 * Invalid inputs get a clear error message (including what was actually passed)
 * so the agent can see its own mistake and correct it on the next turn.
 */
function wrapWithValidation(schema, run, toolParameters) {
    return async (args) => {
        const result = await schema["~standard"].validate(args);
        if (result.issues) {
            // Split issues into "missing required field" vs other validation errors
            // so the error message reads naturally rather than as "fieldName: Required".
            const missing = [];
            const other = [];
            for (const issue of result.issues) {
                const pathStr = issue.path
                    ? issue.path.map((p) => (typeof p === "object" ? p.key : p)).join(".")
                    : "";
                const msg = String(issue.message ?? "");
                // Zod emits "Required" for missing fields; other libraries may use
                // similar wording. Treat any variant as "missing".
                if (pathStr &&
                    (msg === "Required" ||
                        /invalid.*undefined/i.test(msg) ||
                        /expected.*received undefined/i.test(msg))) {
                    missing.push(pathStr);
                }
                else {
                    other.push(pathStr ? `${pathStr}: ${msg}` : msg);
                }
            }
            const parts = [];
            if (missing.length > 0) {
                parts.push(`Missing required parameter${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
            }
            if (other.length > 0) {
                parts.push(other.join("; "));
            }
            // Echo the args that were actually passed so the caller (usually an
            // agent) can see exactly what it sent and fix its next call.
            let received;
            try {
                received = JSON.stringify(args);
                if (received.length > 500)
                    received = received.slice(0, 500) + "…";
            }
            catch {
                received = String(args);
            }
            // Also show the EXPECTED signature so the agent doesn't have to guess.
            // Format: `{ deckId*: string, content*: string, slideId?: string, ... }`
            // where `*` = required, `?` = optional.
            let expected = "";
            if (toolParameters?.properties) {
                const required = new Set(toolParameters.required ?? []);
                const sig = Object.entries(toolParameters.properties)
                    .map(([k, v]) => {
                    const mark = required.has(k) ? "*" : "?";
                    const type = v.type ?? "any";
                    return `${k}${mark}: ${type}`;
                })
                    .join(", ");
                if (sig)
                    expected = ` Expected: { ${sig} } (where * = required, ? = optional).`;
            }
            throw new Error(`Invalid action parameters — ${parts.join(". ")}. Received: ${received}.${expected}`);
        }
        return run(result.value);
    };
}
//# sourceMappingURL=action.js.map