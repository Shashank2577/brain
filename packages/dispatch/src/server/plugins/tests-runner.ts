/**
 * Phase 7 — Tests runner plugin for the dispatch shell.
 *
 * Mounts two dev-only HTTP endpoints used by the in-app `/dispatch/tests`
 * page:
 *
 *   GET  /_agent-native/tests/summary  → JSON payload from the most recent
 *                                        `bin/test-fluid-os.sh` run, read
 *                                        from `<repoRoot>/.test-results/summary.json`.
 *   POST /_agent-native/tests/run      → kicks `bin/test-fluid-os.sh` in
 *                                        a detached subprocess. Returns
 *                                        immediately so the UI can keep
 *                                        polling `summary` for results.
 *   GET  /_agent-native/tests/log?step=<name> → reads the per-step
 *                                        `<step>.log` produced by the
 *                                        runner. Best-effort plain-text
 *                                        response capped at 2 MB.
 *
 * Both endpoints are guarded by a dev-mode check. In production builds the
 * routes register 404 handlers so the surface area stays zero.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  awaitBootstrap,
  getH3App,
  type NitroPluginDef,
} from "@agent-native/core/server";
import {
  defineEventHandler,
  getQuery,
  setResponseStatus,
  setResponseHeader,
  type H3Event,
} from "h3";

const SUMMARY_ROUTE = "/_agent-native/tests/summary";
const RUN_ROUTE = "/_agent-native/tests/run";
const LOG_ROUTE = "/_agent-native/tests/log";

function isUiEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.ENABLE_TESTS_UI === "1") return true;
  return false;
}

function repoRoot(): string {
  // Walk up from cwd until we find a `bin/test-fluid-os.sh`. Works in dev
  // (cwd = workspace root) and in built dispatch templates (cwd = template
  // directory inside a workspace).
  let dir = process.cwd();
  for (let depth = 0; depth < 12; depth += 1) {
    if (fs.existsSync(path.join(dir, "bin", "test-fluid-os.sh"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fall back to cwd — the read will just fail gracefully.
  return process.cwd();
}

function summaryPath(): string {
  return path.join(repoRoot(), ".test-results", "summary.json");
}

function disabled(event: H3Event) {
  setResponseStatus(event, 404);
  return { error: "tests UI disabled" };
}

function buildSummaryHandler() {
  return defineEventHandler((event) => {
    if (!isUiEnabled()) return disabled(event);
    const file = summaryPath();
    if (!fs.existsSync(file)) {
      setResponseStatus(event, 404);
      return { error: "no run yet" };
    }
    try {
      const body = fs.readFileSync(file, "utf-8");
      setResponseHeader(event, "Content-Type", "application/json");
      return body;
    } catch (err) {
      setResponseStatus(event, 500);
      return { error: (err as Error).message };
    }
  });
}

function buildLogHandler() {
  return defineEventHandler((event) => {
    if (!isUiEnabled()) return disabled(event);
    const q = getQuery(event);
    const step = String(q.step ?? "");
    // Defence-in-depth — restrict to alphanumerics / dashes so this can't be
    // wrangled into path traversal.
    if (!/^[a-z0-9-]+$/i.test(step)) {
      setResponseStatus(event, 400);
      return { error: "invalid step" };
    }
    const file = path.join(repoRoot(), ".test-results", `${step}.log`);
    if (!fs.existsSync(file)) {
      setResponseStatus(event, 404);
      return { error: "log not found" };
    }
    try {
      const stat = fs.statSync(file);
      const max = 2 * 1024 * 1024;
      if (stat.size > max) {
        // Tail the last 2 MB so the page stays responsive.
        const fd = fs.openSync(file, "r");
        try {
          const buf = Buffer.alloc(max);
          fs.readSync(fd, buf, 0, max, stat.size - max);
          setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
          return buf.toString("utf-8");
        } finally {
          fs.closeSync(fd);
        }
      }
      const body = fs.readFileSync(file, "utf-8");
      setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
      return body;
    } catch (err) {
      setResponseStatus(event, 500);
      return { error: (err as Error).message };
    }
  });
}

function buildRunHandler() {
  return defineEventHandler((event) => {
    if (!isUiEnabled()) return disabled(event);
    const root = repoRoot();
    const script = path.join(root, "bin", "test-fluid-os.sh");
    if (!fs.existsSync(script)) {
      setResponseStatus(event, 500);
      return { error: `runner not found at ${script}` };
    }
    try {
      const child = spawn(script, [], {
        cwd: root,
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      return { ok: true, pid: child.pid ?? null };
    } catch (err) {
      setResponseStatus(event, 500);
      return { error: (err as Error).message };
    }
  });
}

const testsRunnerPlugin: NitroPluginDef = async (nitroApp: unknown) => {
  await awaitBootstrap(nitroApp as Parameters<typeof awaitBootstrap>[0]);
  const h3 = getH3App(nitroApp as Parameters<typeof getH3App>[0]);
  h3.use(SUMMARY_ROUTE, buildSummaryHandler());
  h3.use(LOG_ROUTE, buildLogHandler());
  h3.use(RUN_ROUTE, buildRunHandler());
};

export default testsRunnerPlugin;
