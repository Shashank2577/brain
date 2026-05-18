import { type ReactNode } from "react";
interface CreateAppPopoverProps {
    /**
     * Custom trigger element. Defaults to a dashed-border tile that matches the
     * apps grid empty state.
     */
    trigger?: ReactNode;
    /**
     * Override the popover alignment. Defaults to "center" with a 10px offset.
     */
    align?: "start" | "center" | "end";
}
/**
 * Inline two-step app-creation flow: prompt → optional access picker → submit.
 * Used both in the popover form and in the dedicated `/new-app` page so the
 * same UX shows up everywhere a teammate kicks off a new workspace app.
 */
export declare function CreateAppFlow({ onClose, className, }: {
    onClose?: () => void;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function CreateAppPopover({ trigger, align, }: CreateAppPopoverProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=create-app-popover.d.ts.map