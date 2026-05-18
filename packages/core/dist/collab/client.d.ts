/**
 * Client-side hook for collaborative document editing via Yjs.
 *
 * Creates a STABLE Y.Doc per docId that never changes identity. This allows
 * TipTap's Collaboration extension to bind once without editor recreation.
 * Server state is applied to the existing doc when it arrives.
 *
 * Also manages Yjs Awareness for cursor positions and user presence,
 * synced via polling to the server's awareness endpoint.
 */
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
export interface CollabUser {
    name: string;
    email: string;
    color: string;
}
export interface UseCollaborativeDocOptions {
    /** Document ID to collaborate on. Pass null to disable. */
    docId: string | null;
    /** Poll interval in ms. Default: 2000 */
    pollInterval?: number;
    /** Pause remote update/presence polling while the tab is hidden. Default: true */
    pauseWhenHidden?: boolean;
    /** Base URL for collab endpoints. Default: "/_agent-native/collab" */
    baseUrl?: string;
    /** Request source ID for jitter prevention (e.g., tab ID). */
    requestSource?: string;
    /** Current user info for cursor labels. */
    user?: CollabUser;
}
export interface UseCollaborativeDocResult {
    /** The Yjs document instance. Stable per docId — never changes identity. */
    ydoc: Y.Doc | null;
    /** Yjs Awareness instance for cursor/presence sync. */
    awareness: Awareness | null;
    /** Whether the initial state is still loading from the server. */
    isLoading: boolean;
    /** Whether the doc is synced with the server. */
    isSynced: boolean;
    /** Active users on this document (from awareness). */
    activeUsers: CollabUser[];
    /** True briefly when the AI agent makes an edit (for presence indicator). */
    agentActive: boolean;
    /** True when the AI agent has an active awareness entry (durable presence). */
    agentPresent: boolean;
}
/** Hash a string to a consistent color from the palette. */
export declare function emailToColor(email: string): string;
/** Derive a display name from an email address. */
export declare function emailToName(email: string): string;
export declare function dedupeCollabUsersByEmail(users: CollabUser[]): CollabUser[];
export interface RemoteAwarenessSnapshot {
    clientId: number;
    state: unknown;
}
export declare function reconcileRemoteAwarenessStates(states: Map<number, unknown>, localClientId: number, remoteStates: RemoteAwarenessSnapshot[]): {
    added: number[];
    updated: number[];
    removed: number[];
};
export declare function useCollaborativeDoc(options: UseCollaborativeDocOptions): UseCollaborativeDocResult;
//# sourceMappingURL=client.d.ts.map