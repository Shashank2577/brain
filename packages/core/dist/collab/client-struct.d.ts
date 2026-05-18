/**
 * Client-side React hooks for collaborative structured data (JSON)
 * editing via Yjs Y.Map and Y.Array.
 *
 * Composes on the existing useCollaborativeDoc() hook for transport/sync.
 */
import { type UseCollaborativeDocOptions, type UseCollaborativeDocResult, type CollabUser } from "./client.js";
export interface UseCollaborativeMapOptions extends UseCollaborativeDocOptions {
    /** Name of the shared Y.Map field. Default: "data" */
    fieldName?: string;
}
export interface UseCollaborativeMapResult<T extends Record<string, any>> extends UseCollaborativeDocResult {
    /** Reactive plain JS snapshot of the Y.Map state. Null until loaded. */
    data: T | null;
    /** Replace the full map state via diff. */
    update: (newData: T) => void;
    /** Set a single value at a "/" separated path. */
    patch: (path: string, value: any) => void;
}
export declare function useCollaborativeMap<T extends Record<string, any>>(options: UseCollaborativeMapOptions): UseCollaborativeMapResult<T>;
export interface UseCollaborativeArrayOptions extends UseCollaborativeDocOptions {
    /** Name of the shared Y.Array field. Default: "data" */
    fieldName?: string;
}
export interface UseCollaborativeArrayResult<T> extends UseCollaborativeDocResult {
    /** Reactive plain JS snapshot of the Y.Array state. */
    data: T[];
    /** Append an item to the end. */
    push: (item: T) => void;
    /** Insert an item at a specific index. */
    insert: (index: number, item: T) => void;
    /** Remove an item at a specific index. */
    remove: (index: number) => void;
    /** Move an item from one index to another. */
    move: (from: number, to: number) => void;
    /** Update fields on the Y.Map at a specific array index. */
    updateItem: (index: number, patch: Partial<T>) => void;
    /** Replace the entire array contents. */
    replace: (items: T[]) => void;
}
export declare function useCollaborativeArray<T>(options: UseCollaborativeArrayOptions): UseCollaborativeArrayResult<T>;
export type { CollabUser, UseCollaborativeDocOptions, UseCollaborativeDocResult, };
//# sourceMappingURL=client-struct.d.ts.map