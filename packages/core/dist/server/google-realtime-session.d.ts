interface GoogleRealtimeSessionResponse {
    websocketUrl: string;
    sessionToken: string;
    websocketProtocol?: string;
}
export declare function resolveGoogleRealtimeCredentials(opts: {
    userEmail?: string | null;
    orgId?: string | null;
}): Promise<string | null>;
export declare function createGoogleRealtimeSessionHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<GoogleRealtimeSessionResponse | {
    error: any;
}>>;
export {};
//# sourceMappingURL=google-realtime-session.d.ts.map