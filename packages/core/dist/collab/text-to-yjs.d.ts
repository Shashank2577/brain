/**
 * Bridge between plain text and Yjs CRDT operations.
 *
 * Converts text diffs into minimal Yjs Y.Text operations (insert/delete)
 * so that agent text changes merge cleanly with concurrent editor edits.
 */
import * as Y from "yjs";
/**
 * Apply new text content to a Y.Text field, computing a minimal diff
 * and translating it into Yjs insert/delete operations.
 *
 * Returns the binary Yjs update produced by the transaction.
 */
export declare function applyTextToYDoc(doc: Y.Doc, fieldName: string, newText: string, origin?: string): Uint8Array;
/**
 * Initialize a Y.Doc with text content (for seeding from existing data).
 * Returns the full document state as a Uint8Array.
 */
export declare function initYDocWithText(fieldName: string, text: string): {
    doc: Y.Doc;
    state: Uint8Array;
};
//# sourceMappingURL=text-to-yjs.d.ts.map