/**
 * Capability Registry + RPC plugin for the dispatch Nitro server.
 *
 * Phase 1 (see docs/delivery/phase-1-backend-foundation.md): the registry that
 * used to live in `packages/fluid-os/examples/host/server.ts` is now a regular
 * dispatch plugin. It auto-derives capabilities from every template's
 * `actions/*.ts` files at boot, so every `defineAction({ description, schema,
 * run })` export becomes an FQID-addressable capability.
 *
 * Exposes three HTTP endpoints under `/_agent-native/registry/`:
 *
 *   GET  /_agent-native/registry/apps          — list of mini-apps with capability counts
 *   GET  /_agent-native/registry/capabilities  — FQID list with JSON Schema input shapes
 *   POST /_agent-native/registry/rpc           — inter-app dispatch with identity propagation
 *
 * Identity propagation: instead of the fluid-os JWT mint-and-verify dance, the
 * RPC handler reads the caller's workspace session cookie via `getSession()`
 * and runs every action under `runWithRequestContext({ userEmail, orgId })`.
 * Nested `ctx.call(...)` invocations stay inside the same ALS scope so a deck
 * created by `tasks → ctx.call("notes.create", ...)` lands with
 * `ownerEmail = currentUser`, not `ownerEmail = "tasks"`.
 *
 * We re-use `CapabilityRegistry` from `@agent-native/fluid-os/registry`
 * unchanged — it's already a well-tested in-memory FQID resolver. Phase 4
 * deletes the rest of the fluid-os HTTP host; this plugin imports only the
 * library bits.
 */
import fs from "node:fs";
import nodePath from "node:path";
import { z } from "zod";
import {
  defineEventHandler,
  setResponseStatus,
  getMethod,
  getCookie,
  type H3Event,
} from "h3";
import {
  CapabilityRegistry,
  type ResolvedCapability,
} from "@agent-native/fluid-os/registry";
import type {
  AppManifest,
  CapabilityDef,
  CapabilityContext,
  OsUser,
} from "@agent-native/fluid-os/manifest";
import {
  awaitBootstrap,
  getH3App,
  getSession,
  readBody,
  runWithRequestContext,
  type NitroPluginDef,
} from "@agent-native/core/server";
import { TEMPLATES } from "@agent-native/core/cli/templates-meta";

/**
 * Build the default `appMetadata` map keyed by template id so the registry's
 * `/apps` response carries each app's declared Tabler icon / label /
 * description. Without this, every app comes back with `icon: null` and the
 * SuperAppRail falls back to a deterministic-but-collision-prone icon pool —
 * which manifested as "every app shows the same icon" in the shell.
 */
function defaultAppMetadataFromTemplates(): Record<
  string,
  { name?: string; description?: string; icon?: string; url?: string }
> {
  const out: Record<
    string,
    { name?: string; description?: string; icon?: string; url?: string }
  > = {};
  for (const tpl of TEMPLATES) {
    out[tpl.name] = {
      name: tpl.label,
      description: tpl.description ?? tpl.hint,
      icon: tpl.icon,
    };
  }
  return out;
}

/**
 * Set of template ids whose `hidden: true` flag means they MUST NOT surface
 * in user-facing pickers — including the dispatch SuperAppRail. The registry
 * still registers their capabilities (other apps may legitimately call them
 * via `ctx.call(...)`), but `/registry/apps` strips them so the shell rail
 * doesn't leak templates that the docs/CLI allow-list also excludes. Same
 * contract as `scripts/guard-template-list.mjs`.
 */
const HIDDEN_TEMPLATE_IDS: ReadonlySet<string> = new Set(
  TEMPLATES.filter((t) => t.hidden).map((t) => t.name),
);

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Shape of an exported `defineAction()` object. We accept it structurally so
 * the registry tolerates both `schema:`-form actions (Zod / Standard Schema)
 * and `parameters:`-form legacy actions. `schema` is optional — without it we
 * fall back to passing inputs through `z.any()`.
 */
export interface ActionLike {
  tool?: {
    description?: string;
    parameters?: Record<string, unknown>;
  };
  run: (args: any, ctx?: any) => unknown | Promise<unknown>;
  schema?: { ["~standard"]?: unknown } | z.ZodTypeAny;
  http?: unknown;
  readOnly?: boolean;
}

export interface CapabilityRegistryPluginOptions {
  /**
   * Absolute path to the directory that contains `templates/*` directories.
   * Defaults to the discovered workspace root + `/templates`. Tests use this
   * to point at a fake templates layout.
   */
  templatesDir?: string;
  /**
   * Pre-built record of FQID → action. When provided we skip the filesystem
   * scan entirely and register from this map. Used by unit tests and by the
   * future build-time `.generated/capabilities.json` path.
   *
   * Keys are `<appId>.<capabilityId>`; values are the raw action export
   * (anything `actionToCapability` can normalise).
   */
  staticCapabilities?: Record<string, ActionLike>;
  /**
   * Resolve the calling session for an HTTP request. Tests override this with
   * a stub so they don't need to spin up Better Auth.
   */
  resolveSession?: (
    event: H3Event,
  ) => Promise<{ email?: string; orgId?: string; name?: string } | null>;
  /**
   * When the caller's session can't be resolved, allow the request anyway and
   * propagate an undefined `userEmail`. Defaults to `false` (return 401). The
   * future workspace shell relies on the default; tests opt-in by passing
   * `true` for inline scenarios where the cookie path is mocked elsewhere.
   */
  allowUnauthenticated?: boolean;
  /**
   * Override the default registry (used by tests to inspect contents).
   */
  registry?: CapabilityRegistry;
  /**
   * App metadata overrides keyed by appId. Lets dispatch surface friendlier
   * names / descriptions for first-party templates without making the scan
   * read every template's package.json.
   */
  appMetadata?: Record<
    string,
    {
      name?: string;
      description?: string;
      icon?: string;
      url?: string;
    }
  >;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REGISTRY_ROUTE_PREFIX = "/_agent-native/registry";
const APPS_ROUTE = `${REGISTRY_ROUTE_PREFIX}/apps`;
const CAPABILITIES_ROUTE = `${REGISTRY_ROUTE_PREFIX}/capabilities`;
const RPC_ROUTE = `${REGISTRY_ROUTE_PREFIX}/rpc`;

const WORKSPACE_COOKIE = "an_session_workspace";

const SKIP_ACTION_FILES = new Set([
  "helpers",
  "run",
  "db-connect",
  "db-status",
  "db-health",
  "registry",
]);

// ---------------------------------------------------------------------------
// Singleton accessor — exported so other dispatch code (and tests) can read
// the live registry the running plugin booted.
// ---------------------------------------------------------------------------

let activeRegistry: CapabilityRegistry | null = null;

export function getCapabilityRegistry(): CapabilityRegistry | null {
  return activeRegistry;
}

// ---------------------------------------------------------------------------
// Conversion: a `defineAction()` export → fluid-os `CapabilityDef`
// ---------------------------------------------------------------------------

function isZodSchema(value: unknown): value is z.ZodTypeAny {
  if (!value || typeof value !== "object") return false;
  if ((value as { ["~standard"]?: unknown })["~standard"]) return true;
  // Zod schemas have `_def` (v3) or `_zod` (v4)
  return (
    "_def" in (value as Record<string, unknown>) ||
    "_zod" in (value as Record<string, unknown>)
  );
}

/**
 * Convert one action export into a fluid-os `CapabilityDef`. We don't have
 * authoritative output schemas from `defineAction()`, so we use `z.any()` for
 * `output` — the registry uses input validation strictly, and treats output
 * as the action handler's pass-through return value.
 *
 * The `handler` closure runs the underlying action's `run()` and ignores
 * `ctx.user` / `ctx.caller` from the fluid-os shape, because identity has
 * already been pushed onto the `runWithRequestContext` ALS scope by the
 * caller (`dispatchCapability`). Actions read `getRequestUserEmail()` /
 * `getRequestOrgId()` directly.
 */
export function actionToCapability(
  action: ActionLike,
  fallbackDescription: string,
): CapabilityDef {
  const input = isZodSchema(action.schema)
    ? (action.schema as z.ZodTypeAny)
    : z.any();
  const description = action.tool?.description?.trim() || fallbackDescription;

  return {
    description,
    input,
    output: z.any(),
    handler: async (args: unknown, ctx: CapabilityContext) => {
      // The action's `run()` is the canonical implementation. We pass both
      // the already-validated input AND the capability context — production
      // `defineAction()` exports ignore the second arg (their `run` signature
      // is `(args) => ...`), but tests and any future ctx-aware actions
      // (cross-app calls, agent escalation) read it directly.
      //
      // Identity already lives on the AsyncLocalStorage scope set up by
      // `runWithRequestContext` in the HTTP handler / outer dispatch — the
      // production `defineAction()` `run` reads `getRequestUserEmail()` and
      // friends through that scope, so we never have to wire `user` through
      // the call signature.
      return await action.run(args as Record<string, unknown>, ctx);
    },
  };
}

// ---------------------------------------------------------------------------
// Filesystem scan: discover templates and import their `actions/*.ts` files
// ---------------------------------------------------------------------------

/**
 * Walk up from `startDir` until we find one of:
 *   - a directory containing `templates/` AND a `pnpm-workspace.yaml`
 *   - a directory containing `templates/` AND a `package.json` whose
 *     `agent-native.workspaceCore` is set
 *
 * Returns the workspace root path or `null` if we never find one.
 */
export function discoverTemplatesDir(
  startDir: string = process.cwd(),
): string | null {
  let dir = nodePath.resolve(startDir);
  for (let depth = 0; depth < 20; depth += 1) {
    const templates = nodePath.join(dir, "templates");
    const hasTemplates = safeIsDirectory(templates);
    if (hasTemplates) {
      const hasWorkspaceYaml = fs.existsSync(
        nodePath.join(dir, "pnpm-workspace.yaml"),
      );
      const pkgPath = nodePath.join(dir, "package.json");
      let hasWorkspaceCore = false;
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (typeof pkg?.["agent-native"]?.workspaceCore === "string") {
          hasWorkspaceCore = true;
        }
      } catch {
        // ignore — package.json absent or malformed
      }
      if (hasWorkspaceYaml || hasWorkspaceCore) return templates;
    }
    const parent = nodePath.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function safeIsDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

interface TemplateScan {
  appId: string;
  capabilities: Record<string, ActionLike>;
}

/**
 * Discover every `templates/<appId>/actions/*.ts` file and import it. Returns
 * a per-app map of capabilityId → action export.
 *
 * Skips files prefixed `_` and the framework-internal helpers in
 * `SKIP_ACTION_FILES`. Import failures are logged and ignored — a CLI-style
 * top-level script throwing on import shouldn't break the whole registry.
 */
export async function scanTemplatesForCapabilities(
  templatesDir: string,
): Promise<TemplateScan[]> {
  if (!safeIsDirectory(templatesDir)) return [];

  const templateEntries = fs
    .readdirSync(templatesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  const out: TemplateScan[] = [];

  for (const entry of templateEntries) {
    const appId = entry.name;
    const actionsDir = nodePath.join(templatesDir, appId, "actions");
    if (!safeIsDirectory(actionsDir)) continue;

    const capabilities: Record<string, ActionLike> = {};
    const files = fs
      .readdirSync(actionsDir)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".js"))
      .filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".spec.ts"))
      .filter((f) => !f.endsWith(".d.ts"))
      .filter((f) => {
        const name = f.replace(/\.(ts|js)$/, "");
        if (name.startsWith("_")) return false;
        if (SKIP_ACTION_FILES.has(name)) return false;
        return true;
      });

    for (const file of files) {
      const capabilityId = file.replace(/\.(ts|js)$/, "");
      const filePath = nodePath.join(actionsDir, file);
      try {
        const mod = await import(/* @vite-ignore */ filePath);
        const action = extractActionFromModule(mod);
        if (action) capabilities[capabilityId] = action;
      } catch (err) {
        // CLI-style scripts and broken imports are common at the edges —
        // log once and keep going so one bad file doesn't blank the registry.
        console.warn(
          `[capability-registry] Failed to import ${appId}/${file}: ${(err as Error).message}`,
        );
      }
    }

    if (Object.keys(capabilities).length > 0) {
      out.push({ appId, capabilities });
    }
  }

  return out;
}

function extractActionFromModule(mod: unknown): ActionLike | null {
  if (!mod || typeof mod !== "object") return null;
  const candidate = (mod as { default?: unknown }).default ?? mod;
  if (
    candidate &&
    typeof candidate === "object" &&
    typeof (candidate as ActionLike).run === "function"
  ) {
    return candidate as ActionLike;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Build an AppManifest from a scanned template (so we can register it in the
// fluid-os CapabilityRegistry).
// ---------------------------------------------------------------------------

function titleCase(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildManifestFor(
  scan: TemplateScan,
  metadata: CapabilityRegistryPluginOptions["appMetadata"],
): AppManifest {
  const meta = metadata?.[scan.appId];
  const name = meta?.name ?? titleCase(scan.appId);
  const description =
    meta?.description ??
    `Auto-derived capabilities for the ${scan.appId} mini-app.`;
  const url = meta?.url ?? `/${scan.appId}`;

  const capabilities: Record<string, CapabilityDef> = {};
  for (const [capId, action] of Object.entries(scan.capabilities)) {
    // `defineApp` (from fluid-os) requires lower-kebab IDs. Most actions
    // already follow that convention; we skip anything that doesn't rather
    // than mutating the name and lying about it.
    if (!/^[a-z][a-z0-9-]*$/.test(capId)) {
      console.warn(
        `[capability-registry] Skipping ${scan.appId}.${capId} — non-kebab capability id`,
      );
      continue;
    }
    capabilities[capId] = actionToCapability(
      action,
      `${scan.appId}.${capId} action`,
    );
  }

  return {
    id: scan.appId,
    name,
    description,
    icon: meta?.icon,
    url,
    capabilities,
  };
}

// ---------------------------------------------------------------------------
// Build the registry (used by the plugin AND by unit tests directly)
// ---------------------------------------------------------------------------

/**
 * Build (or re-use) a CapabilityRegistry from scanned templates and/or a
 * caller-provided static map. The returned registry is the same instance the
 * plugin keeps for HTTP requests, so callers can inspect it before booting.
 *
 * Resolution order when both inputs are present:
 *   1. Filesystem scan registers first (templates own their own capabilities).
 *   2. `staticCapabilities` is layered on top — same-FQID entries override.
 */
export async function buildRegistry(
  opts: CapabilityRegistryPluginOptions = {},
): Promise<CapabilityRegistry> {
  const registry = opts.registry ?? new CapabilityRegistry();

  // Group `staticCapabilities` FQIDs by appId so each appId is registered
  // exactly once with all its capabilities — `CapabilityRegistry.register`
  // throws on duplicates.
  const staticByApp = new Map<string, Record<string, ActionLike>>();
  if (opts.staticCapabilities) {
    for (const [fqid, action] of Object.entries(opts.staticCapabilities)) {
      const dot = fqid.indexOf(".");
      if (dot <= 0) continue;
      const appId = fqid.slice(0, dot);
      const capId = fqid.slice(dot + 1);
      const bucket = staticByApp.get(appId) ?? {};
      bucket[capId] = action;
      staticByApp.set(appId, bucket);
    }
  }

  // 1. Filesystem scan. The default-undefined case discovers the workspace
  //    `templates/` root; tests pass a fake dir, while the production plugin
  //    relies on the default. Set `templatesDir: ""` to skip the scan entirely
  //    (used by unit tests that only register static capabilities).
  const templatesDir =
    opts.templatesDir === undefined
      ? discoverTemplatesDir()
      : opts.templatesDir || null;
  if (templatesDir) {
    const scans = await scanTemplatesForCapabilities(templatesDir);
    for (const scan of scans) {
      // Merge any static capabilities that target this same appId now so we
      // register once.
      const extras = staticByApp.get(scan.appId);
      if (extras) {
        for (const [capId, action] of Object.entries(extras)) {
          scan.capabilities[capId] = action;
        }
        staticByApp.delete(scan.appId);
      }
      try {
        registry.register(buildManifestFor(scan, opts.appMetadata));
      } catch (err) {
        // `register` only throws on duplicate app IDs (HMR re-imports, etc.).
        // Stay non-fatal so the rest of the registry still boots.
        console.warn(
          `[capability-registry] Could not register ${scan.appId}: ${(err as Error).message}`,
        );
      }
    }
  }

  // 2. Static-only apps that the scan didn't cover (or were not on disk).
  for (const [appId, capabilities] of staticByApp) {
    try {
      registry.register(
        buildManifestFor({ appId, capabilities }, opts.appMetadata),
      );
    } catch (err) {
      console.warn(
        `[capability-registry] Could not register ${appId}: ${(err as Error).message}`,
      );
    }
  }

  return registry;
}

// ---------------------------------------------------------------------------
// RPC dispatch + identity propagation
// ---------------------------------------------------------------------------

/**
 * Result envelope used by both the HTTP `POST /registry/rpc` endpoint and the
 * in-process `ctx.call(...)` path inside an action handler. Mirrors the
 * fluid-os `RpcResponse` shape so existing clients keep working.
 */
export type RegistryRpcResponse<T = unknown> =
  | { ok: true; output: T }
  | { ok: false; error: { code: string; message: string } };

interface DispatchOpts {
  registry: CapabilityRegistry;
  fqid: string;
  input: unknown;
  user: OsUser;
  /**
   * Tracks the in-flight FQIDs so we can detect simple A → A self-calls and
   * surface an actionable error. Multi-hop cycle detection is out of scope
   * (see phase-1 doc — deferred).
   */
  callStack?: ReadonlySet<string>;
}

/**
 * Validate input, run the target capability's handler, return an envelope.
 * Always invoked inside an active `runWithRequestContext` scope; the handler
 * therefore sees the right `getRequestUserEmail()` value even when the action
 * spawns its own async work.
 */
export async function dispatchCapability(
  opts: DispatchOpts,
): Promise<RegistryRpcResponse> {
  const { registry, fqid, input, user } = opts;
  const resolved = registry.resolve(fqid);
  if (!resolved) {
    return {
      ok: false,
      error: {
        code: "unknown_capability",
        message: `Capability "${fqid}" not found`,
      },
    };
  }

  const callStack = opts.callStack ?? new Set<string>();
  if (callStack.has(fqid)) {
    return {
      ok: false,
      error: {
        code: "cycle_detected",
        message: `Cycle detected: ${[...callStack, fqid].join(" → ")}`,
      },
    };
  }

  const parsed = resolved.def.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: parsed.error.message,
      },
    };
  }

  const nextStack = new Set(callStack);
  nextStack.add(fqid);
  const ctx = makeCapabilityContext(registry, resolved, user, nextStack);

  try {
    const output = await resolved.def.handler(parsed.data, ctx);
    return { ok: true, output };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "handler_error",
        message: (err as Error).message,
      },
    };
  }
}

function makeCapabilityContext(
  registry: CapabilityRegistry,
  resolved: ResolvedCapability,
  user: OsUser,
  callStack: ReadonlySet<string>,
): CapabilityContext {
  return {
    user,
    caller: { appId: resolved.app.id },
    call: async <O = unknown>(fqid: string, input: unknown) => {
      const result: RegistryRpcResponse = await dispatchCapability({
        registry,
        fqid,
        input,
        user,
        callStack,
      });
      if (result.ok === false) {
        const err = new Error(result.error.message) as Error & {
          code?: string;
          envelope?: RegistryRpcResponse;
        };
        err.code = result.error.code;
        err.envelope = result;
        throw err;
      }
      return result.output as O;
    },
    agent: async () => {
      // Agent delegation is provided by the dispatch agent-chat plugin, which
      // mounts its own routes. The capability registry intentionally doesn't
      // expose a model directly — actions that need LLM work call the agent
      // chat via `sendToAgentChat()` (see delegate-to-agent skill).
      throw new Error(
        "ctx.agent() is not available from the capability registry; call the agent-chat endpoint instead.",
      );
    },
  };
}

// ---------------------------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------------------------

function jsonError(
  event: H3Event,
  status: number,
  code: string,
  message: string,
): RegistryRpcResponse {
  setResponseStatus(event, status);
  return { ok: false, error: { code, message } };
}

/**
 * Resolve the calling session from an HTTP event.
 *
 * Resolution order (Phase 8 / ADR-006, post-P0 #8):
 *   1. Test override (`opts.resolveSession`) — unit tests skip the chain.
 *   2. `getSession()` — handles cookie, legacy bearer, BYOA, desktop SSO,
 *      and (since P0 #8) the mobile bearer JWT. Before the fix, this
 *      function verified the mobile JWT itself; that resolver moved INTO
 *      `getSession()` so the framework-global 401 guard accepts mobile
 *      requests too. The guard calls `getSession()` first and 401s when
 *      it returns null — which is exactly what was breaking every mobile
 *      request on all 13 templates.
 */
async function readSessionForEvent(
  event: H3Event,
  opts: CapabilityRegistryPluginOptions,
): Promise<{ email?: string; orgId?: string; name?: string } | null> {
  if (opts.resolveSession) return opts.resolveSession(event);

  // Workspace SSO cookie / mobile bearer JWT / legacy bearer / desktop SSO
  // are all resolved by `getSession()` now — see core/server/auth.ts.
  try {
    const session = await getSession(event);
    if (!session) {
      // Last-ditch sanity: log whether the workspace cookie is on the wire
      // so debugging an empty session is faster. Only logs in dev to keep
      // production logs clean.
      if (process.env.NODE_ENV !== "production") {
        const wsCookie = getCookie(event, WORKSPACE_COOKIE);
        if (wsCookie) {
          console.warn(
            "[capability-registry] Workspace cookie present but getSession returned null. Auth may be misconfigured.",
          );
        }
      }
      return null;
    }
    return {
      email: session.email,
      orgId: session.orgId,
      name: session.name,
    };
  } catch (err) {
    console.warn(
      `[capability-registry] getSession failed: ${(err as Error).message}`,
    );
    return null;
  }
}

function buildAppsHandler(registry: CapabilityRegistry) {
  return defineEventHandler(() => {
    return {
      apps: registry
        .listApps()
        // Hidden templates (calls, meeting-notes, voice, scheduling, issues,
        // recruiting, images, macros) are first-party but intentionally not
        // surfaced in user-facing pickers. The rail / shell consumes this
        // endpoint, so the filter has to live here, not in the rail —
        // otherwise every consumer would have to re-implement the allow-list.
        .filter((app) => !HIDDEN_TEMPLATE_IDS.has(app.id))
        .map((app) => ({
          id: app.id,
          name: app.name,
          description: app.description,
          icon: app.icon ?? null,
          url: app.url,
          capabilities: Object.keys(app.capabilities ?? {}).length,
        })),
    };
  });
}

function buildCapabilitiesHandler(registry: CapabilityRegistry) {
  return defineEventHandler(() => {
    const out: Array<{
      id: string;
      appId: string;
      description: string;
      input: unknown;
    }> = [];
    for (const app of registry.listApps()) {
      for (const [capId, def] of Object.entries(app.capabilities ?? {})) {
        out.push({
          id: `${app.id}.${capId}`,
          appId: app.id,
          description: def.description,
          input: zodToJsonSchema(def.input),
        });
      }
    }
    return { capabilities: out };
  });
}

/**
 * Best-effort Zod → JSON Schema conversion for the client-tooling response.
 * Modern Zod v4 exposes a Standard Schema bridge with `~standard.jsonSchema`;
 * we use it when available and fall back to a minimal `{}` shape otherwise.
 * The RPC dispatcher does its own runtime validation via `safeParse`, so this
 * is purely informational.
 */
function zodToJsonSchema(schema: z.ZodTypeAny): unknown {
  const std = (schema as { ["~standard"]?: { jsonSchema?: any } })["~standard"];
  if (std?.jsonSchema?.input) {
    try {
      const result = std.jsonSchema.input({ target: "draft-07" });
      if (result && typeof result === "object") {
        delete (result as Record<string, unknown>).$schema;
        return result;
      }
    } catch {
      // fall through
    }
  }
  return {};
}

function buildRpcHandler(
  registry: CapabilityRegistry,
  opts: CapabilityRegistryPluginOptions,
) {
  return defineEventHandler(async (event) => {
    if (getMethod(event) !== "POST") {
      return jsonError(event, 405, "method_not_allowed", "POST required");
    }

    let body: { capability?: string; input?: unknown } | null = null;
    try {
      body = (await readBody(event)) as {
        capability?: string;
        input?: unknown;
      };
    } catch {
      return jsonError(event, 400, "invalid_body", "Body must be JSON");
    }
    if (!body?.capability || typeof body.capability !== "string") {
      return jsonError(
        event,
        400,
        "missing_capability",
        'Field `capability` is required (e.g. "slides.list-decks")',
      );
    }

    const session = await readSessionForEvent(event, opts);
    const userEmail = session?.email;
    if (!userEmail && !opts.allowUnauthenticated) {
      return jsonError(
        event,
        401,
        "unauthenticated",
        "Workspace session cookie required",
      );
    }

    // Synthesize an OsUser for the fluid-os context shape. `id` is the email
    // (no opaque user IDs leak across the registry boundary — the workspace
    // user table is keyed on email).
    const user: OsUser = {
      id: userEmail ?? "anonymous",
      email: userEmail ?? "anonymous",
      name: session?.name,
      orgId: session?.orgId,
    };

    const fqid = body.capability;
    const input = body.input;

    return runWithRequestContext(
      {
        userEmail,
        userName: session?.name,
        orgId: session?.orgId,
      },
      async () => {
        const result: RegistryRpcResponse = await dispatchCapability({
          registry,
          fqid,
          input,
          user,
        });
        if (result.ok === false) {
          const code = result.error.code;
          const status =
            code === "unknown_capability"
              ? 404
              : code === "invalid_input"
                ? 400
                : 500;
          setResponseStatus(event, status);
        }
        return result;
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Nitro plugin factory
// ---------------------------------------------------------------------------

/**
 * Build the dispatch capability-registry plugin. Calling without options uses
 * the production defaults (filesystem scan + workspace session cookie). Tests
 * pass `staticCapabilities` and `resolveSession` to keep the unit isolated.
 */
export function createCapabilityRegistryPlugin(
  opts: CapabilityRegistryPluginOptions = {},
): NitroPluginDef {
  // Layer template-derived metadata (icon, label, description) underneath any
  // caller-provided overrides so the production path gets correct rail icons
  // out of the box, while tests passing their own `appMetadata` still win.
  const mergedOpts: CapabilityRegistryPluginOptions = {
    ...opts,
    appMetadata: {
      ...defaultAppMetadataFromTemplates(),
      ...(opts.appMetadata ?? {}),
    },
  };
  return async (nitroApp: any) => {
    await awaitBootstrap(nitroApp);
    const registry = await buildRegistry(mergedOpts);
    activeRegistry = registry;

    const h3App = getH3App(nitroApp);
    h3App.use(APPS_ROUTE, buildAppsHandler(registry));
    h3App.use(CAPABILITIES_ROUTE, buildCapabilitiesHandler(registry));
    h3App.use(RPC_ROUTE, buildRpcHandler(registry, opts));
  };
}

/**
 * Default plugin instance — uses the discovered templates directory at boot.
 * Templates import this as `dispatchCapabilityRegistryPlugin` from
 * `@agent-native/dispatch/server`.
 */
const dispatchCapabilityRegistryPlugin: NitroPluginDef =
  createCapabilityRegistryPlugin();

export default dispatchCapabilityRegistryPlugin;
