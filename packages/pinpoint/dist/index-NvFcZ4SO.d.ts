type PinStatus = "open" | "acknowledged" | "resolved" | "dismissed";
type DrawToolType = "freehand" | "arrow" | "circle" | "rect" | "text";
interface DrawStroke {
    points: {
        x: number;
        y: number;
    }[];
    color: string;
    lineWidth: number;
    type: "freehand" | "arrow" | "circle" | "rect";
}
interface TextNote {
    x: number;
    y: number;
    text: string;
    color: string;
}
interface QueuedAnnotation {
    id: string;
    pin?: Pin;
    drawings?: DrawStroke[];
    textNotes?: TextNote[];
    timestamp: string;
}
interface AgentOutput {
    message: string;
    context: string;
    submit?: boolean;
}
type ToolbarMode = "select" | "draw" | "queue";
interface Pin {
    id: string;
    pageUrl: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
    comment: string;
    element: ElementInfo;
    framework?: FrameworkInfo;
    status: {
        state: PinStatus;
        changedAt: string;
        changedBy?: string;
    };
}
interface ElementInfo {
    tagName: string;
    id?: string;
    classNames: string[];
    selector: string;
    textContent?: string;
    boundingRect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    computedStyles?: Record<string, string>;
    ariaAttributes?: Record<string, string>;
    dataAttributes?: Record<string, string>;
    domPath?: string;
}
interface FrameworkInfo {
    framework: string;
    componentPath: string;
    sourceFile?: string;
    frameworkVersion?: string;
}
interface ElementContext {
    element: ElementInfo;
    framework?: FrameworkInfo;
    htmlSnippet: string;
    cssSelector: string;
    computedStyles: Record<string, string>;
}
interface ComponentInfo {
    name: string;
    displayName?: string;
    filePath?: string;
    lineNumber?: number;
    props?: Record<string, unknown>;
}
interface SourceLocation {
    file: string;
    line?: number;
    column?: number;
}
interface Plugin {
    name: string;
    setup?(api: PinpointAPI, hooks: PluginHookRegistry): void;
    hooks?: PluginHooks;
    actions?: ContextMenuAction[];
}
interface PluginHooks {
    onElementSelect?(element: Element, info: ElementContext): void;
    onElementHover?(element: Element): void;
    onBeforeCopy?(context: CopyContext): CopyContext | false;
    transformOutput?(output: string): string;
    onPinCreate?(pin: Pin): void;
    onPinResolve?(pin: Pin): void;
}
interface PluginHookRegistry {
    register(hookName: keyof PluginHooks, handler: Function): void;
    unregister(hookName: keyof PluginHooks, handler: Function): void;
}
interface CopyContext {
    pins: Pin[];
    format: OutputFormat;
    output: string;
}
type OutputFormat = "compact" | "standard" | "detailed";
interface ContextMenuAction {
    label: string;
    icon?: string;
    handler(element: Element, context: ElementContext): void;
}
interface PinpointAPI {
    activate(): void;
    deactivate(): void;
    toggle(): void;
    isActive(): boolean;
    copyElement(element: Element): Promise<boolean>;
    getElementContext(element: Element): Promise<ElementContext>;
    freeze(elements?: Element[]): void;
    unfreeze(): void;
    openFile(filePath: string, lineNumber?: number): Promise<void>;
    registerPlugin(plugin: Plugin): void;
    unregisterPlugin(name: string): void;
    getPins(): Pin[];
    createPin(element: Element, comment: string): Pin;
    resolvePin(id: string, message?: string): void;
    dispose(): void;
}
interface PinStorage {
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
interface PinpointConfig {
    /** Target element to mount pinpoint into */
    target?: HTMLElement;
    /** Author name for annotations */
    author?: string;
    /** REST API endpoint for pin storage */
    endpoint?: string;
    /** Color scheme */
    colorScheme?: "auto" | "light" | "dark";
    /** Output detail level */
    outputFormat?: OutputFormat;
    /** Auto-submit to agent chat */
    autoSubmit?: boolean;
    /** Clear pins after sending */
    clearOnSend?: boolean;
    /** Custom bridge for sending annotations to an agent chat */
    sendToAgent?: (output: AgentOutput) => void | Promise<void>;
    /** Block page interactions during annotation */
    blockInteractions?: boolean;
    /** Freeze JS timers (opt-in, disabled by default) */
    freezeJSTimers?: boolean;
    /** Allowed origins for postMessage */
    allowedOrigins?: string[];
    /** Webhook URL for pin events */
    webhookUrl?: string;
    /** Include source file paths in output */
    includeSourcePaths?: boolean;
    /** Plugins */
    plugins?: Plugin[];
    /** Custom storage adapter */
    storage?: PinStorage;
    /** Initial position of the toolbar */
    position?: {
        x: number;
        y: number;
    };
    /** Marker color */
    markerColor?: string;
    /** Compact popup — hide technical details behind a toggle (default: true) */
    compactPopup?: boolean;
}
interface FrameworkAdapter {
    name: string;
    detect(): boolean;
    getComponentInfo(element: Element): ComponentInfo | null;
    getSourceLocation(element: Element): SourceLocation | null;
    freeze?(): void;
    unfreeze?(): void;
}
interface PinEvent {
    type: "pin:created" | "pin:updated" | "pin:deleted" | "pin:resolved";
    pin: Pin;
    timestamp: string;
}

export type { AgentOutput as A, ComponentInfo as C, DrawStroke as D, ElementContext as E, FrameworkInfo as F, OutputFormat as O, PinStorage as P, QueuedAnnotation as Q, SourceLocation as S, TextNote as T, Pin as a, PinStatus as b, ElementInfo as c, FrameworkAdapter as d, PluginHooks as e, Plugin as f, PinpointAPI as g, PinpointConfig as h, ContextMenuAction as i, CopyContext as j, DrawToolType as k, PinEvent as l, ToolbarMode as m };
