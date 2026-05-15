import type { AppSummary, CapabilityEntry, FluidUser } from "./types";

export async function fetchMe(): Promise<FluidUser | null> {
  const res = await fetch("/_fluid-os/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load session");
  const body = (await res.json()) as { user: FluidUser };
  return body.user;
}

export async function fetchApps(): Promise<AppSummary[]> {
  const res = await fetch("/_fluid-os/apps");
  if (!res.ok) throw new Error("Failed to load apps");
  const body = (await res.json()) as { apps: AppSummary[] };
  return body.apps;
}

export async function fetchCapabilities(): Promise<CapabilityEntry[]> {
  const res = await fetch("/_fluid-os/capabilities");
  if (!res.ok) throw new Error("Failed to load capabilities");
  const body = (await res.json()) as { capabilities: CapabilityEntry[] };
  return body.capabilities;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) return cachedToken.token;
  const res = await fetch(`/_fluid-os/auth/token`, { credentials: "include" });
  if (!res.ok) throw new Error("Could not mint OS token");
  const body = (await res.json()) as { token: string };
  cachedToken = { token: body.token, expiresAt: Date.now() + 12 * 60 * 1000 };
  return body.token;
}

export interface SuggestedCapability {
  id: string;
  appId: string;
  description: string;
  score: number;
}

export async function suggestConsumes(description: string): Promise<SuggestedCapability[]> {
  const res = await fetch("/_fluid-os/scaffold/suggest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error("suggest failed");
  const body = (await res.json()) as { suggestions: SuggestedCapability[] };
  return body.suggestions;
}

export interface ScaffoldRequest {
  id: string;
  name: string;
  description: string;
  consumes: string[];
  capabilities: { id: string; description: string }[];
  agentGuidance?: string;
}

export interface ScaffoldResult {
  ok: true;
  file: string;
  app: { id: string; name: string; description: string; consumes: string[]; capabilities: string[] };
}

export async function scaffoldApp(req: ScaffoldRequest): Promise<ScaffoldResult> {
  const res = await fetch("/_fluid-os/scaffold", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });
  const body = await res.json();
  if (!res.ok) {
    const message = (body as { message?: string }).message ?? (body as { error?: string }).error ?? "scaffold failed";
    throw new Error(message);
  }
  return body as ScaffoldResult;
}

export async function invokeCapability(capability: string, input: unknown): Promise<unknown> {
  const token = await getToken();
  const res = await fetch("/_fluid-os/rpc", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "x-fluid-app-id": "shell",
    },
    body: JSON.stringify({ capability, input }),
  });
  const body = (await res.json()) as { ok: boolean; output?: unknown; error?: { code: string; message: string } };
  if (!body.ok) {
    const err = new Error(body.error?.message ?? "RPC failed") as Error & { code?: string };
    err.code = body.error?.code;
    throw err;
  }
  return body.output;
}
