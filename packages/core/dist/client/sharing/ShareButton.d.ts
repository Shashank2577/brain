import { type ReactNode } from "react";
export interface ShareButtonProps {
    resourceType: string;
    resourceId: string;
    resourceTitle?: string;
    /** @deprecated No longer affects rendering — trigger always says
     *  "Share". Kept for callsite compatibility. */
    variant?: "compact" | "label";
    /** Notified when the share popover opens or closes. Hosts that render the
     *  button next to an iframe use this to disable the iframe's pointer events
     *  while the popover is open, so popover hover/clicks aren't swallowed. */
    onOpenChange?: (open: boolean) => void;
    /** Optional public/share URL shown as a copyable link in the popover.
     *  This is treated as the primary "Copy link" target — same convention
     *  as Google Docs' Share dialog, which copies the editor URL. */
    shareUrl?: string;
    /** Optional label for the primary copyable link section. */
    shareUrlLabel?: string;
    /** Optional helper text for the primary copyable link section. */
    shareUrlDescription?: ReactNode;
    /** Optional placeholder shown in the share-URL slot when `shareUrl` is
     *  undefined. Use this to explain *why* there's no link yet (e.g. "Publish
     *  this form to get a public response link") instead of leaving the slot
     *  empty. */
    shareUrlPlaceholder?: ReactNode;
    /** Optional secondary copyable link (e.g. a presentation / read-only
     *  surface for the same resource). Anyone with at least viewer access
     *  can open it — access is enforced on the resource itself, not the
     *  URL shape, so we never gate this behind visibility. */
    secondaryShareUrl?: string;
    /** Optional label for the secondary copyable link. */
    secondaryShareUrlLabel?: string;
    /** Optional helper text for the secondary copyable link. */
    secondaryShareUrlDescription?: ReactNode;
    /** @deprecated No longer enforced — access is checked on the resource,
     *  not the URL shape, mirroring Google Slides. Kept for callsite
     *  compatibility; the prop is now a no-op. */
    shareUrlRequiresPublic?: boolean;
    /** @deprecated See `shareUrlRequiresPublic`. No longer rendered. */
    shareUrlUnavailableDescription?: ReactNode;
    /** Optional template-specific copy for the visibility picker. */
    visibilityCopy?: Partial<Record<Visibility, {
        label?: string;
        description?: string;
    }>>;
    /** Optional note rendered between general access and the copyable link. */
    accessNote?: ReactNode;
}
type Visibility = "private" | "org" | "public";
/**
 * Framework share control. Renders a shadcn-outline-styled trigger that
 * opens a Google-Docs-style popover anchored beneath it. Uses Tailwind
 * + CSS variables so the same component renders natively in light and
 * dark mode in any shadcn template.
 */
export declare function ShareButton(props: ShareButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ShareButton.d.ts.map