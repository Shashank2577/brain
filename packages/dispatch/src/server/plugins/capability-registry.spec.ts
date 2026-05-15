/**
 * Unit tests for the capability-registry plugin (Phase 1).
 *
 * These tests use only the helpers (`buildRegistry`, `dispatchCapability`,
 * `actionToCapability`) so we don't need to spin up Nitro for each scenario.
 * The plugin factory itself is exercised by integration tests in a later phase.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import nodePath from "node:path";
import { z } from "zod";
import { defineAction } from "@agent-native/core";
import {
  runWithRequestContext,
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server";
import {
  actionToCapability,
  buildRegistry,
  dispatchCapability,
  discoverTemplatesDir,
  scanTemplatesForCapabilities,
  type ActionLike,
} from "./capability-registry.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tempRoots: string[] = [];

afterEach(() => {
  for (const dir of tempRoots) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  tempRoots = [];
});

function makeTemplatesFixture(
  layout: Record<string, Record<string, string>>,
): string {
  const root = fs.mkdtempSync(nodePath.join(os.tmpdir(), "cap-registry-"));
  tempRoots.push(root);
  const templatesDir = nodePath.join(root, "templates");
  fs.mkdirSync(templatesDir, { recursive: true });
  for (const [appId, files] of Object.entries(layout)) {
    const actionsDir = nodePath.join(templatesDir, appId, "actions");
    fs.mkdirSync(actionsDir, { recursive: true });
    for (const [filename, contents] of Object.entries(files)) {
      fs.writeFileSync(nodePath.join(actionsDir, filename), contents, "utf-8");
    }
  }
  return templatesDir;
}

function fakeUser(email = "alice@demo.local") {
  return { id: email, email };
}

// ---------------------------------------------------------------------------
// Test 1 — Filesystem scan: 1 action ⇒ 1 capability with FQID
// ---------------------------------------------------------------------------

describe("scanTemplatesForCapabilities", () => {
  it("derives one capability per defineAction() export in templates/<app>/actions/", async () => {
    // We can't write a .ts source file and `import()` it dynamically without
    // a TS loader. Instead we use a fake template that exports a hand-built
    // action shape via `.js` (Node can import that directly).
    const templatesDir = makeTemplatesFixture({
      notes: {
        "create-note.js": `
          export default {
            tool: { description: "Create a note" },
            schema: undefined,
            run: async (args) => ({ id: "n1", title: args.title }),
          };
        `,
        "_helper.js": `export const helper = () => 1;`, // ignored
        "db-status.js": `export default async () => {};`, // SKIP_ACTION_FILES
      },
    });

    const scans = await scanTemplatesForCapabilities(templatesDir);
    expect(scans).toHaveLength(1);
    expect(scans[0]?.appId).toBe("notes");
    expect(Object.keys(scans[0]?.capabilities ?? {})).toEqual(["create-note"]);
  });

  it("returns empty for a directory without any usable actions", async () => {
    const templatesDir = makeTemplatesFixture({});
    const scans = await scanTemplatesForCapabilities(templatesDir);
    expect(scans).toEqual([]);
  });
});

describe("buildRegistry — filesystem path", () => {
  it("registers exactly one capability with correct FQID", async () => {
    const templatesDir = makeTemplatesFixture({
      notes: {
        "create-note.js": `
          export default {
            tool: { description: "Create a note" },
            schema: undefined,
            run: async (args) => ({ id: "n1", title: args.title ?? "untitled" }),
          };
        `,
      },
    });

    const registry = await buildRegistry({ templatesDir });
    expect(registry.listApps()).toHaveLength(1);
    expect(registry.listApps()[0]?.id).toBe("notes");

    const capabilities = registry.listCapabilities();
    expect(capabilities).toHaveLength(1);
    expect(capabilities[0]?.id).toBe("notes.create-note");

    const resolved = registry.resolve("notes.create-note");
    expect(resolved).toBeDefined();
    expect(resolved?.app.id).toBe("notes");
    expect(resolved?.capabilityId).toBe("create-note");
  });
});

// ---------------------------------------------------------------------------
// Test 2 — RPC dispatch validates input via the Zod schema
// ---------------------------------------------------------------------------

describe("dispatchCapability — input validation", () => {
  it("rejects input that doesn't match the action's Zod schema", async () => {
    const action: ActionLike = defineAction({
      description: "Create a note",
      schema: z.object({ title: z.string() }),
      run: async (args) => ({ id: "n1", title: args.title }),
    });

    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: { "notes.create-note": action },
    });

    const result = await dispatchCapability({
      registry,
      fqid: "notes.create-note",
      input: { title: 42 }, // wrong type
      user: fakeUser(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_input");
      // Zod surfaces a descriptive message. Just make sure SOMETHING about
      // the bad field shows up so the agent can self-correct.
      expect(result.error.message.toLowerCase()).toMatch(/title|string/);
    }
  });

  it("passes valid input through to the handler", async () => {
    const action: ActionLike = defineAction({
      description: "Create a note",
      schema: z.object({ title: z.string() }),
      run: async (args) => ({ id: "n1", title: args.title }),
    });

    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: { "notes.create-note": action },
    });

    const result = await dispatchCapability({
      registry,
      fqid: "notes.create-note",
      input: { title: "Hello" },
      user: fakeUser(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toEqual({ id: "n1", title: "Hello" });
    }
  });
});

// ---------------------------------------------------------------------------
// Test 3 — Identity propagation through ctx.call(...)
// ---------------------------------------------------------------------------

describe("dispatchCapability — identity propagation via ctx.call", () => {
  it("preserves userEmail / orgId across nested ctx.call invocations", async () => {
    let observedEmail: string | undefined;
    let observedOrgId: string | undefined;

    // Inner capability captures the live ALS values when it runs.
    const innerAction: ActionLike = {
      tool: { description: "capture identity" },
      run: async () => {
        observedEmail = getRequestUserEmail();
        observedOrgId = getRequestOrgId();
        return { observed: true };
      },
    };

    // Outer capability calls the inner one via ctx.call(...) — without our
    // ALS-aware dispatcher, the nested handler would see undefined.
    const outerAction: ActionLike = {
      tool: { description: "outer that calls inner" },
      run: async (_args, ctx) => {
        if (!ctx?.call) throw new Error("ctx.call missing");
        return await ctx.call("notes.capture", {});
      },
    };

    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: {
        "notes.capture": innerAction,
        "tasks.outer": outerAction,
      },
    });

    const result = await runWithRequestContext(
      { userEmail: "alice@demo.local", orgId: "org_42" },
      async () =>
        dispatchCapability({
          registry,
          fqid: "tasks.outer",
          input: {},
          user: fakeUser("alice@demo.local"),
        }),
    );

    expect(result.ok).toBe(true);
    expect(observedEmail).toBe("alice@demo.local");
    expect(observedOrgId).toBe("org_42");
  });
});

// ---------------------------------------------------------------------------
// Test 4 — Non-existent capability returns an error envelope
// ---------------------------------------------------------------------------

describe("dispatchCapability — unknown capability and self-cycle", () => {
  it("returns a structured error envelope for an unknown FQID via ctx.call", async () => {
    let nestedError: { code?: string; message: string } | null = null;

    const action: ActionLike = {
      tool: { description: "tries to call a non-existent target" },
      run: async (_args, ctx) => {
        try {
          await ctx.call("nope.missing", {});
        } catch (err) {
          const e = err as Error & {
            code?: string;
            envelope?: { ok: false; error: { code: string; message: string } };
          };
          nestedError = { code: e.code, message: e.message };
        }
        return { handled: true };
      },
    };

    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: { "tasks.outer": action },
    });

    const result = await dispatchCapability({
      registry,
      fqid: "tasks.outer",
      input: {},
      user: fakeUser(),
    });

    expect(result.ok).toBe(true); // outer handler completed
    expect(nestedError).toBeTruthy();
    expect(nestedError?.code).toBe("unknown_capability");
    expect(nestedError?.message).toMatch(/nope\.missing/);
  });

  it("returns a top-level error envelope for unknown FQID at the entry point", async () => {
    const registry = await buildRegistry({ templatesDir: "" });
    const result = await dispatchCapability({
      registry,
      fqid: "missing.cap",
      input: {},
      user: fakeUser(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unknown_capability");
    }
  });

  it("detects a simple self-call cycle (A → A)", async () => {
    let recursiveError: { code?: string; message: string } | null = null;

    const action: ActionLike = {
      tool: { description: "calls itself" },
      run: async (_args, ctx) => {
        try {
          await ctx.call("tasks.loop", {});
        } catch (err) {
          const e = err as Error & { code?: string };
          recursiveError = { code: e.code, message: e.message };
        }
        return { ok: true };
      },
    };

    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: { "tasks.loop": action },
    });

    const result = await dispatchCapability({
      registry,
      fqid: "tasks.loop",
      input: {},
      user: fakeUser(),
    });

    expect(result.ok).toBe(true);
    expect(recursiveError?.code).toBe("cycle_detected");
  });
});

// ---------------------------------------------------------------------------
// Test 5 — actionToCapability normalizes the defineAction() shape
// ---------------------------------------------------------------------------

describe("actionToCapability", () => {
  it("uses the action's tool.description when present", () => {
    const action: ActionLike = {
      tool: { description: "Tool desc" },
      run: async () => "ok",
    };
    const cap = actionToCapability(action, "fallback");
    expect(cap.description).toBe("Tool desc");
  });

  it("falls back to the provided default description when action has none", () => {
    const action: ActionLike = { run: async () => "ok" };
    const cap = actionToCapability(action, "fallback desc");
    expect(cap.description).toBe("fallback desc");
  });

  it("uses z.any() when no schema is attached", async () => {
    const action: ActionLike = {
      tool: { description: "no schema" },
      run: async (args) => args,
    };
    const cap = actionToCapability(action, "default");
    const parsed = cap.input.safeParse({ anything: "goes" });
    expect(parsed.success).toBe(true);
  });

  it("preserves the action's Zod schema for validation", () => {
    const action: ActionLike = defineAction({
      description: "needs title",
      schema: z.object({ title: z.string() }),
      run: async (args) => args,
    });
    const cap = actionToCapability(action, "fallback");
    const bad = cap.input.safeParse({ title: 7 });
    expect(bad.success).toBe(false);
    const good = cap.input.safeParse({ title: "hi" });
    expect(good.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 6 — discoverTemplatesDir
// ---------------------------------------------------------------------------

describe("discoverTemplatesDir", () => {
  it("locates the templates/ directory at the workspace root", () => {
    // The dispatch package lives at packages/dispatch/, so the workspace
    // root must be reachable two levels up. This sanity check verifies the
    // production-default path resolves a real directory rather than null.
    const dir = discoverTemplatesDir(__dirname);
    expect(dir).toBeTruthy();
    expect(dir).toMatch(/templates$/);
    expect(fs.existsSync(dir!)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 7 — Bonus: staticCapabilities and templates merge cleanly
// ---------------------------------------------------------------------------

describe("buildRegistry — static + filesystem merge", () => {
  it("layers staticCapabilities on top of filesystem scan results", async () => {
    const templatesDir = makeTemplatesFixture({
      notes: {
        "create-note.js": `
          export default {
            tool: { description: "FS-derived note creator" },
            run: async () => ({ id: "fs" }),
          };
        `,
      },
    });

    const registry = await buildRegistry({
      templatesDir,
      staticCapabilities: {
        "tasks.create": {
          tool: { description: "static-only task creator" },
          run: async () => ({ id: "task" }),
        },
      },
    });

    const appIds = registry.listApps().map((a) => a.id);
    expect(appIds).toEqual(expect.arrayContaining(["notes", "tasks"]));

    const fqids = registry.listCapabilities().map((c) => c.id);
    expect(fqids).toEqual(
      expect.arrayContaining(["notes.create-note", "tasks.create"]),
    );
  });
});
