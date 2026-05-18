/**
 * Access-control helpers for shareable resources.
 *
 * The access model combines:
 * 1. Direct ownership — `owner_email = currentUser`.
 * 2. Visibility — `'private' | 'org' | 'public'`. `org` grants read to anyone
 *    in the same org; `public` grants read to any authenticated user.
 * 3. Share rows — per-user or per-org grants in the `{type}_shares` table
 *    with a role (`viewer | editor | admin`).
 *
 * Use `applyAccessFilter()` on list/read queries to filter rows the current
 * user can see. Use `assertAccess()` at the top of write actions to reject
 * callers who lack the required role.
 */
import { type SQL } from "drizzle-orm";
import { type ShareRole } from "./schema.js";
export declare class ForbiddenError extends Error {
    statusCode: number;
    constructor(message?: string);
}
export interface AccessContext {
    userEmail?: string;
    orgId?: string;
}
/** Current request's access context. Pulls from request-context ALS. */
export declare function currentAccess(): AccessContext;
/**
 * Build a Drizzle `WHERE` clause that admits rows the current user can see.
 * Pass the ownable resource table and its shares table; optional min role
 * (defaults to 'viewer') gates which share rows count.
 *
 * `visibility = 'public'` is intentionally NOT admitted by default. Public
 * means "anyone with the link can view" (still honoured by `resolveAccess`
 * for read-by-id), not "appears in every signed-in user's list/sidebar."
 * Pass `{ includePublic: true }` for the rare list endpoint that wants
 * cross-user public discovery (a public template gallery, for example).
 *
 * Example:
 *
 *   const rows = await db
 *     .select()
 *     .from(schema.documents)
 *     .where(accessFilter(schema.documents, schema.documentShares));
 */
export declare function accessFilter(resourceTable: any, sharesTable: any, ctx?: AccessContext, minRole?: ShareRole, options?: {
    includePublic?: boolean;
}): SQL;
export interface ResolvedAccess {
    /** Effective role: 'owner' for the resource owner, or the share role. */
    role: "owner" | ShareRole;
    /** The resource row (already loaded). */
    resource: any;
}
/**
 * Return the effective role the current user has on a specific resource, or
 * null if they have no access. Loads the resource and relevant share rows.
 */
export declare function resolveAccess(resourceType: string, resourceId: string, ctx?: AccessContext): Promise<ResolvedAccess | null>;
/**
 * Throw ForbiddenError if the current user can't act on this resource with at
 * least the given role. Used at the top of update/delete actions.
 */
export declare function assertAccess(resourceType: string, resourceId: string, minRole?: ShareRole | "owner", ctx?: AccessContext): Promise<ResolvedAccess>;
//# sourceMappingURL=access.d.ts.map