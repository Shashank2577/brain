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
import { useEffect, useRef, useState, useMemo } from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { agentNativePath } from "../client/api-path.js";
// Consistent color palette for user cursors
const CURSOR_COLORS = [
    "#f87171",
    "#fb923c",
    "#fbbf24",
    "#a3e635",
    "#34d399",
    "#22d3ee",
    "#60a5fa",
    "#14b8a6",
    "#f472b6",
    "#e879f9",
];
/** Hash a string to a consistent color from the palette. */
export function emailToColor(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0;
    }
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}
/** Derive a display name from an email address. */
export function emailToName(email) {
    const local = email.split("@")[0] || email;
    return local.charAt(0).toUpperCase() + local.slice(1);
}
function normalizeCollabEmail(email) {
    return email.trim().toLowerCase();
}
function isDocumentHidden() {
    return (typeof document !== "undefined" && document.visibilityState === "hidden");
}
export function dedupeCollabUsersByEmail(users) {
    const byEmail = new Map();
    for (const user of users) {
        const email = normalizeCollabEmail(user.email);
        if (!email || byEmail.has(email))
            continue;
        byEmail.set(email, {
            name: user.name || emailToName(email),
            email,
            color: user.color || emailToColor(email),
        });
    }
    return Array.from(byEmail.values());
}
export function reconcileRemoteAwarenessStates(states, localClientId, remoteStates) {
    const incoming = new Set();
    const added = [];
    const updated = [];
    const removed = [];
    for (const remote of remoteStates) {
        if (!Number.isFinite(remote.clientId) ||
            remote.clientId === localClientId) {
            continue;
        }
        incoming.add(remote.clientId);
        const hadState = states.has(remote.clientId);
        states.set(remote.clientId, remote.state);
        (hadState ? updated : added).push(remote.clientId);
    }
    for (const clientId of Array.from(states.keys())) {
        if (clientId === localClientId)
            continue;
        if (incoming.has(clientId))
            continue;
        states.delete(clientId);
        removed.push(clientId);
    }
    return { added, updated, removed };
}
// Base64 helpers
function uint8ArrayToBase64(arr) {
    let binary = "";
    for (let i = 0; i < arr.length; i++) {
        binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
}
function base64ToUint8Array(b64) {
    const binary = atob(b64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        arr[i] = binary.charCodeAt(i);
    }
    return arr;
}
export function useCollaborativeDoc(options) {
    const { docId, pollInterval = 2000, pauseWhenHidden = true, baseUrl = agentNativePath("/_agent-native/collab"), requestSource, user, } = options;
    // Stable Y.Doc per docId
    const ydoc = useMemo(() => {
        if (!docId)
            return null;
        return new Y.Doc();
    }, [docId]);
    // Stable Awareness per ydoc
    const awareness = useMemo(() => {
        if (!ydoc)
            return null;
        return new Awareness(ydoc);
    }, [ydoc]);
    const [isLoading, setIsLoading] = useState(!!docId);
    const [isSynced, setIsSynced] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]);
    const [agentActive, setAgentActive] = useState(false);
    const [agentPresent, setAgentPresent] = useState(false);
    // Set when the initial state fetch returns 404/403 — stops the awareness
    // poll so we don't spam the console with errors against a doc that doesn't
    // exist or isn't accessible.
    const [docMissing, setDocMissing] = useState(false);
    const agentTimerRef = useRef(null);
    const pollVersionRef = useRef(0);
    // Set local awareness state (user info for cursor labels)
    useEffect(() => {
        if (!awareness || !user)
            return;
        awareness.setLocalStateField("user", {
            name: user.name,
            email: user.email,
            color: user.color,
        });
    }, [awareness, user?.name, user?.email, user?.color]);
    // Track active users from awareness changes
    useEffect(() => {
        if (!awareness)
            return;
        const updateUsers = () => {
            const users = [];
            let hasAgent = false;
            awareness.getStates().forEach((state, clientId) => {
                if (clientId === ydoc?.clientID)
                    return; // Skip self
                if (state.user) {
                    users.push(state.user);
                    if (state.user.email === "agent@system") {
                        hasAgent = true;
                    }
                }
            });
            setActiveUsers(dedupeCollabUsersByEmail(users));
            setAgentPresent(hasAgent);
        };
        awareness.on("change", updateUsers);
        return () => {
            awareness.off("change", updateUsers);
        };
    }, [awareness, ydoc]);
    // Clean up on unmount or docId change
    useEffect(() => {
        return () => {
            awareness?.destroy();
            ydoc?.destroy();
        };
    }, [ydoc, awareness]);
    // Fetch server state and apply to existing doc
    useEffect(() => {
        if (!ydoc || !docId) {
            setIsLoading(false);
            return;
        }
        let cancelled = false;
        setIsLoading(true);
        setIsSynced(false);
        setDocMissing(false);
        fetch(`${baseUrl}/${docId}/state`)
            .then(async (res) => {
            if (cancelled)
                return;
            if (res.status === 404 || res.status === 403) {
                setDocMissing(true);
                setIsLoading(false);
                setIsSynced(true);
                return;
            }
            const data = (await res.json().catch(() => null));
            if (data?.state) {
                const binary = base64ToUint8Array(data.state);
                if (binary.length > 4) {
                    Y.applyUpdate(ydoc, binary);
                }
            }
            setIsLoading(false);
            setIsSynced(true);
        })
            .catch(() => {
            if (cancelled)
                return;
            setIsLoading(false);
            setIsSynced(true);
        });
        return () => {
            cancelled = true;
        };
    }, [ydoc, docId, baseUrl]);
    // Send local updates to server
    useEffect(() => {
        if (!ydoc || !docId || docMissing)
            return;
        const handler = (update, origin) => {
            if (origin === "remote")
                return;
            fetch(`${baseUrl}/${docId}/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    update: uint8ArrayToBase64(update),
                    requestSource,
                }),
            });
        };
        ydoc.on("update", handler);
        return () => {
            ydoc.off("update", handler);
        };
    }, [ydoc, docId, baseUrl, requestSource, docMissing]);
    // Poll for remote doc updates + awareness sync
    useEffect(() => {
        if (!ydoc || !docId || docMissing)
            return;
        let stopped = false;
        let timer = null;
        function schedulePoll() {
            if (stopped)
                return;
            if (pauseWhenHidden && isDocumentHidden())
                return;
            timer = setTimeout(poll, pollInterval);
        }
        async function poll() {
            if (stopped)
                return;
            try {
                // Poll for document updates
                const res = await fetch(agentNativePath(`/_agent-native/poll?since=${pollVersionRef.current}`));
                if (!res.ok)
                    throw new Error("HTTP " + res.status);
                const data = await res.json();
                const { version, events } = data;
                for (const evt of events) {
                    if (evt.source === "collab" && evt.docId === docId && evt.update) {
                        if (requestSource && evt.requestSource === requestSource)
                            continue;
                        Y.applyUpdate(ydoc, base64ToUint8Array(evt.update), "remote");
                        // Show agent presence indicator briefly
                        if (evt.requestSource === "agent") {
                            setAgentActive(true);
                            if (agentTimerRef.current)
                                clearTimeout(agentTimerRef.current);
                            agentTimerRef.current = setTimeout(() => setAgentActive(false), 3000);
                        }
                    }
                }
                pollVersionRef.current = version;
                // Sync awareness (cursor positions)
                if (awareness) {
                    const localState = awareness.getLocalState();
                    if (localState) {
                        const awarenessRes = await fetch(`${baseUrl}/${docId}/awareness`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                clientId: ydoc.clientID,
                                state: JSON.stringify(localState),
                            }),
                        });
                        if (awarenessRes.ok) {
                            const awarenessData = await awarenessRes.json();
                            const remoteStates = [];
                            for (const remote of awarenessData.states || []) {
                                try {
                                    const remoteState = JSON.parse(remote.state);
                                    remoteStates.push({
                                        clientId: Number(remote.clientId),
                                        state: remoteState,
                                    });
                                }
                                catch {
                                    // Invalid state — skip
                                }
                            }
                            const changes = reconcileRemoteAwarenessStates(awareness.getStates(), ydoc.clientID, remoteStates);
                            if (changes.added.length ||
                                changes.updated.length ||
                                changes.removed.length) {
                                awareness.emit("change", [changes, "remote"]);
                            }
                        }
                    }
                }
            }
            catch {
                // Network error — retry next interval
            }
            schedulePoll();
        }
        function pollNow() {
            if (pauseWhenHidden && isDocumentHidden())
                return;
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            void poll();
        }
        function handleVisibilityChange() {
            if (document.visibilityState === "visible") {
                pollNow();
            }
            else if (pauseWhenHidden && timer) {
                clearTimeout(timer);
                timer = null;
            }
        }
        if (!pauseWhenHidden || !isDocumentHidden()) {
            void poll();
        }
        window.addEventListener("focus", pollNow);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            stopped = true;
            if (timer)
                clearTimeout(timer);
            window.removeEventListener("focus", pollNow);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [
        ydoc,
        awareness,
        docId,
        pollInterval,
        pauseWhenHidden,
        requestSource,
        baseUrl,
        docMissing,
    ]);
    return {
        ydoc,
        awareness,
        isLoading,
        isSynced,
        activeUsers,
        agentActive,
        agentPresent,
    };
}
//# sourceMappingURL=client.js.map