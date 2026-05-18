import type { LibSQLDatabase } from "drizzle-orm/libsql";
/**
 * Neon's pooler endpoints cold-start in 5–10s. Serverless environments
 * (Netlify Functions, Vercel Edge, CF Workers) have short cold-start
 * budgets of their own, and `postgres-js` opens a raw TCP connection on
 * port 5432 that can't negotiate around Neon's wake-up window — every
 * request after an idle period 502s. `@neondatabase/serverless` rides
 * over WebSockets (HTTP/443 upgrade) and handles Neon wake-up
 * transparently, supports transactions, and works in every serverless
 * runtime we deploy to, so we prefer it whenever the URL points at Neon.
 */
export declare function isNeonUrl(url: string): boolean;
export declare function createGetDb<T extends Record<string, unknown>>(schema: T): () => LibSQLDatabase<T>;
//# sourceMappingURL=create-get-db.d.ts.map