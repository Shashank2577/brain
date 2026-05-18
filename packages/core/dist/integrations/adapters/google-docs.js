/** Google Docs comment replies have no formal length limit but keep it reasonable */
const GDOCS_MAX_LENGTH = 4000;
let cachedToken = null;
/**
 * Parse the service account key from env.
 * Supports both a JSON string and a file path.
 */
export function getServiceAccountKey() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        // Could be a file path — try reading it
        try {
            const fs = require("node:fs");
            const content = fs.readFileSync(raw, "utf-8");
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
}
/**
 * Get the service account email for display (users share docs with this).
 */
export function getServiceAccountEmail() {
    const key = getServiceAccountKey();
    return key?.client_email ?? null;
}
/**
 * Create a signed JWT and exchange it for an access token.
 */
export async function getServiceAccountAccessToken() {
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
        return cachedToken.token;
    }
    const key = getServiceAccountKey();
    if (!key)
        return null;
    try {
        const crypto = await import("node:crypto");
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: "RS256", typ: "JWT" };
        const payload = {
            iss: key.client_email,
            scope: "https://www.googleapis.com/auth/drive",
            aud: key.token_uri || "https://oauth2.googleapis.com/token",
            iat: now,
            exp: now + 3600,
        };
        const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
        const unsigned = `${encode(header)}.${encode(payload)}`;
        const signer = crypto.createSign("RSA-SHA256");
        signer.update(unsigned);
        const signature = signer.sign(key.private_key, "base64url");
        const jwt = `${unsigned}.${signature}`;
        const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: jwt,
            }),
        });
        if (!res.ok) {
            const err = await res.text();
            console.error("[google-docs] Token exchange failed:", err);
            return null;
        }
        const data = (await res.json());
        cachedToken = {
            token: data.access_token,
            expiresAt: Date.now() + data.expires_in * 1000,
        };
        return data.access_token;
    }
    catch (err) {
        console.error("[google-docs] Failed to get service account token:", err);
        return null;
    }
}
// ─── Google Drive API Helpers ───────────────────────────────────────────────
/**
 * Extract a Google Doc file ID from a URL or return the string as-is.
 */
export function extractFileId(urlOrId) {
    const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : urlOrId;
}
/**
 * List comments on a Google Doc, optionally filtering by modified time.
 */
export async function listDocComments(fileId, accessToken, startModifiedTime) {
    const params = new URLSearchParams({
        fields: "comments(id,content,author,createdTime,modifiedTime,resolved,quotedFileContent,replies(id,content,author,createdTime))",
        pageSize: "100",
    });
    if (startModifiedTime) {
        params.set("startModifiedTime", startModifiedTime);
    }
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/comments?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to list comments: ${err}`);
    }
    const data = (await res.json());
    return data.comments ?? [];
}
/**
 * Reply to a comment on a Google Doc.
 */
export async function replyToComment(fileId, commentId, content, accessToken) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/comments/${commentId}/replies`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content,
            fields: "id",
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to reply to comment: ${err}`);
    }
}
/**
 * Get the start page token for changes.list (initial sync point).
 */
export async function getStartPageToken(accessToken) {
    const res = await fetch("https://www.googleapis.com/drive/v3/changes/startPageToken", { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok)
        throw new Error("Failed to get start page token");
    const data = (await res.json());
    return data.startPageToken;
}
/**
 * List changes since a page token. Returns changed file IDs and the next token.
 */
export async function listChanges(pageToken, accessToken) {
    const params = new URLSearchParams({
        pageToken,
        fields: "nextPageToken,newStartPageToken,changes(fileId,removed,file(id,name,mimeType))",
        pageSize: "100",
        includeRemoved: "false",
    });
    const res = await fetch(`https://www.googleapis.com/drive/v3/changes?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to list changes: ${err}`);
    }
    const data = (await res.json());
    return {
        changes: data.changes ?? [],
        nextPageToken: data.nextPageToken || data.newStartPageToken || pageToken,
    };
}
// ─── Platform Adapter ───────────────────────────────────────────────────────
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
export function googleDocsAdapter() {
    return {
        platform: "google-docs",
        label: "Google Docs",
        getRequiredEnvKeys() {
            return [
                {
                    key: "GOOGLE_SERVICE_ACCOUNT_KEY",
                    label: "Google Service Account Key (JSON)",
                    required: true,
                },
            ];
        },
        async handleVerification(_event) {
            return { handled: false };
        },
        async verifyWebhook(_event) {
            return true;
        },
        async parseIncomingMessage(_event) {
            return null;
        },
        async sendResponse(message, context) {
            const fileId = context.platformContext.fileId;
            const commentId = context.platformContext.commentId;
            const accessToken = await getServiceAccountAccessToken();
            if (!accessToken) {
                console.error("[google-docs] No access token available to send reply");
                return;
            }
            const chunks = splitMessage(message.text, GDOCS_MAX_LENGTH);
            for (const chunk of chunks) {
                try {
                    await replyToComment(fileId, commentId, chunk, accessToken);
                }
                catch (err) {
                    console.error("[google-docs] Failed to send reply:", err);
                }
            }
        },
        formatAgentResponse(text) {
            return { text, platformContext: {} };
        },
        async getStatus(_baseUrl) {
            const key = getServiceAccountKey();
            const configured = !!key;
            const email = key?.client_email;
            return {
                platform: "google-docs",
                label: "Google Docs",
                enabled: false,
                configured,
                details: {
                    serviceAccountEmail: email,
                },
                error: !configured
                    ? "Set GOOGLE_SERVICE_ACCOUNT_KEY in your environment (JSON string or file path to the key file)"
                    : undefined,
            };
        },
    };
}
/** Split a message into chunks that fit within the platform's limit */
function splitMessage(text, maxLength) {
    if (text.length <= maxLength)
        return [text];
    const chunks = [];
    let remaining = text;
    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }
        let splitIdx = remaining.lastIndexOf("\n", maxLength);
        if (splitIdx <= 0)
            splitIdx = remaining.lastIndexOf(" ", maxLength);
        if (splitIdx <= 0)
            splitIdx = maxLength;
        chunks.push(remaining.slice(0, splitIdx));
        remaining = remaining.slice(splitIdx).trimStart();
    }
    return chunks;
}
//# sourceMappingURL=google-docs.js.map