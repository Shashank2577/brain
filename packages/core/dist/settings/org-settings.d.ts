/**
 * Org-scoped settings helpers.
 *
 * Wraps the global settings store with per-org key prefixing.
 * Keys are stored as `o:<orgId>:<key>` in the settings table.
 *
 * No global fallback — each org starts with a clean slate. This
 * prevents one org's data from leaking to another.
 */
import { type StoreWriteOptions } from "./store.js";
/** Read an org-scoped setting. Returns null if not set for this org. */
export declare function getOrgSetting(orgId: string, key: string): Promise<Record<string, unknown> | null>;
/** Write an org-scoped setting. Always writes to the prefixed key. */
export declare function putOrgSetting(orgId: string, key: string, value: Record<string, unknown>, options?: StoreWriteOptions): Promise<void>;
/** Delete an org-scoped setting. */
export declare function deleteOrgSetting(orgId: string, key: string, options?: StoreWriteOptions): Promise<boolean>;
/**
 * List all settings keys for an org with an optional sub-prefix.
 * Returns a map of `<key>` (without the org prefix) to value.
 */
export declare function listOrgSettings(orgId: string, subPrefix?: string): Promise<Record<string, Record<string, unknown>>>;
//# sourceMappingURL=org-settings.d.ts.map