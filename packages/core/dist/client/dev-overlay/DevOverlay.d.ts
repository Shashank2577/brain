/**
 * <DevOverlay /> — the framework dev/configuration panel.
 *
 * Templates render this once at the root of their app. The user toggles it
 * with Cmd+Ctrl+A (also exposed as `useDevOverlayShortcut`). Panels register
 * via `registerDevPanel`; values for option-style controls persist to
 * localStorage via `useDevOption`.
 *
 * Visibility note: the overlay only mounts when the host explicitly opens it
 * via the keybinding (or the `open` prop). It is dev-only by convention —
 * shipping with the keybinding active in prod is fine because nothing renders
 * unless invoked.
 */
import { type ReactNode } from "react";
import "./builtins.js";
export interface DevOverlayProps {
    /**
     * Force-control the overlay's visibility. When omitted the overlay manages
     * its own state and listens to Cmd+Ctrl+A.
     */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}
export declare function DevOverlay({ open, onOpenChange }?: DevOverlayProps): import("react/jsx-runtime").JSX.Element;
export type { ReactNode };
//# sourceMappingURL=DevOverlay.d.ts.map