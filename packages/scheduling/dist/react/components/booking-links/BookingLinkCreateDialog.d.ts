export interface BookingLinkCreateDraft {
    title: string;
    slug: string;
    length: number;
    description: string;
}
export interface BookingLinkCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /**
     * URL prefix shown before the slug input, e.g.
     * "calendar.app/meet/alice/" or "cal.local/steve@foo.com/"
     */
    slugPrefix: string;
    /** Default duration in minutes. Defaults to 30. */
    defaultLength?: number;
    onSubmit: (draft: BookingLinkCreateDraft) => void | Promise<void>;
    /** Button label — defaults to "Continue". */
    submitLabel?: string;
}
export declare function BookingLinkCreateDialog(props: BookingLinkCreateDialogProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=BookingLinkCreateDialog.d.ts.map