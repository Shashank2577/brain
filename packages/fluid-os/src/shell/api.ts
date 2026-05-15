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
