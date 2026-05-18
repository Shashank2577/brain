import { getRequestOrgId, getRequestUserEmail, } from "../server/request-context.js";
import { signA2AToken } from "./client.js";
const DEFAULT_A2A_CALLER_TOKEN_TTL = "30m";
export async function resolveA2ACallerAuth(options) {
    const userEmail = getRequestUserEmail();
    const metadata = {};
    if (userEmail)
        metadata.userEmail = userEmail;
    let orgDomain;
    let orgSecret;
    const orgId = getRequestOrgId();
    if (orgId) {
        try {
            const { getOrgDomain } = await import("../org/context.js");
            orgDomain = (await getOrgDomain(orgId)) ?? undefined;
            if (orgDomain)
                metadata.orgDomain = orgDomain;
        }
        catch { }
        try {
            const { getOrgA2ASecret } = await import("../org/context.js");
            orgSecret = (await getOrgA2ASecret(orgId)) ?? undefined;
        }
        catch { }
    }
    let apiKey;
    if (userEmail && (orgSecret || process.env.A2A_SECRET)) {
        try {
            apiKey = await signA2AToken(userEmail, orgDomain, orgSecret, {
                expiresIn: options?.expiresIn ?? DEFAULT_A2A_CALLER_TOKEN_TTL,
                preferGlobalSecret: !orgSecret,
            });
        }
        catch { }
    }
    if (options?.includeGoogleToken) {
        await attachGoogleTokenMetadata(metadata, userEmail);
    }
    return { apiKey, userEmail, orgDomain, orgSecret, metadata };
}
async function attachGoogleTokenMetadata(metadata, userEmail) {
    if (process.env.NODE_ENV !== "production" || !userEmail)
        return;
    try {
        const { listOAuthAccountsByOwner } = await import("../oauth-tokens/store.js");
        const accounts = await listOAuthAccountsByOwner("google", userEmail);
        const tokens = accounts[0]?.tokens;
        if (tokens?.access_token) {
            metadata.googleToken = tokens.access_token;
        }
    }
    catch { }
}
//# sourceMappingURL=caller-auth.js.map