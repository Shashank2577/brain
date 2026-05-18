export interface CodeRequiredDialogProps {
    open: boolean;
    onClose: () => void;
    /** Label describing the feature that requires code changes */
    featureLabel?: string;
}
/**
 * Modal shown when a user tries to use a code-requiring feature where local
 * source access is unavailable. Offers two paths: Agent Native Desktop or the
 * Builder.io agent.
 * Uses inline styles (no Radix/Tailwind dependency).
 */
export declare function CodeRequiredDialog({ open, onClose, featureLabel, }: CodeRequiredDialogProps): any;
//# sourceMappingURL=CodeRequiredDialog.d.ts.map