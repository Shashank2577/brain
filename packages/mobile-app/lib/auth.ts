/**
 * Bearer-token auth for the mobile shell (Phase 8 / ADR-006).
 *
 * Stores the workspace JWT minted by `POST /_agent-native/auth/mobile-token`
 * in AsyncStorage and attaches it as `Authorization: Bearer <token>` on every
 * subsequent registry / RPC request.
 *
 * Known v1 limitations (documented in STATUS.md):
 *   - Uses AsyncStorage (not `expo-secure-store`). A jailbroken device could
 *     read the token. v2 moves to Keychain / KeyStore via secure-store.
 *   - Token has a 7-day TTL but no client-side refresh path. On 401 the user
 *     is sent back to sign-in.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { workspacePath } from "./config";

const AUTH_TOKEN_KEY = "agent-native:mobile-token";
const AUTH_TOKEN_META_KEY = "agent-native:mobile-token-meta";

export interface MobileTokenMeta {
  email: string;
  orgId?: string;
  expiresAt: number;
}

export interface SignInSuccess {
  ok: true;
  token: string;
  expiresAt: number;
  email: string;
  orgId?: string;
}

export interface SignInFailure {
  ok: false;
  reason: string;
  status: number;
}

export type SignInResult = SignInSuccess | SignInFailure;

/** Read the cached token. Returns `null` when the user has not signed in. */
export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

/** Read the cached identity metadata accompanying the token. */
export async function getStoredTokenMeta(): Promise<MobileTokenMeta | null> {
  const raw = await AsyncStorage.getItem(AUTH_TOKEN_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MobileTokenMeta;
  } catch {
    return null;
  }
}

/** Clear the stored token. Used by sign-out and 401 retry flows. */
export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeMany([AUTH_TOKEN_KEY, AUTH_TOKEN_META_KEY]);
}

/** Persist a fresh token + metadata after sign-in. */
export async function storeToken(
  meta: MobileTokenMeta,
  token: string,
): Promise<void> {
  await AsyncStorage.setMany({
    [AUTH_TOKEN_KEY]: token,
    [AUTH_TOKEN_META_KEY]: JSON.stringify(meta),
  });
}

/**
 * Exchange email + password for a workspace JWT. Returns a discriminated
 * result so the screen can render either the apps list or an inline error.
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  const url = workspacePath("/_agent-native/auth/mobile-token");
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    return {
      ok: false,
      reason: `network_error: ${(err as Error).message}`,
      status: 0,
    };
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    return {
      ok: false,
      reason: "invalid_response",
      status: response.status,
    };
  }

  if (!response.ok || !body?.ok) {
    return {
      ok: false,
      reason: typeof body?.reason === "string" ? body.reason : "unknown_error",
      status: response.status,
    };
  }

  await storeToken(
    {
      email: body.email,
      orgId: body.orgId,
      expiresAt: body.expiresAt,
    },
    body.token,
  );

  return {
    ok: true,
    token: body.token,
    expiresAt: body.expiresAt,
    email: body.email,
    orgId: body.orgId,
  };
}

/**
 * Wrap `fetch` with automatic bearer-token injection. Callers do not need to
 * pass headers themselves; we read the stored token and add `Authorization`
 * unless the caller has already set it.
 */
export async function authedFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getStoredToken();
  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
