import { PinStorage, Pin, PinStatus, FrameworkInfo, ElementContext, ElementInfo, FrameworkAdapter, ComponentInfo, SourceLocation } from './types/index.js';

declare class MemoryStore implements PinStorage {
    private pins;
    load(pageUrl: string): Promise<Pin[]>;
    save(pin: Pin): Promise<void>;
    update(id: string, patch: Partial<Pin>): Promise<void>;
    delete(id: string): Promise<void>;
    list(filter?: {
        pageUrl?: string;
        status?: PinStatus;
    }): Promise<Pin[]>;
    clear(pageUrl?: string): Promise<void>;
}

interface SelectorOptions {
    /** Timeout for selector generation (ms) */
    timeoutMs?: number;
    /** Additional class names to skip */
    skipClassPatterns?: RegExp[];
}
/**
 * Generate a unique, human-readable CSS selector for an element.
 * Uses @medv/finder (MIT) with configuration to skip CSS-in-JS hashes.
 */
declare function buildSelector(element: Element, options?: SelectorOptions): string;

/**
 * Extract comprehensive metadata from a DOM element.
 */
declare function extractElementInfo(element: Element): ElementInfo;
/**
 * Build a full ElementContext including HTML snippet and framework info.
 */
declare function buildElementContext(element: Element, frameworkInfo?: FrameworkInfo): ElementContext;

/**
 * Register a framework adapter. Adapters are tried in registration order.
 */
declare function registerAdapter(adapter: FrameworkAdapter): void;
/**
 * Auto-detect the current framework by trying each adapter's detect() method.
 * Returns the first matching adapter, or the generic fallback.
 */
declare function detectFramework(): FrameworkAdapter;
/**
 * Get component info for an element using the detected framework adapter.
 */
declare function getComponentInfo(element: Element): ComponentInfo | null;
/**
 * Get source location for an element using the detected framework adapter.
 */
declare function getSourceLocation(element: Element): SourceLocation | null;

interface FreezeOptions {
    /** Freeze JS timers (opt-in, disabled by default) */
    jsTimers?: boolean;
}
/**
 * Freeze all animations, transitions, React updates, and media.
 * Call unfreeze() to restore.
 */
declare function freeze(_elements?: Element[], options?: FreezeOptions): void;
/**
 * Unfreeze everything and restore normal behavior.
 */
declare function unfreeze(): void;
/**
 * Check if freeze is currently active.
 */
declare function isFreezeActive(): boolean;

/**
 * Open a file in the user's editor. Tries vscode:// protocol first,
 * falls back to a fetch to /api/open-file.
 */
declare function openFile(filePath: string, lineNumber?: number): Promise<void>;

export { MemoryStore as M, buildSelector as a, buildElementContext as b, getSourceLocation as c, detectFramework as d, extractElementInfo as e, freeze as f, getComponentInfo as g, isFreezeActive as i, openFile as o, registerAdapter as r, unfreeze as u };
