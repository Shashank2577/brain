import type { PlatformAdapter } from "../types.js";
interface ServiceAccountKey {
    client_email: string;
    private_key: string;
    token_uri?: string;
}
/**
 * Parse the service account key from env.
 * Supports both a JSON string and a file path.
 */
export declare function getServiceAccountKey(): ServiceAccountKey | null;
/**
 * Get the service account email for display (users share docs with this).
 */
export declare function getServiceAccountEmail(): string | null;
/**
 * Create a signed JWT and exchange it for an access token.
 */
export declare function getServiceAccountAccessToken(): Promise<string | null>;
/**
 * Extract a Google Doc file ID from a URL or return the string as-is.
 */
export declare function extractFileId(urlOrId: string): string;
export interface GoogleDocComment {
    id: string;
    content: string;
    author: {
        displayName: string;
        emailAddress?: string;
    };
    createdTime: string;
    modifiedTime: string;
    resolved: boolean;
    quotedFileContent?: {
        value: string;
    };
    replies?: Array<{
        id: string;
        content: string;
        author: {
            displayName: string;
            emailAddress?: string;
        };
        createdTime: string;
    }>;
}
/**
 * List comments on a Google Doc, optionally filtering by modified time.
 */
export declare function listDocComments(fileId: string, accessToken: string, startModifiedTime?: string): Promise<GoogleDocComment[]>;
/**
 * Reply to a comment on a Google Doc.
 */
export declare function replyToComment(fileId: string, commentId: string, content: string, accessToken: string): Promise<void>;
/**
 * Get the start page token for changes.list (initial sync point).
 */
export declare function getStartPageToken(accessToken: string): Promise<string>;
export interface DriveChange {
    fileId: string;
    removed: boolean;
    file?: {
        id: string;
        name: string;
        mimeType: string;
    };
}
/**
 * List changes since a page token. Returns changed file IDs and the next token.
 */
export declare function listChanges(pageToken: string, accessToken: string): Promise<{
    changes: DriveChange[];
    nextPageToken: string;
}>;
/**
 * Create a Google Docs platform adapter.
 *
 * Unlike Slack/Telegram, this adapter is poll-driven — the poller
 * constructs IncomingMessage objects and feeds them through the
 * webhook handler. The adapter handles formatting and sending replies.
 *
 * Setup:
 * - Set GOOGLE_SERVICE_ACCOUNT_KEY (JSON string or file path) in env
 * - Users share their Google Docs with the service account email
 * - Comments containing the trigger keyword (default: "@agent") are processed
 */
export declare function googleDocsAdapter(): PlatformAdapter;
export {};
//# sourceMappingURL=google-docs.d.ts.map