/**
 * SQL storage for Yjs collaborative document state.
 *
 * Uses a framework-level `_collab_docs` table (TEXT columns with base64
 * encoding for binary Yjs state) that works across SQLite and Postgres.
 */
/** Load Yjs state as Uint8Array, or null if not found. */
export declare function loadYDocState(docId: string): Promise<Uint8Array | null>;
/** Save Yjs state (Uint8Array) and a plain-text snapshot. */
export declare function saveYDocState(docId: string, state: Uint8Array, textSnapshot: string): Promise<void>;
/** Check if a document has collaborative state. */
export declare function hasCollabState(docId: string): Promise<boolean>;
/** Delete collaborative state for a document. */
export declare function deleteCollabState(docId: string): Promise<void>;
declare function uint8ArrayToBase64(arr: Uint8Array): string;
declare function base64ToUint8Array(b64: string): Uint8Array;
export { uint8ArrayToBase64, base64ToUint8Array };
//# sourceMappingURL=storage.d.ts.map