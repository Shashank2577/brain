import { P as PinStorage, a as Pin, b as PinStatus, F as FrameworkInfo, E as ElementContext, c as ElementInfo, d as FrameworkAdapter, C as ComponentInfo, S as SourceLocation, O as OutputFormat, A as AgentOutput, Q as QueuedAnnotation, e as PluginHooks, f as Plugin, g as PinpointAPI, h as PinpointConfig } from './index-NvFcZ4SO.js';
export { i as ContextMenuAction, j as CopyContext, D as DrawStroke, k as DrawToolType, l as PinEvent, T as TextNote, m as ToolbarMode } from './index-NvFcZ4SO.js';
import { z } from 'zod';

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

declare class RestClient implements PinStorage {
    private endpoint;
    constructor(endpoint: string);
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

declare const ElementInfoSchema: z.ZodObject<{
    tagName: z.ZodString;
    id: z.ZodOptional<z.ZodString>;
    classNames: z.ZodArray<z.ZodString>;
    selector: z.ZodString;
    textContent: z.ZodOptional<z.ZodString>;
    boundingRect: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>;
    computedStyles: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    ariaAttributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    dataAttributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    domPath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const FrameworkInfoSchema: z.ZodObject<{
    framework: z.ZodString;
    componentPath: z.ZodString;
    sourceFile: z.ZodOptional<z.ZodString>;
    frameworkVersion: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const PinSchema: z.ZodObject<{
    id: z.ZodString;
    pageUrl: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    author: z.ZodOptional<z.ZodString>;
    comment: z.ZodString;
    element: z.ZodObject<{
        tagName: z.ZodString;
        id: z.ZodOptional<z.ZodString>;
        classNames: z.ZodArray<z.ZodString>;
        selector: z.ZodString;
        textContent: z.ZodOptional<z.ZodString>;
        boundingRect: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, z.core.$strip>;
        computedStyles: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        ariaAttributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        dataAttributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        domPath: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    framework: z.ZodOptional<z.ZodObject<{
        framework: z.ZodString;
        componentPath: z.ZodString;
        sourceFile: z.ZodOptional<z.ZodString>;
        frameworkVersion: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    status: z.ZodObject<{
        state: z.ZodEnum<{
            open: "open";
            acknowledged: "acknowledged";
            resolved: "resolved";
            dismissed: "dismissed";
        }>;
        changedAt: z.ZodString;
        changedBy: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;

interface ElementPickerOptions {
    /** Called on hover with the element under the cursor */
    onHover?: (element: Element | null, rect: DOMRect | null) => void;
    /** Called after stable hover (100ms) with full element context */
    onStableHover?: (element: Element) => void;
    /** Called when an element is clicked/selected */
    onSelect?: (element: Element) => void;
    /** Elements to ignore (e.g., pinpoint's own UI) */
    ignoreSelector?: string;
    /** Whether to block page interactions during selection */
    blockInteractions?: boolean;
}
declare class ElementPicker {
    private active;
    private paused;
    private hoveredElement;
    private rafId;
    private stableTimeout;
    private lastTarget;
    private options;
    private handleMouseMove;
    private handleClick;
    private handleKeyDown;
    constructor(options?: ElementPickerOptions);
    /**
     * Check if an event originates from Pinpoint's own UI.
     * Uses composedPath() to cross Shadow DOM boundaries.
     */
    private isOwnUI;
    private shouldIgnore;
    private pierceElementFromPoint;
    private processHover;
    private clearStableTimeout;
    activate(): void;
    deactivate(): void;
    /** Update blockInteractions at runtime (called from settings toggle) */
    setBlockInteractions(value: boolean): void;
    /** Pause picking without removing listeners (e.g., while popup is open) */
    pause(): void;
    /** Resume picking after pause */
    resume(): void;
    isPaused(): boolean;
    isActive(): boolean;
    /** Get the currently hovered element */
    getHoveredElement(): Element | null;
    dispose(): void;
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

interface DragSelectOptions {
    /** Minimum coverage threshold (0-1) for an element to be considered selected */
    coverageThreshold?: number;
    /** Called when drag starts */
    onDragStart?: (rect: DOMRect) => void;
    /** Called during drag with the current selection rectangle */
    onDragMove?: (rect: DOMRect) => void;
    /** Called when drag ends with selected elements */
    onDragEnd?: (elements: Element[]) => void;
    /** Elements to ignore */
    ignoreSelector?: string;
}
declare class DragSelect {
    private active;
    private dragging;
    private startX;
    private startY;
    private options;
    private handleMouseDown;
    private handleMouseMove;
    private handleMouseUp;
    constructor(options?: DragSelectOptions);
    private buildRect;
    private getElementsInRect;
    activate(): void;
    deactivate(): void;
    isDragging(): boolean;
    dispose(): void;
}

interface TextSelection {
    /** The selected text */
    text: string;
    /** The container element */
    container: Element;
    /** Start offset within the container */
    startOffset: number;
    /** End offset within the container */
    endOffset: number;
    /** Surrounding context (text before + selected + text after) */
    context: string;
    /** Bounding rect of the selection */
    rect: DOMRect;
}
interface TextSelectOptions {
    /** Called when text selection changes */
    onSelect?: (selection: TextSelection | null) => void;
    /** Minimum characters to trigger selection callback */
    minLength?: number;
}
declare class TextSelect {
    private active;
    private options;
    private handleSelectionChange;
    private debounceTimer;
    constructor(options?: TextSelectOptions);
    private getTextSelection;
    activate(): void;
    deactivate(): void;
    /** Get the current text selection, if any */
    getCurrentSelection(): TextSelection | null;
    dispose(): void;
}

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

declare const reactAdapter: FrameworkAdapter;

declare const vueAdapter: FrameworkAdapter;

declare const genericAdapter: FrameworkAdapter;

/**
 * Format pins into a human/agent-readable markdown string.
 */
declare function formatPins(pins: Pin[], format?: OutputFormat): string;

/**
 * Format a single pin into rich context for the agent.
 *
 * ```
 * [Annotation on <button class="primary"> in <Header> component]
 * Comment: "This button should be blue instead of gray"
 * Element: button.primary at (120, 45)
 * Source: src/components/Header.tsx:42
 * ```
 */
declare function formatRichPinContext(pin: Pin): string;
/**
 * Format pins for agent chat.
 * The full formatted output goes into message (visible in chat UI) so the user
 * can see exactly what context the agent is working with.
 */
declare function formatPinsForAgent(pins: Pin[], format?: OutputFormat): AgentOutput;
/**
 * Format queued annotations for batch sending.
 */
declare function formatQueueForAgent(queue: QueuedAnnotation[], format?: OutputFormat): AgentOutput;

/**
 * Register a plugin.
 */
declare function registerPlugin(plugin: Plugin, api?: PinpointAPI): void;
/**
 * Unregister a plugin by name.
 */
declare function unregisterPlugin(name: string): void;
/**
 * Get all registered plugin names.
 */
declare function getPlugins(): string[];
/**
 * Dispatch a hook to all registered handlers.
 */
declare function dispatchHook(name: keyof PluginHooks, ...args: any[]): void;

declare const agentNativePlugin: Plugin;

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
 * Escape HTML entities in a string.
 * Use on all DOM-derived strings before rendering or including in output.
 */
declare function escapeHtml(str: string): string;
/**
 * Sanitize a string by removing control characters and limiting length.
 */
declare function sanitizeString(str: string, maxLength?: number): string;

/**
 * Validate that a message origin is allowed.
 * Used for postMessage security when communicating with frames.
 */
declare function isAllowedOrigin(origin: string, allowedOrigins?: string[]): boolean;

/**
 * Open a file in the user's editor. Tries vscode:// protocol first,
 * falls back to a fetch to /api/open-file.
 */
declare function openFile(filePath: string, lineNumber?: number): Promise<void>;

interface MountResult {
    dispose: () => void;
    shadowRoot: ShadowRoot;
    container: HTMLDivElement;
}
/**
 * Mount the Pinpoint overlay into the DOM.
 * Uses Shadow DOM for CSS isolation.
 * Singleton guard prevents multiple instances (HMR-safe).
 */
declare function mountPinpoint(config?: PinpointConfig, target?: HTMLElement): MountResult;
/**
 * Unmount Pinpoint from the DOM.
 */
declare function unmountPinpoint(): void;

declare class PinMarkerManager {
    private markerColor;
    private markers;
    private updateTimer;
    private onClick;
    private onToggleSelect;
    private selectedPinIds;
    private showCheckboxes;
    constructor(markerColor?: string);
    setOnClick(handler: (pin: Pin) => void): void;
    setOnToggleSelect(handler: (pin: Pin) => void): void;
    setSelectedPins(ids: Set<string>): void;
    setShowCheckboxes(show: boolean): void;
    update(pins: Pin[]): void;
    private updateCheckboxVisual;
    private updateMarker;
    startTracking(pins: Pin[]): void;
    stopTracking(): void;
    dispose(): void;
}

export { AgentOutput, ComponentInfo, DragSelect, ElementContext, ElementInfo, ElementInfoSchema, ElementPicker, FrameworkAdapter, FrameworkInfo, FrameworkInfoSchema, MemoryStore, OutputFormat, Pin, PinMarkerManager, PinSchema, PinStatus, PinStorage, PinpointAPI, PinpointConfig, Plugin, PluginHooks, QueuedAnnotation, RestClient, SourceLocation, TextSelect, agentNativePlugin, buildElementContext, buildSelector, detectFramework, dispatchHook, escapeHtml, extractElementInfo, formatPins, formatPinsForAgent, formatQueueForAgent, formatRichPinContext, freeze, genericAdapter, getComponentInfo, getPlugins, getSourceLocation, isAllowedOrigin, isFreezeActive, mountPinpoint, openFile, reactAdapter, registerAdapter, registerPlugin, sanitizeString, unfreeze, unmountPinpoint, unregisterPlugin, vueAdapter };
