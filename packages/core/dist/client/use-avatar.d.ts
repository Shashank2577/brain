/**
 * Avatar hooks for fetching and uploading user avatars.
 *
 * Avatars are stored as compressed base64 JPEG data URLs (64×64, ~2-4 KB)
 * in the settings table under the key `avatar:<email>`.
 *
 * Avatars are semi-public — any client can read any user's avatar by email.
 */
/** Invalidate avatar cache for an email (call after upload). */
export declare function invalidateAvatarCache(email: string): void;
/** Returns the avatar data URL for a given email, or null if none is set. */
export declare function useAvatarUrl(email: string | null | undefined): string | null;
/** Compress and upload an avatar image for the given user. */
export declare function uploadAvatar(file: File, email: string): Promise<void>;
//# sourceMappingURL=use-avatar.d.ts.map