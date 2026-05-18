export type CustomFieldType = "text" | "email" | "url" | "tel" | "textarea" | "select" | "checkbox";
export interface CustomField {
    id: string;
    label: string;
    type: CustomFieldType;
    required: boolean;
    placeholder?: string;
    pattern?: string;
    patternError?: string;
    options?: string[];
}
export interface CustomFieldsEditorProps {
    fields: CustomField[];
    onChange: (fields: CustomField[]) => void;
    /** Hide the outer label + add button (e.g. if rendered inside its own card). */
    hideLabel?: boolean;
}
export declare function CustomFieldsEditor(props: CustomFieldsEditorProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CustomFieldsEditor.d.ts.map