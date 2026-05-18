const SCOPES = ["offline_access", "Calendars.ReadWrite", "User.Read"];
export function createOffice365Provider(config) {
    const tenant = config.tenant ?? "common";
    async function graph(credentialId, path, init) {
        const token = await config.getAccessToken(credentialId);
        const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
            ...init,
            headers: {
                ...(init?.headers ?? {}),
                authorization: `Bearer ${token}`,
                "content-type": "application/json",
            },
        });
        if (res.status === 401 || res.status === 403) {
            await config.markInvalid?.(credentialId);
            throw new Error(`Office 365 credential invalid (${res.status})`);
        }
        if (!res.ok) {
            throw new Error(`Graph ${res.status}: ${await res.text()}`);
        }
        if (res.status === 204)
            return undefined;
        return (await res.json());
    }
    return {
        kind: "office365_calendar",
        label: "Outlook / Office 365",
        async startOAuth({ redirectUri, state }) {
            const params = new URLSearchParams({
                client_id: config.clientId,
                redirect_uri: redirectUri,
                response_type: "code",
                scope: SCOPES.join(" "),
                response_mode: "query",
                prompt: "consent",
                state,
            });
            return {
                authUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`,
            };
        },
        async completeOAuth({ code, redirectUri, credentialId, userEmail }) {
            const body = new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
                scope: SCOPES.join(" "),
            });
            const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
                method: "POST",
                headers: { "content-type": "application/x-www-form-urlencoded" },
                body,
            });
            if (!res.ok) {
                throw new Error(`Office 365 token exchange failed: ${res.status} ${await res.text()}`);
            }
            const tokens = await res.json();
            await config.updateTokens?.(credentialId, {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
            });
            const me = await graph(credentialId, "/me");
            const calendars = await graph(credentialId, "/me/calendars");
            return {
                externalEmail: me.mail ?? me.userPrincipalName ?? userEmail,
                calendars: calendars.value.map((c) => ({
                    externalId: c.id,
                    name: c.name,
                    primary: c.isDefaultCalendar,
                })),
            };
        },
        async listCalendars({ credentialId }) {
            const resp = await graph(credentialId, "/me/calendars");
            return resp.value.map((c) => ({
                externalId: c.id,
                name: c.name,
                primary: c.isDefaultCalendar,
            }));
        },
        async getBusy({ credentialId, calendarExternalIds, start, end }) {
            const resp = await graph(credentialId, "/me/calendar/getSchedule", {
                method: "POST",
                body: JSON.stringify({
                    schedules: calendarExternalIds,
                    startTime: { dateTime: start.toISOString(), timeZone: "UTC" },
                    endTime: { dateTime: end.toISOString(), timeZone: "UTC" },
                    availabilityViewInterval: 30,
                }),
            });
            const out = [];
            for (const entry of resp.value) {
                for (const item of entry.scheduleItems) {
                    if (item.status === "free")
                        continue;
                    out.push({
                        start: item.start.dateTime + "Z",
                        end: item.end.dateTime + "Z",
                        source: entry.scheduleId,
                    });
                }
            }
            return out;
        },
        async createEvent({ credentialId, calendarExternalId, booking }) {
            const body = {
                subject: booking.title,
                body: { contentType: "HTML", content: booking.description ?? "" },
                start: { dateTime: booking.startTime, timeZone: booking.timezone },
                end: { dateTime: booking.endTime, timeZone: booking.timezone },
                attendees: booking.attendees.map((a) => ({
                    emailAddress: { address: a.email, name: a.name },
                    type: "required",
                })),
                transactionId: booking.uid,
            };
            const resp = await graph(credentialId, `/me/calendars/${encodeURIComponent(calendarExternalId)}/events`, { method: "POST", body: JSON.stringify(body) });
            return {
                externalId: resp.id,
                meetingUrl: resp.onlineMeeting?.joinUrl,
                icalUid: resp.iCalUId,
            };
        },
        async updateEvent({ credentialId, externalId, booking }) {
            const newSeq = booking.iCalSequence + 1;
            await graph(credentialId, `/me/events/${encodeURIComponent(externalId)}`, {
                method: "PATCH",
                body: JSON.stringify({
                    subject: booking.title,
                    start: { dateTime: booking.startTime, timeZone: booking.timezone },
                    end: { dateTime: booking.endTime, timeZone: booking.timezone },
                }),
            });
            return { iCalSequence: newSeq };
        },
        async deleteEvent({ credentialId, externalId }) {
            await graph(credentialId, `/me/events/${encodeURIComponent(externalId)}`, {
                method: "DELETE",
            });
        },
    };
}
//# sourceMappingURL=office365.js.map