import type { Resource } from "./use-resources.js";
export interface ResourceEditorProps {
    resource: Resource;
    onSave: (content: string) => void;
    /** Controlled view mode — if provided, the editor won't manage its own view state */
    view?: "visual" | "code";
    onViewChange?: (v: "visual" | "code") => void;
    /** Called whenever save status changes */
    onSaveStatusChange?: (status: "idle" | "saving" | "saved") => void;
    /** When true, the editor's internal toolbar row is hidden */
    hideToolbar?: boolean;
}
export declare function ResourceEditor({ resource, onSave, view: controlledView, onViewChange, onSaveStatusChange, hideToolbar, }: ResourceEditorProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ResourceEditor.d.ts.map