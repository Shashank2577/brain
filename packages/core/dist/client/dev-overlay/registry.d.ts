/**
 * Client-side registry for dev-overlay panels.
 *
 * Panels register at module load (or via React effect) and the overlay reads
 * from this registry on each render. Re-registering the same id replaces the
 * previous panel — templates can override framework defaults.
 */
import type { DevPanel } from "./types.js";
export declare function registerDevPanel(panel: DevPanel): () => void;
export declare function unregisterDevPanel(id: string): void;
export declare function listDevPanels(): DevPanel[];
export declare function subscribeDevPanels(listener: () => void): () => void;
//# sourceMappingURL=registry.d.ts.map