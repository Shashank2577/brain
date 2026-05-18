/**
 * Nitro plugin that mounts collaborative editing routes.
 *
 * Templates opt in with one line:
 * ```ts
 * // server/plugins/collab.ts
 * import { createCollabPlugin } from "@agent-native/core/server";
 * export default createCollabPlugin({ table: "documents", contentColumn: "content" });
 * ```
 */
type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
export interface CollabPluginOptions {
    /** Table name containing document content. Default: "documents" */
    table?: string;
    /** Column name for text content. Default: "content" */
    contentColumn?: string;
    /** Column name for the document ID. Default: "id" */
    idColumn?: string;
    /** Whether to auto-seed existing documents on startup. Default: true */
    autoSeed?: boolean;
    /**
     * Callback invoked after a collab update to sync the content column.
     * If not provided, the plugin auto-syncs using table/contentColumn/idColumn.
     */
    onContentSync?: (docId: string, text: string) => Promise<void>;
    /** Content type: "text" for Y.Text (default) or "json" for Y.Map/Y.Array. */
    contentType?: "text" | "json";
    /** Column name for JSON content (used when contentType is "json"). */
    jsonColumn?: string;
    /**
     * The shareable resource type registered via `registerShareableResource`.
     * Used to enforce access checks on collab routes.
     * Omit only for resources that are always public (no sharing model).
     */
    resourceType?: string;
    /**
     * Map the collab document id to the shareable resource id. Many templates
     * use route-specific collab ids (for example, one doc per slide inside a
     * deck) while sharing is enforced at the parent resource level.
     */
    resolveResourceId?: (docId: string) => string | null | Promise<string | null>;
}
export declare function createCollabPlugin(options?: CollabPluginOptions): NitroPluginDef;
export {};
//# sourceMappingURL=collab-plugin.d.ts.map