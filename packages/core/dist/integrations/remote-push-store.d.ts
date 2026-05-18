import type { PublicRemotePushRegistration, RemotePushNotification, RemotePushRegistration } from "./remote-types.js";
export declare function toPublicRemotePushRegistration(registration: RemotePushRegistration): PublicRemotePushRegistration;
export declare function upsertRemotePushRegistration(input: {
    ownerEmail: string;
    orgId?: string | null;
    provider: string;
    token: string;
    platform?: string | null;
    clientDeviceId?: string | null;
    label?: string | null;
}): Promise<RemotePushRegistration>;
export declare function listRemotePushRegistrationsForOwner(input: {
    ownerEmail: string;
    orgId?: string | null;
    includeInactive?: boolean;
    limit?: number;
}): Promise<RemotePushRegistration[]>;
export declare function unregisterRemotePushRegistrationForOwner(input: {
    ownerEmail: string;
    orgId?: string | null;
    id?: string | null;
    token?: string | null;
}): Promise<boolean>;
export declare function queueRemotePushNotifications(input: {
    ownerEmail: string;
    orgId?: string | null;
    payload: unknown;
}): Promise<{
    queued: number;
}>;
export declare function listRemotePushNotificationsForOwner(input: {
    ownerEmail: string;
    orgId?: string | null;
    status?: RemotePushNotification["status"];
    limit?: number;
}): Promise<RemotePushNotification[]>;
//# sourceMappingURL=remote-push-store.d.ts.map