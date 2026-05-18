import type { Attachment } from "@assistant-ui/react";
export interface PastedTextChipProps {
    attachment: Attachment;
    onRemove?: (id: string) => void;
    /** Compact variant rendered inside sent user messages. */
    compact?: boolean;
}
export declare function PastedTextChip({ attachment, onRemove, compact, }: PastedTextChipProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=PastedTextChip.d.ts.map