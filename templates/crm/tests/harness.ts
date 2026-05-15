/**
 * Test harness for CRM integration tests.
 *
 * Strategy:
 *   1. Set DATABASE_URL to an isolated in-memory SQLite **before** importing
 *      any CRM module. The core's getDb factory reads DATABASE_URL on first
 *      access — once cached, every consumer (service, manifest, actions)
 *      shares the same instance.
 *   2. Inline the migration SQL so we don't depend on the runMigrations
 *      Nitro plugin (which expects a NitroApp).
 *   3. Build a CapabilityRegistry with the real CRM manifest plus permissive
 *      stubs for mail / calendar / notes / tasks / content. Stubs record
 *      every payload to a call log.
 *   4. Wrap each invocation in `runWithRequestContext` so the service's
 *      `getRequestUserEmail()` resolves to the synthetic test user.
 *
 * That gives us end-to-end contract assertions through the same path
 * fluid-os RPC uses in production.
 */

// IMPORTANT: configure DATABASE_URL before any framework module loads.
// `:memory:` is per-connection in sqlite — using a named-in-memory URL would
// require shared cache. We use a tmp file path scoped to this Node process
// so concurrent test files don't clobber each other.
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";

const tmpDir = mkdtempSync(join(tmpdir(), "crm-test-"));
const dbPath = join(tmpDir, "crm-test.db");
process.env.DATABASE_URL = `file:${dbPath}`;

// Cleanup on process exit so /tmp doesn't fill up.
process.on("exit", () => {
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort
  }
});

// Now safe to import — the framework will see the temp file URL.
import { z } from "zod";
import {
  CapabilityRegistry,
  defineApp,
  type AppManifest,
  type CapabilityContext,
} from "@agent-native/fluid-os";
import { createClient } from "@libsql/client";
import { runWithRequestContext } from "@agent-native/core/server/request-context";

import { getDb, schema } from "../server/db/index.js";
import { crmApp } from "../server/manifest.js";

export interface StubCall {
  capability: string;
  input: unknown;
  callerAppId: string;
  user: { id: string; email: string; orgId?: string };
}

export interface TestEnv {
  registry: CapabilityRegistry;
  /** Every cross-app call observed during the test. */
  callLog: StubCall[];
  /** Programmed return values keyed by `<appId>.<capability>`. */
  stubReturns: Map<string, unknown>;
  /** Invoke a capability as a given user. Mirrors fluid-os RPC. */
  call: <O = unknown>(
    user: { id: string; email: string; orgId?: string },
    capability: string,
    input: unknown,
    callerAppId?: string,
  ) => Promise<O>;
}

const STUB_RETURN_DEFAULTS: Record<string, unknown> = {
  "mail.send-email": null, // generated per-call below to avoid alias
  "mail.find-contact": null,
  "mail.get-message": null,
  "calendar.create-event": null,
  "calendar.list-events": [],
  "calendar.get-event": null,
  "calendar.delete-event": { ok: true },
  "notes.create": null,
  "tasks.create": null,
  "content.create-document": null,
};

const STUB_APP_SURFACE: Record<string, string[]> = {
  mail: ["send-email", "find-contact", "get-message"],
  calendar: ["create-event", "list-events", "get-event", "delete-event"],
  notes: ["create"],
  tasks: ["create"],
  content: ["create-document"],
};

const STUB_NEXT_ID: Record<string, number> = {};

function nextStubId(prefix: string): string {
  STUB_NEXT_ID[prefix] = (STUB_NEXT_ID[prefix] ?? 0) + 1;
  return `${prefix}_${STUB_NEXT_ID[prefix]}`;
}

function buildStubApp(
  appId: string,
  callLog: StubCall[],
  stubReturns: Map<string, unknown>,
): AppManifest {
  const capabilities: Record<
    string,
    {
      description: string;
      input: z.ZodTypeAny;
      output: z.ZodTypeAny;
      handler: (input: any, ctx: CapabilityContext) => Promise<unknown>;
    }
  > = {};
  const surface = STUB_APP_SURFACE[appId];
  if (!surface) throw new Error(`No stub surface for "${appId}"`);

  for (const cap of surface) {
    const fqid = `${appId}.${cap}`;
    capabilities[cap] = {
      description: `Stub ${fqid}`,
      input: z.any() as z.ZodTypeAny,
      output: z.any() as z.ZodTypeAny,
      handler: async (input, ctx) => {
        callLog.push({
          capability: fqid,
          input,
          callerAppId: ctx.caller.appId,
          user: {
            id: ctx.user.id,
            email: ctx.user.email,
            orgId: ctx.user.orgId,
          },
        });
        if (stubReturns.has(fqid)) return stubReturns.get(fqid);
        const dflt = STUB_RETURN_DEFAULTS[fqid];
        if (dflt !== undefined && dflt !== null) return dflt;
        // Default — synthesize a unique id per call.
        return { id: nextStubId(`${appId}-${cap}`) };
      },
    };
  }

  return defineApp({
    id: appId,
    name: appId,
    description: `Test stub for ${appId}`,
    url: `http://stub.local/${appId}`,
    capabilities: capabilities as any,
  });
}

// -----------------------------------------------------------------------------
// Migration — applied once per process. We use the same SQL as
// server/plugins/db.ts so the schema cannot drift.
// -----------------------------------------------------------------------------

let _migrated = false;

async function runInlineMigrations() {
  if (_migrated) return;
  const client = createClient({ url: `file:${dbPath}` });
  const ddl = `
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      owner_email TEXT NOT NULL DEFAULT 'local@localhost',
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'private'
    );
    CREATE TABLE IF NOT EXISTS crm_contact_shares (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      principal_type TEXT NOT NULL,
      principal_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS crm_deals (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      stage TEXT NOT NULL DEFAULT 'lead',
      close_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      owner_email TEXT NOT NULL DEFAULT 'local@localhost',
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'private'
    );
    CREATE TABLE IF NOT EXISTS crm_deal_shares (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      principal_type TEXT NOT NULL,
      principal_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS crm_activities (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      deal_id TEXT,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL,
      ref_message_id TEXT,
      ref_event_id TEXT,
      ref_note_id TEXT,
      at TEXT NOT NULL,
      deleted_at TEXT,
      owner_email TEXT NOT NULL DEFAULT 'local@localhost',
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'private'
    );
    CREATE TABLE IF NOT EXISTS crm_activity_shares (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      principal_type TEXT NOT NULL,
      principal_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `;
  // libsql client `executeMultiple` runs a multi-statement script.
  await client.executeMultiple(ddl);
  client.close();
  _migrated = true;
}

async function clearAllTables() {
  const client = createClient({ url: `file:${dbPath}` });
  await client.executeMultiple(`
    DELETE FROM crm_contacts;
    DELETE FROM crm_contact_shares;
    DELETE FROM crm_deals;
    DELETE FROM crm_deal_shares;
    DELETE FROM crm_activities;
    DELETE FROM crm_activity_shares;
  `);
  client.close();
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export async function setupCrmTestEnv(): Promise<TestEnv> {
  await runInlineMigrations();
  await clearAllTables();

  const callLog: StubCall[] = [];
  const stubReturns = new Map<string, unknown>();

  const registry = new CapabilityRegistry();
  registry.register(crmApp);
  registry.register(buildStubApp("mail", callLog, stubReturns));
  registry.register(buildStubApp("calendar", callLog, stubReturns));
  registry.register(buildStubApp("notes", callLog, stubReturns));
  registry.register(buildStubApp("tasks", callLog, stubReturns));
  registry.register(buildStubApp("content", callLog, stubReturns));

  async function call<O = unknown>(
    user: { id: string; email: string; orgId?: string },
    capability: string,
    input: unknown,
    callerAppId = "test-driver",
  ): Promise<O> {
    const resolved = registry.resolve(capability);
    if (!resolved) throw new Error(`Capability ${capability} not found`);
    const parsed = resolved.def.input.parse(input);

    const ctx: CapabilityContext = {
      user,
      caller: { appId: callerAppId },
      // The sub-call's caller is whichever app's handler is currently
      // running — `resolved.app.id`. This matches fluid-os RPC server.
      call: async (fqid: string, subInput: unknown) => {
        const sub = registry.resolve(fqid);
        if (!sub) throw new Error(`Capability ${fqid} not found`);
        const parsedSub = sub.def.input.parse(subInput);
        const subCtx: CapabilityContext = {
          user,
          caller: { appId: resolved.app.id },
          call: ctx.call,
          agent: ctx.agent,
        };
        return (await sub.def.handler(parsedSub, subCtx)) as never;
      },
      agent: async () => "",
    };

    // Wrap in runWithRequestContext so the service's getRequestUserEmail()
    // resolves to the test user.
    return runWithRequestContext(
      { userEmail: user.email, orgId: user.orgId },
      async () => {
        return (await resolved.def.handler(parsed, ctx)) as O;
      },
    );
  }

  return { registry, callLog, stubReturns, call };
}

/**
 * Pull rows directly from the DB to assert on persisted state. Returns the
 * raw row shape from drizzle — useful for assertions on owner_email and
 * ref_* columns that aren't exposed in capability output payloads.
 */
export async function readContacts() {
  const db = getDb();
  return db.select().from(schema.contacts);
}

export async function readDeals() {
  const db = getDb();
  return db.select().from(schema.deals);
}

export async function readActivities() {
  const db = getDb();
  return db.select().from(schema.activities);
}
