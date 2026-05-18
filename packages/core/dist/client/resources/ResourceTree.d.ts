import React from "react";
import type { TreeNode, ResourceMeta } from "./use-resources.js";
export interface ResourceTreeProps {
    tree: TreeNode[];
    selectedId: string | null;
    onSelect: (resource: ResourceMeta) => void;
    onCreateFile: (parentPath: string, name: string) => void;
    onCreateFolder: (parentPath: string, name: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, newPath: string) => void;
    onDrop: (files: FileList) => void;
    /** Section title displayed as heading */
    title?: string;
    /** Tooltip for the section heading */
    titleTooltip?: string;
    /** Whether this section's tree is still loading */
    isLoading?: boolean;
    /** Resource id currently being deleted (shows spinner + muted row) */
    deletingId?: string | null;
    /** When true, hide create/delete/rename/upload affordances. Files stay readable. */
    readOnly?: boolean;
    /** Optional hint shown next to the heading (e.g. "Read only") */
    headingHint?: React.ReactNode;
}
export declare function ResourceTree({ tree, selectedId, onSelect, onCreateFile, onCreateFolder, onDelete, onDrop, title, titleTooltip, isLoading, deletingId, readOnly, headingHint, }: ResourceTreeProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ResourceTree.d.ts.map