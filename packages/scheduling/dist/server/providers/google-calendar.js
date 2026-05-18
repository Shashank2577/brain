const SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
];
export function createGoogleCalendarProvider(config) {
    async function apiCall(credentialId, url, init) {
        const token = await config.getAccessToken(credentialId);
        const res = await fetch(url, {
            ...init,
            headers: {
                ...(init?.headers ?? {}),
                authorization: `Bearer ${token}`,
                "content-type": "application/json",
            },
        });
        if (res.status === 401 || res.status === 403) {
            await config.markInvalid?.(credentialId);
            throw new Error(`Google Calendar: credential invalid (${res.status})`);
        }
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Google Calendar API ${res.status}: ${body}`);
        }
        if (res.status === 204)
            return undefined;
        return (await res.json());
    }
    return {
        kind: "google_calendar",
        label: "Google Calendar",
        async startOAuth({ redirectUri, state }) {
            const params = new URLSearchParams({
                client_id: config.clientId,
                redirect_uri: redirectUri,
                response_type: "code",
                scope: SCOPES.join(" "),
                access_type: "offline",
                include_granted_scopes: "true",
                prompt: "consent",
                state,
            });
            return {
                authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
            };
        },
        async completeOAuth({ code, redirectUri, credentialId, userEmail }) {
            const body = new URLSearchParams({
                code,
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            });
            const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "content-type": "application/x-www-form-urlencoded" },
                body,
            });
            if (!tokenRes.ok) {
                throw new Error(`Google token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
            }
            const tokens = await tokenRes.json();
            await config.updateTokens?.(credentialId, {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
            });
            // Discover external email + calendar list
            const calendars = await apiCall(credentialId, "https://www.googleapis.com/calendar/v3/users/me/calendarList");
            const primary = calendars.items.find((c) => c.primary);
            return {
                externalEmail: primary?.id ?? userEmail,
                calendars: calendars.items.map((c) => ({
                    externalId: c.id,
                    name: c.summary,
                    primary: Boolean(c.primary),
                })),
            };
        },
        async listCalendars({ credentialId }) {
            const resp = await apiCall(credentialId, "https://www.googleapis.com/calendar/v3/users/me/calendarList");
            return resp.items.map((c) => ({
                externalId: c.id,
                name: c.summary,
                primary: Boolean(c.primary),
            }));
        },
        async getBusy({ credentialId, calendarExternalIds, start, end }) {
            const resp = await apiCall(credentialId, "https://www.googleapis.com/calendar/v3/freeBusy", {
                method: "POST",
                body: JSON.stringify({
                    timeMin: start.toISOString(),
                    timeMax: end.toISOString(),
                    items: calendarExternalIds.map((id) => ({ id })),
                }),
            });
            const out = [];
            for (const [calId, data] of Object.entries(resp.calendars)) {
                for (const b of data.busy) {
                    out.push({ start: b.start, end: b.end, source: calId });
                }
            }
            return out;
        },
        async createEvent({ credentialId, calendarExternalId, booking, includeConference, }) {
            const body = {
                summary: booking.title,
                description: booking.description,
                start: { dateTime: booking.startTime, timeZone: booking.timezone },
                end: { dateTime: booking.endTime, timeZone: booking.timezone },
                attendees: [
                    { email: booking.hostEmail, organizer: true },
                    ...booking.attendees.map((a) => ({
                        email: a.email,
                        displayName: a.name,
                    })),
                ],
                iCalUID: booking.iCalUid,
                sequence: booking.iCalSequence,
            };
            if (booking.location) {
                if (booking.location.address)
                    body.location = booking.location.address;
                else if (booking.location.link)
                    body.location = booking.location.link;
            }
            let query = "?sendUpdates=all";
            if (includeConference) {
                body.conferenceData = {
                    createRequest: {
                        requestId: booking.uid,
                        conferenceSolutionKey: { type: "hangoutsMeet" },
                    },
                };
                query += "&conferenceDataVersion=1";
            }
            const resp = await apiCall(credentialId, `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarExternalId)}/events${query}`, { method: "POST", body: JSON.stringify(body) });
            return {
                externalId: resp.id,
                meetingUrl: resp.hangoutLink ??
                    resp.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri,
                icalUid: resp.iCalUID,
            };
        },
        async updateEvent({ credentialId, externalId, booking }) {
            // Bump sequence for RFC 5545 compliance
            const newSeq = booking.iCalSequence + 1;
            const body = {
                summary: booking.title,
                description: booking.description,
                start: { dateTime: booking.startTime, timeZone: booking.timezone },
                end: { dateTime: booking.endTime, timeZone: booking.timezone },
                sequence: newSeq,
            };
            await apiCall(credentialId, `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(externalId)}?sendUpdates=all`, { method: "PATCH", body: JSON.stringify(body) });
            return { iCalSequence: newSeq };
        },
        async deleteEvent({ credentialId, externalId }) {
            await apiCall(credentialId, `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(externalId)}?sendUpdates=all`, { method: "DELETE" });
        },
    };
}
//# sourceMappingURL=google-calendar.js.map