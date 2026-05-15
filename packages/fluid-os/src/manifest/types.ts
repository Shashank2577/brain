import type { z } from "zod";

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export interface OsUser {
  id: string;
  email: string;
  name?: string;
  orgId?: string;
}

export interface CapabilityContext {
  user: OsUser;
  caller: { appId: string };
  call: <O = unknown>(capabilityId: string, input: unknown) => Promise<O>;
  agent: (prompt: string, opts?: { schema?: unknown }) => Promise<string>;
}

export interface CapabilityDef<I = unknown, O = unknown> {
  description: string;
  input: z.ZodType<I>;
  output: z.ZodType<O>;
  handler: (input: I, ctx: CapabilityContext) => Promise<O>;
  tags?: string[];
}

export type CapabilityMap = Record<string, CapabilityDef<any, any>>;

export interface AppRoute {
  path: string;
  label: string;
  description?: string;
}

export interface AppManifest<C extends CapabilityMap = CapabilityMap> {
  id: string;
  name: string;
  description: string;
  icon?: string;
  url: string;
  routes?: AppRoute[];
  capabilities: C;
  consumes?: string[];
  permissions?: string[];
  agentGuidance?: string;
}

export interface CapabilityEntry {
  id: string;
  appId: string;
  description: string;
  tags?: string[];
}
