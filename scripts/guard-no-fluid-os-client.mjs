#!/usr/bin/env node
/**
 * guard-no-fluid-os-client.mjs
 *
 * Item C1 (see docs/qa-reports/architectural-items.html) deleted the per-template
 * `fluid-os-client.ts` shim — the legacy bearer-token HTTP client that minted a
 * `FLUID_OS_TOKEN` and POSTed to a standalone fluid-os host. Cross-app capability
 * calls now go through `callCapability` from `@agent-native/core/server`, which
 * routes via the dispatch broker with a short-TTL signed identity header.
 *
 * This guard fails the build if anyone re-introduces:
 *
 *   - a file named `fluid-os-client.ts` anywhere in the tree
 *   - an import of `fluid-os-client` from any source file
 *   - a reference to the `FLUID_OS_TOKEN` env var (any source file)
 *
 * Historical mentions inside `docs/qa-reports/` are intentionally allowed —
 * those are immutable QA dossiers describing the state before the migration.
 */

import { readdir, stat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".turbo",
  ".cache",
  ".next",
  ".output",
  ".nitro",
  ".nuxt",
  ".vite",
  "coverage",
  ".changeset",
]);

// Paths whose contents are exempt (historical QA record + this guard itself).
const ALLOWED_PREFIXES = [
  path.join("docs", "qa-reports"),
  path.join("scripts", "guard-no-fluid-os-client.mjs"),
  // The root package.json registers this guard script by name.
  "package.json",
  ".changeset",
];

// File extensions we scan for code-level references.
const SCAN_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".mdx",
  ".json",
  ".yml",
  ".yaml",
  ".env",
  ".example",
]);

const FAIL_MESSAGE = `fluid-os-client.ts is the deprecated cross-app HTTP client (Phase 5 WIP). Use callCapability from @agent-native/core/server instead. See docs/qa-reports/architectural-items.html Item C.`;

function isAllowed(relPath) {
  return ALLOWED_PREFIXES.some((prefix) => relPath.startsWith(prefix));
}

async function walk(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err && err.code === "ENOENT") return;
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
}

async function main() {
  const offenders = [];
  const files = [];
  await walk(REPO_ROOT, files);

  for (const abs of files) {
    const rel = path.relative(REPO_ROOT, abs);

    // 1. File name match — `fluid-os-client.ts` anywhere is forbidden.
    if (path.basename(abs) === "fluid-os-client.ts") {
      offenders.push({ file: rel, reason: "file named fluid-os-client.ts" });
      continue;
    }

    if (isAllowed(rel)) continue;

    const ext = path.extname(abs);
    if (!SCAN_EXTS.has(ext)) continue;

    let src;
    try {
      src = await readFile(abs, "utf-8");
    } catch {
      continue;
    }

    if (src.includes("fluid-os-client")) {
      offenders.push({
        file: rel,
        reason: "imports / mentions fluid-os-client",
      });
    }
    if (src.includes("FLUID_OS_TOKEN")) {
      offenders.push({ file: rel, reason: "references FLUID_OS_TOKEN" });
    }
  }

  if (offenders.length === 0) {
    console.log(
      "[guard-no-fluid-os-client] OK — no fluid-os-client.ts files or FLUID_OS_TOKEN references outside docs/qa-reports/.",
    );
    return;
  }

  console.error("");
  console.error("[guard-no-fluid-os-client] FAIL");
  console.error("");
  console.error(FAIL_MESSAGE);
  console.error("");
  console.error("Offending files:");
  for (const o of offenders) {
    console.error(`  - ${o.file}  (${o.reason})`);
  }
  console.error("");
  process.exit(1);
}

main().catch((err) => {
  console.error("[guard-no-fluid-os-client] crashed:", err);
  process.exit(2);
});
