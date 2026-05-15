import { SignJWT, jwtVerify } from "jose";
import type { OsUser } from "../manifest/types.js";

export interface OsSessionClaims {
  sub: string;
  email: string;
  name?: string;
  orgId?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  scope: string[];
}

export interface SignOpts {
  audienceAppId: string;
  ttlSeconds?: number;
  scope?: string[];
}

const DEFAULT_ISSUER = "fluid-os";
const DEFAULT_TTL = 60 * 15;

export class IdentityProvider {
  private secret: Uint8Array;
  private issuer: string;

  constructor(opts: { secret: string | Uint8Array; issuer?: string }) {
    this.secret = typeof opts.secret === "string" ? new TextEncoder().encode(opts.secret) : opts.secret;
    this.issuer = opts.issuer ?? DEFAULT_ISSUER;
    if (this.secret.length < 32) {
      throw new Error("IdentityProvider secret must be at least 32 bytes");
    }
  }

  async sign(user: OsUser, opts: SignOpts): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const ttl = opts.ttlSeconds ?? DEFAULT_TTL;
    return await new SignJWT({
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      scope: opts.scope ?? [],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuer(this.issuer)
      .setAudience(opts.audienceAppId)
      .setIssuedAt(now)
      .setExpirationTime(now + ttl)
      .sign(this.secret);
  }

  async verify(token: string, opts: { audienceAppId: string }): Promise<OsSessionClaims> {
    const { payload } = await jwtVerify(token, this.secret, {
      issuer: this.issuer,
      audience: opts.audienceAppId,
    });
    return payload as unknown as OsSessionClaims;
  }

  toUser(claims: OsSessionClaims): OsUser {
    return {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      orgId: claims.orgId,
    };
  }
}
