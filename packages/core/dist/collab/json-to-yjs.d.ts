/**
 * Bidirectional JSON <-> Yjs conversion and diffing.
 *
 * Converts plain JSON objects/arrays into Y.Map/Y.Array structures and back,
 * with minimal-diff application for collaborative editing of structured data
 * (timelines, dashboards, design objects, etc.).
 */
import * as Y from "yjs";
export type PatchOp = {
    op: "set";
    path: string;
    value: any;
} | {
    op: "insert";
    path: string;
    index: number;
    value: any;
} | {
    op: "delete";
    path: string;
} | {
    op: "move";
    path: string;
    from: number;
    to: number;
};
/**
 * Populate a Y.Map or Y.Array from plain JSON on a Y.Doc.
 * Recursive: objects become nested Y.Map, arrays become nested Y.Array.
 * Primitives (string, number, boolean, null) stay as-is.
 */
export declare function seedYDocFromJson(doc: Y.Doc, fieldName: string, json: any, type: "map" | "array"): void;
/**
 * Serialize a Y.Map to a plain JS object.
 * Recurses into nested Y.Map/Y.Array.
 */
export declare function yMapToJson(ymap: Y.Map<any>): Record<string, any>;
/**
 * Serialize a Y.Array to a plain JS array.
 * Recurses into nested Y.Map/Y.Array.
 */
export declare function yArrayToJson(yarray: Y.Array<any>): any[];
/**
 * Get the shared type by name from a Y.Doc and serialize it to JSON.
 * Returns the plain JS object or array.
 */
export declare function yDocToJson(doc: Y.Doc, fieldName: string): any;
/**
 * Diff new JSON against current Y.Map/Y.Array state, apply minimal
 * Yjs operations in a transaction. Returns the binary update captured
 * from the transaction.
 *
 * For arrays, matches items by `id` field if present (stable identity),
 * falls back to index matching.
 */
export declare function applyJsonDiff(doc: Y.Doc, fieldName: string, newJson: any, origin?: string): Uint8Array;
/**
 * Apply surgical patch operations to a Y.Doc's shared data.
 * Path strings use "/" as separator (e.g. "tracks/0/endFrame").
 *
 * Returns the binary update captured from the transaction.
 */
export declare function applyJsonPatch(doc: Y.Doc, fieldName: string, ops: PatchOp[], origin?: string): Uint8Array;
/**
 * Create a new Y.Doc pre-populated with JSON data.
 * Returns the doc and its full state as a Uint8Array.
 */
export declare function initYDocWithJson(fieldName: string, json: any, type: "map" | "array"): {
    doc: Y.Doc;
    state: Uint8Array;
};
//# sourceMappingURL=json-to-yjs.d.ts.map