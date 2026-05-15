#!/usr/bin/env node
/**
 * guard-no-fluid-os-host.mjs
 *
 * Phase 4 (os-shell branch) deleted the standalone fluid-os HTTP host that
 * used to run on port 4100, along with the React shell, the legacy identity
 * provider, the github-OAuth auth helpers, the host-only agent client, and
 * the manifest-only example apps. The capability registry + RPC layer now
 * live inside the dispatch Nitro server as a plugin (see ADR-004 +
 * `docs/delivery/phase-4-cleanup.md`).
 *
 * This guard fails the build if anyone re-introduces files under any of the
 * deleted paths. The library surface that survives ships from:
 *
 *   packages/fluid-os/src/index.ts
 *   packages/fluid-os/src/manifest/
 *   packages/fluid-os/src/registry.ts
 *   packages/fluid-os/src/rpc/
 *   packages/fluid-os/src/scaffold/
 *
 * Anything under `packages/fluid-os/{examples,src/host,src/auth,src/identity,src/agent,src/shell}/`
 * is forbidden.
 */

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const FLUID_OS_ROOT = path.join(REPO_ROOT, "packages", "fluid-os");

// Directories that must not exist (relative to packages/fluid-os/).
const FORBIDDEN_RELATIVE_DIRS = [
  "examples",
  "src/host",
  "src/auth",
  "src/identity",
  "src/agent",
  "src/shell",
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".turbo",
  ".cache",
]);

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
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
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(path.join(dir, entry.name), out);
    } else if (entry.isFile()) {
      out.push(path.join(dir, entry.name));
    }
  }
}

async function main() {
  const offenders = [];

  // Bail out cheaply if the package itself isn't here (e.g. shallow clone).
  if (!(await exists(FLUID_OS_ROOT))) {
    return;
  }

  for (const rel of FORBIDDEN_RELATIVE_DIRS) {
    const abs = path.join(FLUID_OS_ROOT, rel);
    if (await exists(abs)) {
      const found = [];
      await walk(abs, found);
      // Even an empty directory should be reported — recreating the folder
      // itself signals intent to reintroduce host code.
      if (found.length === 0) {
        offenders.push({ dir: rel, file: "(empty directory present)" });
      } else {
        for (const f of found) {
          offenders.push({ dir: rel, file: path.relative(FLUID_OS_ROOT, f) });
        }
      }
    }
  }

  if (offenders.length === 0) {
    console.log(
      "[guard-no-fluid-os-host] OK — no forbidden host / shell / identity / auth / agent / examples paths.",
    );
    return;
  }

  console.error("");
  console.error(
    "[guard-no-fluid-os-host] FAIL — the fluid-os package is library-only after Phase 4.",
  );
  console.error("");
  console.error("Forbidden paths under packages/fluid-os/:");
  for (const rel of FORBIDDEN_RELATIVE_DIRS) {
    console.error(`  - ${rel}/`);
  }
  console.error("");
  console.error("Offending files (path is relative to packages/fluid-os/):");
  for (const o of offenders) {
    console.error(`  [${o.dir}] ${o.file}`);
  }
  console.error("");
  console.error(
    "If you need to add functionality the host used to provide, wire it as a",
  );
  console.error(
    "dispatch plugin instead — see packages/dispatch/src/server/plugins/",
  );
  console.error("capability-registry.ts and docs/delivery/phase-4-cleanup.md.");
  process.exit(1);
}

main().catch((err) => {
  console.error("[guard-no-fluid-os-host] crashed:", err);
  process.exit(2);
});
