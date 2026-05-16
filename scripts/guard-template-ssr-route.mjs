#!/usr/bin/env node
/**
 * Guard: every template MUST have `server/routes/[...page].get.ts` wiring
 * up `createTemplateServer` from `@agent-native/core/server/template-server`.
 *
 * Without this catch-all, Nitro falls back to its renderer service which
 * loads `virtual:react-router/server-build` and expects `{ fetch }` exported
 * from it — that virtual module exports a routes manifest, not a fetch
 * handler, so the dev request fails with:
 *
 *   NitroViteError: No fetch handler exported from virtual:react-router/server-build
 *
 * The 4-template SSR outage (notes / tasks / crm / meetings, 2026-05-16)
 * happened exactly because per-template scaffolding had drifted. This guard
 * keeps drift from coming back.
 */

import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL(".", import.meta.url).pathname, "..");
const TEMPLATES_DIR = join(ROOT, "templates");

if (!existsSync(TEMPLATES_DIR)) {
  console.log("[guard:template-ssr-route] no templates/ directory — skipping");
  process.exit(0);
}

const ROUTE_REL = "server/routes/[...page].get.ts";
const REQUIRED_IMPORT = "@agent-native/core/server/template-server";
const REQUIRED_HELPER = "createTemplateServer";

const failures = [];
for (const entry of readdirSync(TEMPLATES_DIR)) {
  const templateDir = join(TEMPLATES_DIR, entry);
  if (!statSync(templateDir).isDirectory()) continue;
  // Skip templates that aren't full Nitro apps (no server/ directory).
  if (!existsSync(join(templateDir, "server"))) continue;

  const routePath = join(templateDir, ROUTE_REL);
  if (!existsSync(routePath)) {
    failures.push(`${entry}: missing ${ROUTE_REL}`);
    continue;
  }
  const src = readFileSync(routePath, "utf8");
  if (!src.includes(REQUIRED_IMPORT) || !src.includes(REQUIRED_HELPER)) {
    failures.push(
      `${entry}: ${ROUTE_REL} must use createTemplateServer from ${REQUIRED_IMPORT}`,
    );
  }
}

if (failures.length > 0) {
  console.error("[guard:template-ssr-route] FAILED:");
  for (const f of failures) console.error("  - " + f);
  console.error(
    "\nFix: add server/routes/[...page].get.ts with:\n" +
      '  import { createTemplateServer } from "@agent-native/core/server/template-server";\n' +
      '  export default createTemplateServer({ templateId: "<name>", getBuild: () => import("virtual:react-router/server-build") });',
  );
  process.exit(1);
}

console.log(
  "[guard:template-ssr-route] OK — every template wires SSR via createTemplateServer",
);
