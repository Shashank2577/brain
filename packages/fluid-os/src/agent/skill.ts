import type { CapabilityRegistry } from "../registry.js";
import type { AppManifest, CapabilityMap } from "../manifest/types.js";

export interface SkillJson {
  generatedAt: string;
  apps: {
    id: string;
    name: string;
    description: string;
    consumes?: string[];
    routes?: { path: string; label: string }[];
    capabilities: { id: string; description: string; tags?: string[] }[];
    agentGuidance?: string;
  }[];
  crossAppPatterns: string[];
  scaffoldingFlow: string[];
}

export function buildSkillJson(registry: CapabilityRegistry): SkillJson {
  const apps = registry.listApps().map((app) => ({
    id: app.id,
    name: app.name,
    description: app.description,
    consumes: app.consumes,
    routes: app.routes,
    agentGuidance: app.agentGuidance,
    capabilities: Object.entries(app.capabilities as CapabilityMap).map(([id, def]) => ({
      id: `${app.id}.${id}`,
      description: def.description,
      tags: def.tags,
    })),
  }));

  return {
    generatedAt: new Date().toISOString(),
    apps,
    crossAppPatterns: CROSS_APP_PATTERNS,
    scaffoldingFlow: SCAFFOLDING_FLOW,
  };
}

export function buildSkillMarkdown(registry: CapabilityRegistry): string {
  const skill = buildSkillJson(registry);
  const out: string[] = [];

  out.push("# Fluid OS — installed apps");
  out.push("");
  out.push(`_Generated ${skill.generatedAt}_`);
  out.push("");
  out.push(
    "This is the live capability registry. Before adding a new app, check what already exists here and reuse it via `consumes`. Don't reimplement what another app already does.",
  );
  out.push("");

  for (const app of skill.apps) {
    out.push(`## ${app.name} (\`${app.id}\`)`);
    out.push("");
    out.push(app.description);
    if (app.consumes?.length) {
      out.push("");
      out.push(`**Consumes:** ${app.consumes.map((c) => `\`${c}\``).join(", ")}`);
    }
    if (app.routes?.length) {
      out.push("");
      out.push("Routes:");
      for (const r of app.routes) out.push(`- \`${r.path}\` — ${r.label}`);
    }
    out.push("");
    out.push("Capabilities:");
    for (const c of app.capabilities) {
      const tagSuffix = c.tags?.length ? `  _(${c.tags.join(", ")})_` : "";
      out.push(`- \`${c.id}\` — ${c.description}${tagSuffix}`);
    }
    if (app.agentGuidance) {
      out.push("");
      out.push("> Agent guidance:");
      out.push("");
      for (const line of app.agentGuidance.split("\n")) out.push(`> ${line}`);
    }
    out.push("");
  }

  out.push("## Cross-app patterns");
  out.push("");
  for (const p of skill.crossAppPatterns) out.push(`- ${p}`);
  out.push("");

  out.push("## Adding a new app");
  out.push("");
  for (let i = 0; i < skill.scaffoldingFlow.length; i++) {
    out.push(`${i + 1}. ${skill.scaffoldingFlow[i]}`);
  }
  out.push("");

  return out.join("\n");
}

const CROSS_APP_PATTERNS = [
  "Inside a handler, call any other capability with `ctx.call(\"<app>.<cap>\", input)`. The OS routes it through the registry and your user identity flows through unchanged.",
  "Declare every cross-app call in your manifest's `consumes` array so the dependency is visible to other apps and to the agent.",
  "AI work goes through `ctx.agent(prompt)`. Never ship inline LLM calls — that breaks the single-agent invariant.",
  "One canonical writer per resource: only `mail` writes email, only `calendar` writes events, only `content` writes documents. New apps call those, not duplicate them.",
  "Use `ctx.user.id` to scope reads/writes. Two users on the same OS see different data even though the in-process registry is shared.",
];

const SCAFFOLDING_FLOW = [
  "Fetch this skill (or `GET /_fluid-os/capabilities`) and read what already exists.",
  "Decide which existing capabilities the new app will `consume` and which new ones it will expose.",
  "POST `/_fluid-os/scaffold` with `{ id, name, description, consumes, capabilities }` OR use the in-shell `Create app` wizard. The OS will write the manifest file AND hot-install it.",
  "Implement each new capability's handler. Use `ctx.call` for cross-app work, `ctx.agent` for AI work.",
  "The new app appears in the sidebar; its capabilities appear in this skill and in the agent tool catalog automatically.",
];
