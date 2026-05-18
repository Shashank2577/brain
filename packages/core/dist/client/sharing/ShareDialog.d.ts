import { type ReactNode } from "react";
export interface ShareDialogProps {
    open: boolean;
    onClose: () => void;
    resourceType: string;
    resourceId: string;
    resourceTitle?: string;
    /**
     * When provided, enables the "Link" tab with a copy-link field.
     * Pass the user-facing share URL (e.g. `https://…/share/<id>`).
     */
    shareUrl?: string;
    /**
     * When provided, enables the "Embed" tab with a default iframe snippet.
     * For richer per-resource controls (autoplay, start time, responsive /
     * fixed size), pass `embedTabContent` instead (or in addition) — it
     * replaces the default embed body.
     */
    embedUrl?: string;
    /** Advanced: fully custom Embed tab body. Requires `embedUrl` to enable the tab. */
    embedTabContent?: ReactNode;
    /** Extra content appended to the bottom of the Link tab (e.g. download buttons). */
    linkTabExtras?: ReactNode;
}
/**
 * Framework share dialog. Drop into any template via
 * `<ShareDialog open onClose resourceType resourceId />`. Passing
 * `shareUrl` lights up a Link tab with a copy field; passing `embedUrl`
 * lights up an Embed tab. With neither prop, renders a single Invite +
 * general-access panel (Google-Docs-lite).
 */
export declare function ShareDialog(props: ShareDialogProps): any;
//# sourceMappingURL=ShareDialog.d.ts.map