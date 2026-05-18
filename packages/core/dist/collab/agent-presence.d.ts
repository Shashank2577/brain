/**
 * Server-side agent presence lifecycle for collaborative editing.
 *
 * Provides enter/leave semantics so the agent behaves like a real
 * collaborator — it "enters" a document, its edits are visible with
 * durable presence, and it "leaves" when done. Actions call these
 * instead of hand-rolling HTTP awareness calls.
 */
/**
 * Mark the agent as present on a document.
 *
 * Sets an awareness entry for the agent and starts a heartbeat that
 * keeps it alive. If the agent is already present on this doc, just
 * refreshes `lastSeen` without creating a second interval.
 */
export declare function agentEnterDocument(docId: string, metadata?: Record<string, unknown>): void;
/**
 * Remove the agent's presence from a document.
 *
 * Clears the awareness entry and stops the heartbeat.
 */
export declare function agentLeaveDocument(docId: string): void;
/**
 * Update the agent's awareness state to include selection info
 * (e.g., which track, panel, or element the agent is working on).
 */
export declare function agentUpdateSelection(docId: string, selection: Record<string, unknown>): void;
/**
 * Apply search-and-replace edits incrementally so each one appears
 * as a separate poll event to connected clients.
 *
 * Enters the document before editing and leaves in a finally block.
 */
export declare function agentApplyEditsIncrementally(docId: string, edits: Array<{
    find: string;
    replace: string;
}>, options?: {
    delayMs?: number;
}): Promise<void>;
/**
 * Apply structured data patches incrementally so each one appears
 * as a separate poll event to connected clients.
 *
 * Enters the document before patching and leaves in a finally block.
 *
 * NOTE: `applyPatchOps` may not exist yet (Phase 1 creates it).
 * This will compile once Phase 1 finishes.
 */
export declare function agentApplyPatchesIncrementally(docId: string, fieldName: string, patches: Array<{
    op: string;
    path: string;
    value?: unknown;
    index?: number;
    from?: number;
    to?: number;
}>, options?: {
    delayMs?: number;
}): Promise<void>;
//# sourceMappingURL=agent-presence.d.ts.map