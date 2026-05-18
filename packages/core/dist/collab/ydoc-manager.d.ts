/**
 * Server-side Yjs document manager with LRU caching and SQL persistence.
 */
import * as Y from "yjs";
import { type PatchOp } from "./json-to-yjs.js";
/**
 * Get or load a Yjs document by ID. Creates a new empty doc if none exists.
 */
export declare function getDoc(docId: string): Promise<Y.Doc>;
/**
 * Apply a binary Yjs update (from a client) to a document.
 * Persists the result and emits a change event.
 */
export declare function applyUpdate(docId: string, update: Uint8Array, requestSource?: string): Promise<void>;
/**
 * Apply a text change to a document. Computes the minimal diff and
 * converts it to Yjs operations.
 *
 * Returns the text snapshot after the update.
 */
export declare function applyText(docId: string, newText: string, fieldName?: string, requestSource?: string): Promise<string>;
/**
 * Search-and-replace text within a Y.XmlFragment (ProseMirror tree).
 * Produces minimal Yjs operations for cursor-preserving updates.
 *
 * Returns whether the text was found and the binary update.
 */
export declare function searchAndReplace(docId: string, find: string, replace: string, requestSource?: string): Promise<{
    found: boolean;
    update: Uint8Array;
}>;
/**
 * Get the current text content of a document field.
 */
export declare function getText(docId: string, fieldName?: string): Promise<string>;
/**
 * Get the full document state as a Uint8Array.
 */
export declare function getState(docId: string): Promise<Uint8Array>;
/**
 * Get an incremental update relative to a client's state vector.
 */
export declare function getIncUpdate(docId: string, clientStateVector: Uint8Array): Promise<Uint8Array>;
/**
 * Seed a document from existing text content (for migration).
 * Only seeds if no collab state exists yet.
 */
export declare function seedFromText(docId: string, text: string, fieldName?: string): Promise<void>;
/**
 * Apply a full JSON update to a document. Computes the minimal diff
 * and converts it to Yjs operations on Y.Map/Y.Array.
 */
export declare function applyJson(docId: string, newJson: any, fieldName?: string, type?: "map" | "array", requestSource?: string): Promise<void>;
/**
 * Apply surgical JSON patch operations to a document.
 */
export declare function applyPatchOps(docId: string, ops: PatchOp[], fieldName?: string, requestSource?: string): Promise<void>;
/**
 * Get the current JSON state of a document field.
 */
export declare function getJson(docId: string, fieldName?: string): Promise<any>;
/**
 * Seed a document from existing JSON content (for migration).
 * Only seeds if no collab state exists yet.
 */
export declare function seedFromJson(docId: string, json: any, fieldName?: string, type?: "map" | "array"): Promise<void>;
/**
 * Release a document from the in-memory cache.
 */
export declare function releaseDoc(docId: string): void;
//# sourceMappingURL=ydoc-manager.d.ts.map