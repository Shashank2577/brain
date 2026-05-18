import type { PublicRemoteDevice, RemoteDevice } from "./remote-types.js";
export declare function toPublicRemoteDevice(device: RemoteDevice): PublicRemoteDevice;
export declare function createRemoteDevice(input: {
    ownerEmail: string;
    orgId?: string | null;
    label: string;
    platform?: string | null;
    appVersion?: string | null;
    hostName?: string | null;
    metadata?: Record<string, unknown> | null;
}): Promise<{
    device: RemoteDevice;
    token: string;
}>;
export declare function getRemoteDevice(id: string): Promise<RemoteDevice | null>;
export declare function getRemoteDeviceForOwner(input: {
    id: string;
    ownerEmail: string;
    orgId?: string | null;
}): Promise<RemoteDevice | null>;
export declare function listRemoteDevicesForOwner(input: {
    ownerEmail: string;
    orgId?: string | null;
    status?: RemoteDevice["status"];
    limit?: number;
}): Promise<RemoteDevice[]>;
export declare function authenticateRemoteDeviceToken(rawToken: string | null | undefined): Promise<RemoteDevice | null>;
export declare function updateRemoteDeviceDetails(input: {
    id: string;
    label?: string | null;
    platform?: string | null;
    appVersion?: string | null;
    hostName?: string | null;
    metadata?: Record<string, unknown> | null;
}): Promise<RemoteDevice | null>;
export declare function revokeRemoteDeviceForOwner(input: {
    id: string;
    ownerEmail: string;
    orgId?: string | null;
}): Promise<RemoteDevice | null>;
export declare function unregisterRemoteDevice(id: string): Promise<boolean>;
export declare function hashRemoteDeviceToken(token: string): Promise<string>;
//# sourceMappingURL=remote-devices-store.d.ts.map