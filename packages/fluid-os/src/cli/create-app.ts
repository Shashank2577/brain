#!/usr/bin/env node
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../..");
const APPS_DIR = join(REPO_ROOT, "examples/apps");

interface ParsedManifest {
  id: string;
  name: string;
  description: string;
  url?: string;
  routes?: { path: string; label: string }[];
  consumes?: string[];
  capabilities: { id: string; description: string; tags?: string[] }[];
}

function help(): never {
  console.log(`
fluid-os create-app — scaffold a new app and print the existing capability registry first.

Usage:
  fluid-os create-app <id> [options]

Options:
  --name "<display name>"     Defaults to the id, title-cased.
  --description "<text>"      Required.
  --consumes "<a.b,c.d>"      Comma-separated capability ids this app will call.
  --capability "<id:desc>"    Capability to expose. Repeatable. Format "id:description".
  --out <dir>                 Where to write the manifest. Defaults to examples/apps/<id>/.
  --print-registry            Print the existing app registry and exit without scaffolding.

Examples:
  fluid-os create-app print-registry         # show what's already there
  fluid-os create-app billing \\
    --description "Invoices and subscriptions." \\
    --consumes "mail.send-email,crm.list-contacts" \\
    --capability "create-invoice:Create an invoice for a contact." \\
    --capability "list-invoices:List the user's invoices."
`);
  process.exit(0);
}

function parseArgs(argv: string[]) {
  const args: { positional: string[]; flags: Record<string, string | string[] | boolean> } = {
    positional: [],
    flags: {},
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args.flags[key] = true;
      } else {
        const existing = args.flags[key];
        if (Array.isArray(existing)) existing.push(next);
        else if (typeof existing === "string") args.flags[key] = [existing, next];
        else args.flags[key] = next;
        i++;
      }
    } else {
      args.positional.push(a);
    }
  }
  return args;
}

function readExistingManifests(): ParsedManifest[] {
  if (!existsSync(APPS_DIR)) return [];
  const out: ParsedManifest[] = [];
  for (const entry of readdirSync(APPS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(APPS_DIR, entry.name, "manifest.ts");
    if (!existsSync(file)) continue;
    try {
      out.push(parseManifestFile(readFileSync(file, "utf8")));
    } catch {
      // skip unparseable; the runtime registry is the ground truth anyway
    }
  }
  return out;
}

function parseManifestFile(src: string): ParsedManifest {
  const get = (re: RegExp) => src.match(re)?.[1] ?? "";

  const id = get(/\bid:\s*["'`]([^"'`]+)["'`]/);
  const name = get(/\bname:\s*["'`]([^"'`]+)["'`]/);
  const description = get(/\bdescription:\s*["'`]([^"'`]+)["'`]/);
  const url = get(/\burl:\s*["'`]([^"'`]+)["'`]/);

  const consumes: string[] = [];
  const consumesMatch = src.match(/consumes:\s*\[([^\]]*)\]/);
  if (consumesMatch) {
    for (const m of consumesMatch[1].matchAll(/["'`]([^"'`]+)["'`]/g)) consumes.push(m[1]);
  }

  const capabilities: ParsedManifest["capabilities"] = [];
  const capsStart = src.indexOf("capabilities:");
  if (capsStart >= 0) {
    const after = src.slice(capsStart);
    const capRe = /["'`]?([a-z][a-z0-9-]*)["'`]?\s*:\s*\{\s*description:\s*["'`]([^"'`]+)["'`]/g;
    for (const m of after.matchAll(capRe)) {
      capabilities.push({ id: m[1], description: m[2] });
    }
  }

  return { id, name, description, url, consumes, capabilities };
}

function printRegistry(manifests: ParsedManifest[]) {
  console.log("");
  console.log("┌───────────────────────────────────────────────────────────┐");
  console.log("│ Apps already installed on this Fluid OS                   │");
  console.log("└───────────────────────────────────────────────────────────┘");
  if (manifests.length === 0) {
    console.log("  (none)");
    return;
  }
  for (const m of manifests) {
    console.log(`\n  ▸ ${m.name} (${m.id})`);
    console.log(`    ${m.description}`);
    if (m.consumes && m.consumes.length) {
      console.log(`    consumes: ${m.consumes.join(", ")}`);
    }
    for (const c of m.capabilities) {
      console.log(`      • ${m.id}.${c.id}  —  ${c.description}`);
    }
  }
  console.log("");
  console.log("Before adding a new app, scan the list above and reuse what you can via `consumes`.");
  console.log("");
}

function titleCase(s: string) {
  return s
    .split("-")
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
}

function asList(v: string | string[] | boolean | undefined): string[] {
  if (!v || v === true) return [];
  return Array.isArray(v) ? v : [v];
}

function buildManifestSource(opts: {
  id: string;
  name: string;
  description: string;
  consumes: string[];
  capabilities: { id: string; description: string }[];
}): string {
  const consumesLine = opts.consumes.length
    ? `  consumes: [${opts.consumes.map((c) => `"${c}"`).join(", ")}],\n`
    : "";

  const capsBody = opts.capabilities
    .map(
      (c) => `    "${c.id}": {
      description: ${JSON.stringify(c.description)},
      input: z.object({}).passthrough(),
      output: z.unknown(),
      tags: ["TODO"],
      handler: async (_input, ctx) => {
        // ctx.user        — verified OS user
        // ctx.caller.appId — which app made this call
        // ctx.call(fqid, input) — call any other capability
        throw new Error("Not implemented yet");
      },
    },`,
    )
    .join("\n");

  return `import { z } from "zod";
import { defineApp } from "@agent-native/fluid-os/manifest";

export const ${camel(opts.id)}App = defineApp({
  id: "${opts.id}",
  name: ${JSON.stringify(opts.name)},
  description: ${JSON.stringify(opts.description)},
  url: "http://localhost:0",
${consumesLine}  routes: [],
  capabilities: {
${capsBody}
  },
});
`;
}

function camel(s: string) {
  return s.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags["help"] || args.flags["h"]) help();

  const manifests = readExistingManifests();

  if (args.flags["print-registry"] || args.positional[0] === "print-registry") {
    printRegistry(manifests);
    return;
  }

  const id = args.positional[0];
  if (!id) {
    printRegistry(manifests);
    console.log('Pass an app id, e.g. `fluid-os create-app billing --description "..."`');
    console.log("Or `fluid-os create-app print-registry` to just see what's there.");
    process.exit(1);
  }
  if (!/^[a-z][a-z0-9-]*$/.test(id)) {
    console.error(`Invalid id "${id}". Must be lower-kebab and start with a letter.`);
    process.exit(1);
  }

  printRegistry(manifests);

  const name = (args.flags["name"] as string) || titleCase(id);
  const description = args.flags["description"] as string;
  if (!description) {
    console.error("--description is required.");
    process.exit(1);
  }

  const consumesRaw = (args.flags["consumes"] as string | undefined) ?? "";
  const consumes = consumesRaw
    ? consumesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const allCapIds = new Set(manifests.flatMap((m) => m.capabilities.map((c) => `${m.id}.${c.id}`)));
  for (const c of consumes) {
    if (!allCapIds.has(c)) {
      console.warn(`! consumes "${c}" was not found in any installed app. Make sure the id is correct.`);
    }
  }

  const capabilities = asList(args.flags["capability"]).map((entry) => {
    const colon = entry.indexOf(":");
    if (colon <= 0) {
      console.error(`Invalid --capability "${entry}". Expected "id:description".`);
      process.exit(1);
    }
    const capId = entry.slice(0, colon).trim();
    const capDesc = entry.slice(colon + 1).trim();
    if (!/^[a-z][a-z0-9-]*$/.test(capId)) {
      console.error(`Invalid capability id "${capId}". Must be lower-kebab.`);
      process.exit(1);
    }
    return { id: capId, description: capDesc };
  });

  if (capabilities.length === 0) {
    console.warn("! No --capability flags given. Scaffolding with no exposed capabilities.");
  }

  const out = (args.flags["out"] as string | undefined) ?? join(APPS_DIR, id);
  if (existsSync(out)) {
    console.error(`Refusing to overwrite existing directory: ${out}`);
    process.exit(1);
  }
  mkdirSync(out, { recursive: true });
  const file = join(out, "manifest.ts");
  writeFileSync(
    file,
    buildManifestSource({ id, name, description, consumes, capabilities }),
    "utf8",
  );

  console.log("");
  console.log(`✓ Created ${file}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  1. Implement each capability handler (currently throw "Not implemented yet").`);
  console.log(`  2. Add \`os.install(${camel(id)}App)\` to your host startup.`);
  if (consumes.length) {
    console.log(`  3. Cross-app calls you declared:`);
    for (const c of consumes) console.log(`     - ctx.call("${c}", ...)`);
  }
}

main();
