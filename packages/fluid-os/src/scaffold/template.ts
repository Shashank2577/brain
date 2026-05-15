export interface ScaffoldSpec {
  id: string;
  name: string;
  description: string;
  consumes: string[];
  capabilities: { id: string; description: string }[];
  agentGuidance?: string;
}

export function validateScaffoldSpec(spec: ScaffoldSpec): string | null {
  if (!/^[a-z][a-z0-9-]*$/.test(spec.id)) return `Invalid app id "${spec.id}" — must be lower-kebab.`;
  if (!spec.name.trim()) return "Name is required.";
  if (!spec.description.trim()) return "Description is required.";
  for (const cap of spec.capabilities) {
    if (!/^[a-z][a-z0-9-]*$/.test(cap.id)) return `Invalid capability id "${cap.id}" — must be lower-kebab.`;
    if (!cap.description.trim()) return `Capability "${cap.id}" needs a description.`;
  }
  return null;
}

export function buildManifestSource(spec: ScaffoldSpec): string {
  const consumesLine = spec.consumes.length
    ? `  consumes: [${spec.consumes.map((c) => JSON.stringify(c)).join(", ")}],\n`
    : "";

  const guidance = spec.agentGuidance
    ? `  agentGuidance: ${JSON.stringify(spec.agentGuidance)},\n`
    : "";

  const capsBody = spec.capabilities
    .map(
      (c) => `    ${JSON.stringify(c.id)}: {
      description: ${JSON.stringify(c.description)},
      input: z.object({}).passthrough(),
      output: z.unknown(),
      tags: ["TODO"],
      handler: async (_input, ctx) => {
        // ctx.user        — the OS-verified user
        // ctx.caller.appId — which app made this call
        // ctx.call(fqid, input) — call any other capability
        // ctx.agent(prompt) — delegate AI work to the agent chat
        throw new Error("Not implemented yet");
      },
    },`,
    )
    .join("\n");

  return `import { z } from "zod";
import { defineApp } from "@agent-native/fluid-os/manifest";

export const ${camel(spec.id)}App = defineApp({
  id: ${JSON.stringify(spec.id)},
  name: ${JSON.stringify(spec.name)},
  description: ${JSON.stringify(spec.description)},
  url: "http://localhost:0",
${consumesLine}${guidance}  routes: [],
  capabilities: {
${capsBody}
  },
});
`;
}

export function camel(s: string): string {
  return s.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
}
