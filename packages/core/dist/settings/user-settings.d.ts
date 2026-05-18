/**
 * User-scoped settings helpers.
 *
 * Wraps the global settings store with per-user key prefixing.
 * Keys are stored as `u:<email>:<key>` in the settings table.
 *
 * No global fallback — each user starts with a clean slate. This
 * prevents one user's private data from leaking to other users.
 */
import { type StoreWriteOptions } from "./store.js";
/** Read a user-scoped setting. Returns null if not set for this user. */
export declare function getUserSetting(email: string, key: string): Promise<Record<string, unknown> | null>;
/** Write a user-scoped setting. Always writes to the prefixed key. */
export declare function putUserSetting(email: string, key: string, value: Record<string, unknown>, options?: StoreWriteOptions): Promise<void>;
/** Delete a user-scoped setting. */
export declare function deleteUserSetting(email: string, key: string, options?: StoreWriteOptions): Promise<boolean>;
//# sourceMappingURL=user-settings.d.ts.map