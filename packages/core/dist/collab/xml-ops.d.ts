/**
 * Operations on Y.XmlFragment for ProseMirror-based collaborative editing.
 *
 * These produce minimal Yjs operations so the client-side ySyncPlugin
 * applies targeted ProseMirror transactions (preserving cursor/selection).
 */
import * as Y from "yjs";
/**
 * Walk a Y.XmlFragment tree and replace the first occurrence of `find`
 * with `replace` in Y.XmlText nodes.
 *
 * Returns true if a replacement was made, false if text was not found.
 */
export declare function searchAndReplaceInYXml(element: Y.XmlFragment | Y.XmlElement, find: string, replace: string): boolean;
/**
 * Extract all plain text from a Y.XmlFragment tree.
 * Joins block-level elements with newlines.
 */
export declare function extractTextFromYXml(element: Y.XmlFragment | Y.XmlElement): string;
//# sourceMappingURL=xml-ops.d.ts.map