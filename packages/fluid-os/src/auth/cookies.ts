import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "fluid_os_session";
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface CookieSessionClaims {
  sub: string;
  exp: number;
  iat: number;
}

export class CookieSession {
  private secret: Uint8Array;

  constructor(secret: string | Uint8Array) {
    this.secret = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
    if (this.secret.length < 32) {
      throw new Error("CookieSession secret must be at least 32 bytes");
    }
  }

  async sign(userId: string, ttlSeconds = COOKIE_TTL_SECONDS): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    return await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setIssuer("fluid-os-shell")
      .setIssuedAt(now)
      .setExpirationTime(now + ttlSeconds)
      .sign(this.secret);
  }

  async verify(token: string): Promise<CookieSessionClaims> {
    const { payload } = await jwtVerify(token, this.secret, { issuer: "fluid-os-shell" });
    return payload as unknown as CookieSessionClaims;
  }

  buildSetCookie(token: string, opts: { secure?: boolean; ttlSeconds?: number } = {}): string {
    const parts = [
      `${COOKIE_NAME}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${opts.ttlSeconds ?? COOKIE_TTL_SECONDS}`,
    ];
    if (opts.secure) parts.push("Secure");
    return parts.join("; ");
  }

  buildClearCookie(): string {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }

  readFromHeader(cookieHeader: string | null | undefined): string | null {
    if (!cookieHeader) return null;
    for (const part of cookieHeader.split(/;\s*/)) {
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      const name = part.slice(0, eq).trim();
      if (name === COOKIE_NAME) return part.slice(eq + 1);
    }
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
