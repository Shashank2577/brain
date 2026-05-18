export interface ExtensionSlotProps {
    /** Stable slot identifier — convention: `<app>.<area>.<position>`. */
    id: string;
    /** Object pushed to each embedded extension as `slotContext`. */
    context?: Record<string, unknown> | null;
    /** Show a small "+" affordance when the slot has no installs. Default: false. */
    showEmptyAffordance?: boolean;
    /** Optional className applied to the wrapper. */
    className?: string;
    /** Optional className applied to each EmbeddedExtension. */
    toolClassName?: string;
}
/**
 * A named UI slot that user-installed extensions can render into. Apps drop this
 * component wherever they want to allow extensions; the framework handles
 * fetching, sandboxing, context delivery, and lifecycle.
 *
 * Example:
 *
 *   <ExtensionSlot
 *     id="mail.contact-sidebar.bottom"
 *     context={{ contactEmail }}
 *     showEmptyAffordance
 *   />
 */
export declare function ExtensionSlot({ id, context, showEmptyAffordance, className, toolClassName, }: ExtensionSlotProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ExtensionSlot.d.ts.map