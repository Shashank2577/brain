// Minimum scope needed to create + read meetings on the user's behalf.
const SCOPES = ["meeting:write", "meeting:read", "user:read"];
export function createZoomProvider(config) {
    return {
        kind: "zoom_video",
        label: "Zoom",
        async startOAuth({ redirectUri, state }) {
            const params = new URLSearchParams({
                response_type: "code",
                client_id: config.clientId,
                redirect_uri: redirectUri,
                state,
                scope: SCOPES.join(" "),
            });
            return {
                authUrl: `https://zoom.us/oauth/authorize?${params}`,
            };
        },
        async completeOAuth({ code, redirectUri, credentialId }) {
            const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
            const body = new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
            });
            const tokenRes = await fetch("https://zoom.us/oauth/token", {
                method: "POST",
                headers: {
                    authorization: `Basic ${basic}`,
                    "content-type": "application/x-www-form-urlencoded",
                },
                body,
            });
            if (!tokenRes.ok) {
                throw new Error(`Zoom token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
            }
            const tokens = (await tokenRes.json());
            await config.updateTokens?.(credentialId, {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
                rawResponse: tokens,
            });
            // Pull user info to label the credential.
            const userRes = await fetch("https://api.zoom.us/v2/users/me", {
                headers: { authorization: `Bearer ${tokens.access_token}` },
            });
            let externalEmail;
            let externalAccountId = credentialId;
            let displayName;
            if (userRes.ok) {
                const user = (await userRes.json());
                externalEmail = user.email;
                externalAccountId = user.id ?? user.account_id ?? credentialId;
                if (user.first_name || user.last_name) {
                    displayName = [user.first_name, user.last_name]
                        .filter(Boolean)
                        .join(" ");
                }
            }
            return { externalAccountId, externalEmail, displayName };
        },
        async createMeeting({ credentialId, booking }) {
            if (!credentialId)
                throw new Error("Zoom requires credentialId");
            const token = await config.getAccessToken(credentialId);
            const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
                method: "POST",
                headers: {
                    authorization: `Bearer ${token}`,
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    topic: booking.title,
                    type: 2,
                    start_time: booking.startTime,
                    duration: Math.round((new Date(booking.endTime).getTime() -
                        new Date(booking.startTime).getTime()) /
                        60000),
                    timezone: booking.timezone,
                    settings: {
                        join_before_host: true,
                        waiting_room: false,
                        mute_upon_entry: false,
                    },
                }),
            });
            if (res.status === 401 || res.status === 403) {
                await config.markInvalid?.(credentialId);
            }
            if (!res.ok)
                throw new Error(`Zoom ${res.status}: ${await res.text()}`);
            const body = await res.json();
            return {
                meetingUrl: body.join_url,
                meetingId: String(body.id),
                meetingPassword: body.password,
            };
        },
        async deleteMeeting({ credentialId, meetingId }) {
            if (!credentialId)
                return;
            const token = await config.getAccessToken(credentialId);
            await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, {
                method: "DELETE",
                headers: { authorization: `Bearer ${token}` },
            });
        },
    };
}
//# sourceMappingURL=zoom.js.map