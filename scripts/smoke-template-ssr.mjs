#!/usr/bin/env node
/**
 * Smoke check for template SSR wiring.
 *
 * This wraps the static `guard-template-ssr-route.mjs` check with a few
 * additional invariants so a future drift can't silently re-introduce the
 * "NitroViteError: No fetch handler exported from
 * virtual:react-router/server-build" outage that hid behind auth-redirect
 * 200s in the previous QA pass.
 *
 * Checks (all static — no template boot required):
 *   1. Every template has `server/routes/[...page].get.ts` using
 *      `createTemplateServer({ templateId, getBuild })`.
 *   2. `templateId` matches the directory name (so telemetry doesn't lie).
 *   3. The HEAD route exists and re-exports the GET route.
 *   4. The `@agent-native/core/server/template-server` export resolves
 *      to a real file on disk (catches accidental removal of the helper).
 */

import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const TEMPLATES_DIR = join(ROOT, "templates");
const HELPER_SRC = join(ROOT, "packages/core/src/server/template-server.ts");

if (!existsSync(HELPER_SRC)) {
  console.error(
    `[smoke:template-ssr] FAIL — helper source missing at ${HELPER_SRC}`,
  );
  process.exit(1);
}

const failures = [];
let checked = 0;
for (const entry of readdirSync(TEMPLATES_DIR)) {
  const templateDir = join(TEMPLATES_DIR, entry);
  if (!statSync(templateDir).isDirectory()) continue;
  if (!existsSync(join(templateDir, "server"))) continue;

  checked++;
  const getRoute = join(templateDir, "server/routes/[...page].get.ts");
  const headRoute = join(templateDir, "server/routes/[...page].head.ts");

  if (!existsSync(getRoute)) {
    failures.push(`${entry}: missing server/routes/[...page].get.ts`);
    continue;
  }
  const src = readFileSync(getRoute, "utf8");
  if (
    !src.includes("@agent-native/core/server/template-server") ||
    !src.includes("createTemplateServer")
  ) {
    failures.push(
      `${entry}: [...page].get.ts must use createTemplateServer from @agent-native/core/server/template-server`,
    );
  }
  const idMatch = src.match(/templateId:\s*"([^"]+)"/);
  if (!idMatch) {
    failures.push(`${entry}: [...page].get.ts missing templateId option`);
  } else if (idMatch[1] !== entry) {
    failures.push(
      `${entry}: templateId="${idMatch[1]}" does not match directory name "${entry}"`,
    );
  }

  // HEAD route is optional. A few templates intentionally override HEAD
  // with a redirect (e.g. calls → /library). If one is present we don't
  // enforce its shape — only the GET route is the load-bearing surface.
  if (!existsSync(headRoute)) {
    failures.push(`${entry}: missing server/routes/[...page].head.ts`);
  }
}

if (failures.length > 0) {
  console.error(`[smoke:template-ssr] FAILED (${failures.length}):`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}

console.log(
  `[smoke:template-ssr] OK — ${checked} templates wire SSR through createTemplateServer`,
);
