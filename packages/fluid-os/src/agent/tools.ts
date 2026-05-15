import type { z } from "zod";
import type { CapabilityRegistry } from "../registry.js";
import type { OsClient } from "../rpc/client.js";
import type { CapabilityMap } from "../manifest/types.js";

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: unknown;
  execute(input: unknown): Promise<unknown>;
}

export function capabilitiesToAgentTools(
  registry: CapabilityRegistry,
  client: OsClient,
): AgentTool[] {
  const tools: AgentTool[] = [];
  for (const app of registry.listApps()) {
    for (const [capId, def] of Object.entries(app.capabilities as CapabilityMap)) {
      const fqid = `${app.id}.${capId}`;
      tools.push({
        name: fqid.replace(/\./g, "__"),
        description: `[${app.name}] ${def.description}`,
        inputSchema: toJsonSchema(def.input),
        execute: (input) => client.call(fqid, input),
      });
    }
  }
  return tools;
}

function toJsonSchema(schema: z.ZodType): unknown {
  const anySchema = schema as unknown as {
    _def?: unknown;
    toJSON?: () => unknown;
  };
  if (typeof anySchema.toJSON === "function") {
    return anySchema.toJSON();
  }
  return { type: "object", description: "see zod schema on server" };
}
