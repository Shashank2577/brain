/**
 * Desktop SSO broker.
 *
 * In the Electron desktop app each template runs in its own persistent
 * session partition with its own Nitro server and database. Cookies are
 * isolated per partition, and session tokens don't federate across the
 * per-template `session` tables — so signing into Mail leaves Calendar
 * with a useless cookie (same value, but no matching row in Calendar's
 * database), and Calendar reads as "logged out" on the next request.
 *
 * This module is a file-based broker that lives in the user's home
 * directory. When a template creates a session, it writes the token +
 * email here. When any template's `getSession` can't resolve its own
 * cookie, it falls back to this record (but only for requests from
 * Electron, so web deployments stay DB-backed).
 *
 * The file is user-owned (0600) and lives under the OS home directory,
 * so the trust boundary is the local machine — same as the desktop app
 * itself. It is intentionally not written or read outside of Electron
 * requests; plain-web/serverless deployments never touch it.
 */
export interface DesktopSsoRecord {
    email: string;
    token: string;
    expiresAt: number;
}
export declare function readDesktopSso(): Promise<DesktopSsoRecord | null>;
export declare function writeDesktopSso(rec: DesktopSsoRecord): Promise<void>;
export declare function clearDesktopSso(): Promise<void>;
//# sourceMappingURL=desktop-sso.d.ts.map