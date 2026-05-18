export interface EmbeddedExtensionProps {
    extensionId: string;
    /** Slot identifier passed via the iframe URL so the extension runtime knows it's
     * embedded and enables auto-resize. */
    slotId: string;
    /** Object pushed into the extension as `window.slotContext`. Re-posted whenever
     * the host re-renders with a new context. */
    context?: Record<string, unknown> | null;
    /** Optional className applied to the iframe container. */
    className?: string;
    /** Initial iframe height before content reports a real height. */
    initialHeight?: number;
}
/**
 * Renders a extension inline as a small auto-sized iframe — for use inside an
 * `<ExtensionSlot>`. Different from `<ExtensionViewer>` (which is full-page with a
 * toolbar): no header, sized to content, receives a `slotContext`.
 */
export declare function EmbeddedExtension({ extensionId, slotId, context, className, initialHeight, }: EmbeddedExtensionProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=EmbeddedExtension.d.ts.map