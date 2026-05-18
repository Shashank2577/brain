export interface UsePinchZoomOptions {
    /** Scrolling viewport that receives the gesture. The scaled content should
     *  live inside this element. */
    containerRef: React.RefObject<HTMLElement | null>;
    /** Current zoom as a percentage (100 = 100%). */
    zoom: number;
    /** Setter for the zoom value (called with the next percentage). */
    setZoom: (next: number) => void;
    /** Minimum zoom percentage. Default 25. */
    min?: number;
    /** Maximum zoom percentage. Default 400. */
    max?: number;
    /** When true (default), adjusts container scroll so the point under the
     *  cursor stays under the cursor during wheel-zoom. Assumes the scaled
     *  content uses `transform-origin: top left` (or equivalent — e.g. resizing
     *  the inner container's width proportionally to zoom). Disable for layouts
     *  with `transform-origin: center center`. */
    zoomToCursor?: boolean;
    /** Disable the hook entirely without unmounting it. */
    enabled?: boolean;
}
/**
 * Pinch-to-zoom for canvas-style editors. Wires the trackpad pinch / Cmd+scroll
 * wheel gesture and 2-pointer touchscreen pinch onto a scrolling container.
 *
 * Trackpad pinch is detected via `wheel` events with `ctrlKey: true` — browsers
 * have synthesized that since ~2015 specifically so web apps can intercept the
 * gesture. `metaKey` is also accepted so Cmd+scroll on Mac feels native.
 *
 * The hook only calls `setZoom(next)` — it doesn't render anything. Templates
 * decide how to translate the zoom percentage into visual scaling (CSS
 * `transform: scale()`, width/height, etc.).
 */
export declare function usePinchZoom({ containerRef, zoom, setZoom, min, max, zoomToCursor, enabled, }: UsePinchZoomOptions): void;
//# sourceMappingURL=use-pinch-zoom.d.ts.map