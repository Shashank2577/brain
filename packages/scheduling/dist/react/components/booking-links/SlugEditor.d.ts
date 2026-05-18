export interface SlugEditorProps {
    host: string;
    /** Path prefix before the username, e.g. "/meet" (calendar) or "" (scheduling). */
    pathPrefix?: string;
    username: string;
    slug: string;
    onUsernameChange?: (next: string) => void;
    onSlugChange: (next: string) => void;
    /** Hide the top label (e.g. inside a compact inline row). */
    hideLabel?: boolean;
    /** Label text. Defaults to "URL". */
    label?: string;
}
export declare function SlugEditor(props: SlugEditorProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SlugEditor.d.ts.map