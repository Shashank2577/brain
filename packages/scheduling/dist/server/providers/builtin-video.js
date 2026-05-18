export function createDailyVideoProvider(config) {
    const prefix = config.roomPrefix ?? "room-";
    async function apiCall(path, init) {
        const res = await fetch(`https://api.daily.co/v1${path}`, {
            ...init,
            headers: {
                ...(init?.headers ?? {}),
                authorization: `Bearer ${config.apiKey}`,
                "content-type": "application/json",
            },
        });
        if (!res.ok) {
            throw new Error(`Daily.co ${res.status}: ${await res.text()}`);
        }
        if (res.status === 204)
            return undefined;
        return (await res.json());
    }
    return {
        kind: "builtin_video",
        label: "Built-in video",
        async createMeeting({ booking }) {
            const roomName = `${prefix}${booking.uid}`.slice(0, 40);
            const resp = await apiCall("/rooms", {
                method: "POST",
                body: JSON.stringify({
                    name: roomName,
                    properties: {
                        nbf: Math.floor(new Date(booking.startTime).getTime() / 1000),
                        exp: Math.floor(new Date(booking.endTime).getTime() / 1000) + 3600,
                        enable_prejoin_ui: true,
                        enable_chat: true,
                        enable_knocking: true,
                        eject_at_room_exp: true,
                    },
                }),
            });
            return {
                meetingUrl: resp.url,
                meetingId: resp.name,
            };
        },
        async deleteMeeting({ meetingId }) {
            await apiCall(`/rooms/${encodeURIComponent(meetingId)}`, {
                method: "DELETE",
            });
        },
    };
}
//# sourceMappingURL=builtin-video.js.map