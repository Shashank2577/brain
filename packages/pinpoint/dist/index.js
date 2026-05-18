import {
  ElementInfoSchema,
  FrameworkInfoSchema,
  PinSchema
} from "./chunk-JCYY4S7A.js";
import {
  MemoryStore,
  buildElementContext,
  buildSelector,
  detectFramework,
  extractElementInfo,
  freeze,
  getComponentInfo,
  getSourceLocation,
  isFreezeActive,
  openFile,
  registerAdapter,
  unfreeze
} from "./chunk-W7IKAJ3P.js";
import "./chunk-DGUM43GV.js";

// src/storage/rest-client.ts
var RestClient = class {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.endpoint = endpoint.replace(/\/+$/, "");
  }
  endpoint;
  async load(pageUrl) {
    const params = new URLSearchParams({ pageUrl });
    const res = await fetch(`${this.endpoint}?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((item) => PinSchema.safeParse(item).success) : [];
  }
  async save(pin) {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pin)
    });
    if (!res.ok) throw new Error(`Failed to save pin: ${res.status}`);
  }
  async update(id, patch) {
    const res = await fetch(`${this.endpoint}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (!res.ok) throw new Error(`Failed to update pin: ${res.status}`);
  }
  async delete(id) {
    const res = await fetch(`${this.endpoint}/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error(`Failed to delete pin: ${res.status}`);
  }
  async list(filter) {
    const params = new URLSearchParams();
    if (filter?.pageUrl) params.set("pageUrl", filter.pageUrl);
    if (filter?.status) params.set("status", filter.status);
    const res = await fetch(`${this.endpoint}?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((item) => PinSchema.safeParse(item).success) : [];
  }
  async clear(pageUrl) {
    const params = new URLSearchParams();
    if (pageUrl) params.set("pageUrl", pageUrl);
    const res = await fetch(`${this.endpoint}?${params}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Failed to clear pins: ${res.status}`);
  }
};

// src/detection/element-picker.ts
var ElementPicker = class {
  active = false;
  paused = false;
  hoveredElement = null;
  rafId = null;
  stableTimeout = null;
  lastTarget = null;
  options;
  handleMouseMove;
  handleClick;
  handleKeyDown;
  constructor(options = {}) {
    this.options = options;
    this.handleMouseMove = (e) => {
      if (!this.active || this.paused) return;
      if (this.isOwnUI(e)) return;
      if (this.rafId !== null) return;
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.processHover(e.clientX, e.clientY);
      });
    };
    this.handleClick = (e) => {
      if (!this.active || this.paused) return;
      if (this.isOwnUI(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const target = this.hoveredElement;
      if (target && !this.shouldIgnore(target)) {
        this.options.onSelect?.(target);
      }
    };
    this.handleKeyDown = (e) => {
      if (!this.active) return;
      if (e.key === "Escape") {
        this.deactivate();
      }
    };
  }
  /**
   * Check if an event originates from Pinpoint's own UI.
   * Uses composedPath() to cross Shadow DOM boundaries.
   */
  isOwnUI(e) {
    const path = e.composedPath();
    for (const node of path) {
      if (node instanceof HTMLElement) {
        if (node.id === "pinpoint-root") return true;
        if (node.hasAttribute?.("data-pinpoint-marker")) return true;
      }
    }
    return false;
  }
  shouldIgnore(element) {
    const root = element.getRootNode();
    if (root instanceof ShadowRoot) {
      const host = root.host;
      if (host.id === "pinpoint-root") return true;
    }
    if (element.hasAttribute("data-pinpoint-marker")) return true;
    if (element.closest?.("[data-pinpoint-marker]")) return true;
    if (!this.options.ignoreSelector) return false;
    return element.closest(this.options.ignoreSelector) !== null || element.matches(this.options.ignoreSelector);
  }
  pierceElementFromPoint(x, y) {
    let element = document.elementFromPoint(x, y);
    if (!element) return null;
    while (element?.shadowRoot) {
      const inner = element.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === element) break;
      element = inner;
    }
    return element;
  }
  processHover(x, y) {
    const element = this.pierceElementFromPoint(x, y);
    if (!element || this.shouldIgnore(element)) {
      if (this.hoveredElement) {
        this.hoveredElement = null;
        this.lastTarget = null;
        this.clearStableTimeout();
        this.options.onHover?.(null, null);
      }
      return;
    }
    if (element === this.lastTarget) return;
    this.lastTarget = element;
    this.hoveredElement = element;
    const rect = element.getBoundingClientRect();
    this.options.onHover?.(element, rect);
    this.clearStableTimeout();
    this.stableTimeout = setTimeout(() => {
      if (this.hoveredElement === element) {
        this.options.onStableHover?.(element);
      }
    }, 100);
  }
  clearStableTimeout() {
    if (this.stableTimeout !== null) {
      clearTimeout(this.stableTimeout);
      this.stableTimeout = null;
    }
  }
  activate() {
    if (this.active) return;
    this.active = true;
    document.addEventListener("mousemove", this.handleMouseMove, true);
    document.addEventListener("click", this.handleClick, true);
    document.addEventListener("keydown", this.handleKeyDown, true);
    if (this.options.blockInteractions) {
      document.body.style.pointerEvents = "none";
      const overlay = document.getElementById("pinpoint-root");
      if (overlay) overlay.style.pointerEvents = "auto";
    }
  }
  deactivate() {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener("mousemove", this.handleMouseMove, true);
    document.removeEventListener("click", this.handleClick, true);
    document.removeEventListener("keydown", this.handleKeyDown, true);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.clearStableTimeout();
    this.hoveredElement = null;
    this.lastTarget = null;
    if (this.options.blockInteractions) {
      document.body.style.pointerEvents = "";
    }
    this.options.onHover?.(null, null);
  }
  /** Update blockInteractions at runtime (called from settings toggle) */
  setBlockInteractions(value) {
    const wasBlocking = this.options.blockInteractions;
    this.options.blockInteractions = value;
    if (this.active) {
      if (value && !wasBlocking) {
        document.body.style.pointerEvents = "none";
        const overlay = document.getElementById("pinpoint-root");
        if (overlay) overlay.style.pointerEvents = "auto";
      } else if (!value && wasBlocking) {
        document.body.style.pointerEvents = "";
      }
    }
  }
  /** Pause picking without removing listeners (e.g., while popup is open) */
  pause() {
    this.paused = true;
    this.hoveredElement = null;
    this.lastTarget = null;
    this.clearStableTimeout();
    this.options.onHover?.(null, null);
  }
  /** Resume picking after pause */
  resume() {
    this.paused = false;
  }
  isPaused() {
    return this.paused;
  }
  isActive() {
    return this.active;
  }
  /** Get the currently hovered element */
  getHoveredElement() {
    return this.hoveredElement;
  }
  dispose() {
    this.deactivate();
  }
};

// src/detection/drag-select.ts
var DragSelect = class {
  active = false;
  dragging = false;
  startX = 0;
  startY = 0;
  options;
  handleMouseDown;
  handleMouseMove;
  handleMouseUp;
  constructor(options = {}) {
    this.options = { coverageThreshold: 0.75, ...options };
    this.handleMouseDown = (e) => {
      if (!this.active || e.button !== 0) return;
      if (!e.shiftKey) return;
      e.preventDefault();
      this.dragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      const rect = this.buildRect(e.clientX, e.clientY);
      this.options.onDragStart?.(
        new DOMRect(rect.x, rect.y, rect.width, rect.height)
      );
    };
    this.handleMouseMove = (e) => {
      if (!this.dragging) return;
      e.preventDefault();
      const rect = this.buildRect(e.clientX, e.clientY);
      this.options.onDragMove?.(
        new DOMRect(rect.x, rect.y, rect.width, rect.height)
      );
    };
    this.handleMouseUp = (e) => {
      if (!this.dragging) return;
      this.dragging = false;
      const selectionRect = this.buildRect(e.clientX, e.clientY);
      if (selectionRect.width < 5 && selectionRect.height < 5) return;
      const selected = this.getElementsInRect(selectionRect);
      this.options.onDragEnd?.(selected);
    };
  }
  buildRect(currentX, currentY) {
    return {
      x: Math.min(this.startX, currentX),
      y: Math.min(this.startY, currentY),
      width: Math.abs(currentX - this.startX),
      height: Math.abs(currentY - this.startY)
    };
  }
  getElementsInRect(selectionRect) {
    const threshold = this.options.coverageThreshold;
    const elements = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node2) => {
          const el = node2;
          if (this.options.ignoreSelector && el.matches(this.options.ignoreSelector)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    let node;
    while (node = walker.nextNode()) {
      const el = node;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const overlapX = Math.max(
        0,
        Math.min(rect.right, selectionRect.x + selectionRect.width) - Math.max(rect.left, selectionRect.x)
      );
      const overlapY = Math.max(
        0,
        Math.min(rect.bottom, selectionRect.y + selectionRect.height) - Math.max(rect.top, selectionRect.y)
      );
      const overlapArea = overlapX * overlapY;
      const elementArea = rect.width * rect.height;
      const coverage = overlapArea / elementArea;
      if (coverage >= threshold) {
        if (el.children.length === 0 || rect.width < 400) {
          elements.push(el);
        }
      }
    }
    return elements;
  }
  activate() {
    if (this.active) return;
    this.active = true;
    document.addEventListener("mousedown", this.handleMouseDown, true);
    document.addEventListener("mousemove", this.handleMouseMove, true);
    document.addEventListener("mouseup", this.handleMouseUp, true);
  }
  deactivate() {
    if (!this.active) return;
    this.active = false;
    this.dragging = false;
    document.removeEventListener("mousedown", this.handleMouseDown, true);
    document.removeEventListener("mousemove", this.handleMouseMove, true);
    document.removeEventListener("mouseup", this.handleMouseUp, true);
  }
  isDragging() {
    return this.dragging;
  }
  dispose() {
    this.deactivate();
  }
};

// src/detection/text-select.ts
var TextSelect = class {
  active = false;
  options;
  handleSelectionChange;
  debounceTimer = null;
  constructor(options = {}) {
    this.options = { minLength: 3, ...options };
    this.handleSelectionChange = () => {
      if (!this.active) return;
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        const selection = this.getTextSelection();
        this.options.onSelect?.(selection);
      }, 150);
    };
  }
  getTextSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return null;
    }
    const text = selection.toString().trim();
    if (text.length < (this.options.minLength ?? 3)) {
      return null;
    }
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (!container) return null;
    const fullText = container.textContent || "";
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    const contextBefore = fullText.slice(
      Math.max(0, startOffset - 50),
      startOffset
    );
    const contextAfter = fullText.slice(endOffset, endOffset + 50);
    const context = `...${contextBefore}[${text}]${contextAfter}...`;
    const rect = range.getBoundingClientRect();
    return {
      text,
      container,
      startOffset,
      endOffset,
      context,
      rect
    };
  }
  activate() {
    if (this.active) return;
    this.active = true;
    document.addEventListener("selectionchange", this.handleSelectionChange);
  }
  deactivate() {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener("selectionchange", this.handleSelectionChange);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
  /** Get the current text selection, if any */
  getCurrentSelection() {
    return this.getTextSelection();
  }
  dispose() {
    this.deactivate();
  }
};

// src/frameworks/react-adapter.ts
var bippy = null;
var elementSource = null;
async function loadBippy() {
  if (!bippy) {
    try {
      bippy = await import("bippy");
    } catch {
      bippy = null;
    }
  }
  return bippy;
}
async function loadElementSource() {
  if (!elementSource) {
    try {
      elementSource = await import("element-source");
    } catch {
      elementSource = null;
    }
  }
  return elementSource;
}
var FRAMEWORK_INTERNALS = /* @__PURE__ */ new Set([
  "Fragment",
  "Suspense",
  "StrictMode",
  "Profiler",
  "Provider",
  "Consumer",
  "ForwardRef",
  "Memo",
  // Next.js internals
  "InnerLayoutRouter",
  "OuterLayoutRouter",
  "RenderFromTemplateContext",
  "ScrollAndFocusHandler",
  "RedirectBoundary",
  "NotFoundBoundary",
  "LoadingBoundary",
  "ErrorBoundary",
  "HotReload",
  "Router",
  "ServerRoot",
  "AppRouter",
  "ServerInsertedHTMLProvider",
  // React Router internals
  "Routes",
  "RenderedRoute",
  "Navigate",
  "Outlet"
]);
function getRDTHook() {
  return typeof window !== "undefined" ? window.__REACT_DEVTOOLS_GLOBAL_HOOK__ : null;
}
var reactAdapter = {
  name: "react",
  detect() {
    return !!getRDTHook();
  },
  getComponentInfo(element) {
    const b = bippy;
    if (!b) return null;
    try {
      const fiber = b.getFiberFromHostInstance(element);
      if (!fiber) return null;
      const components = [];
      let current = fiber;
      while (current) {
        const name = b.getDisplayName(current);
        if (name && !FRAMEWORK_INTERNALS.has(name)) {
          components.unshift(name);
        }
        current = current.return ?? null;
        if (components.length > 20) break;
      }
      let componentFiber = fiber;
      while (componentFiber && typeof componentFiber.type === "string") {
        componentFiber = componentFiber.return ?? null;
      }
      const displayName = componentFiber ? b.getDisplayName(componentFiber) : null;
      const sourceInfo = getSourceFromFiber(componentFiber);
      return {
        name: displayName || components[components.length - 1] || "Unknown",
        displayName: displayName || void 0,
        filePath: sourceInfo?.file,
        lineNumber: sourceInfo?.line
      };
    } catch {
      return null;
    }
  },
  getSourceLocation(element) {
    const b = bippy;
    if (!b) return null;
    try {
      const fiber = b.getFiberFromHostInstance(element);
      if (!fiber) return null;
      let componentFiber = fiber;
      while (componentFiber && typeof componentFiber.type === "string") {
        componentFiber = componentFiber.return ?? null;
      }
      return getSourceFromFiber(componentFiber);
    } catch {
      return null;
    }
  },
  freeze() {
  },
  unfreeze() {
  }
};
function getSourceFromFiber(fiber) {
  if (!fiber) return null;
  if (fiber._debugSource) {
    return {
      file: fiber._debugSource.fileName,
      line: fiber._debugSource.lineNumber,
      column: fiber._debugSource.columnNumber
    };
  }
  return null;
}
if (typeof window !== "undefined") {
  const init = () => {
    loadBippy();
    loadElementSource();
  };
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(init);
  } else {
    setTimeout(init, 100);
  }
}

// src/frameworks/vue-adapter.ts
var vueAdapter = {
  name: "vue",
  detect() {
    if (typeof window === "undefined") return false;
    if (window.__VUE__) return true;
    if (document.querySelector("[data-v-]")) return true;
    return !!document.querySelector("[__vue_app__]");
  },
  getComponentInfo(element) {
    const instance = getVueInstance(element);
    if (!instance) return null;
    const name = getComponentName(instance);
    const components = buildVueComponentPath(element);
    return {
      name: name || "Unknown",
      displayName: name || void 0,
      filePath: instance.$options?.__file || instance.type?.__file,
      lineNumber: void 0
      // Vue doesn't expose line numbers like React
    };
  },
  getSourceLocation(element) {
    const instance = getVueInstance(element);
    if (!instance) return null;
    const file = instance.$options?.__file || instance.type?.__file || instance.type?.__name;
    if (!file) return null;
    return { file };
  }
};
function getVueInstance(element) {
  const el = element;
  if (el.__vueParentComponent) {
    return el.__vueParentComponent;
  }
  let current = element;
  while (current) {
    if (current.__vueParentComponent) {
      return current.__vueParentComponent;
    }
    if (current.__vue__) {
      return current.__vue__;
    }
    current = current.parentElement;
  }
  return null;
}
function getComponentName(instance) {
  if (!instance) return null;
  if (instance.type?.name) return instance.type.name;
  if (instance.type?.__name) return instance.type.__name;
  if (instance.$options?.name) return instance.$options.name;
  const file = instance.type?.__file || instance.$options?.__file;
  if (file) {
    const match = file.match(/([^/\\]+)\.\w+$/);
    if (match) return match[1];
  }
  return null;
}
function buildVueComponentPath(element) {
  const components = [];
  let current = element;
  while (current && components.length < 10) {
    const instance = current.__vueParentComponent;
    if (instance) {
      const name = getComponentName(instance);
      if (name) {
        components.unshift(`<${name}>`);
      }
    }
    current = current.parentElement;
  }
  return components.join(" ");
}

// src/frameworks/generic-adapter.ts
var genericAdapter = {
  name: "generic",
  detect() {
    return true;
  },
  getComponentInfo(_element) {
    return null;
  },
  getSourceLocation(_element) {
    return null;
  }
};

// src/output/formatter.ts
function formatPins(pins, format = "standard") {
  if (pins.length === 0) return "No annotations.";
  const pageUrl = pins[0].pageUrl;
  switch (format) {
    case "compact":
      return formatCompact(pins, pageUrl);
    case "standard":
      return formatStandard(pins, pageUrl);
    case "detailed":
      return formatDetailed(pins, pageUrl);
    default:
      return formatStandard(pins, pageUrl);
  }
}
function formatCompact(pins, pageUrl) {
  const lines = [`## Page Feedback: ${pageUrl} (${pins.length} annotations)`];
  for (let i = 0; i < pins.length; i++) {
    const pin = pins[i];
    lines.push(`${i + 1}. \`${pin.element.selector}\` \u2014 "${pin.comment}"`);
  }
  return lines.join("\n");
}
function formatStandard(pins, pageUrl) {
  const lines = [
    `## Page Feedback: ${pageUrl}`,
    `${pins.length} annotation${pins.length === 1 ? "" : "s"} | ${(/* @__PURE__ */ new Date()).toISOString()}`,
    ""
  ];
  for (let i = 0; i < pins.length; i++) {
    const pin = pins[i];
    lines.push(`### ${i + 1}: \`${pin.element.selector}\``);
    lines.push(`**Comment:** ${pin.comment}`);
    lines.push(
      `**Element:** \`<${pin.element.tagName}>\`${pin.element.classNames.length > 0 ? ` with classes \`.${pin.element.classNames.join(" .")}\`` : ""}`
    );
    if (pin.framework) {
      lines.push(
        `**Component:** ${pin.framework.componentPath} (${pin.framework.framework})`
      );
      if (pin.framework.sourceFile) {
        lines.push(`**Source:** \`${pin.framework.sourceFile}\``);
      }
    }
    const rect = pin.element.boundingRect;
    lines.push(
      `**Position:** (${rect.x}, ${rect.y}) ${rect.width}x${rect.height}`
    );
    lines.push(`**Status:** ${pin.status.state}`);
    if (pin.author) {
      lines.push(`**Author:** ${pin.author}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
function formatDetailed(pins, pageUrl) {
  const lines = [formatStandard(pins, pageUrl)];
  for (let i = 0; i < pins.length; i++) {
    const pin = pins[i];
    const detailLines = [];
    if (pin.element.domPath) {
      detailLines.push(`**DOM Path:** ${pin.element.domPath}`);
    }
    if (pin.element.computedStyles && Object.keys(pin.element.computedStyles).length > 0) {
      const styles = Object.entries(pin.element.computedStyles).map(([key, value]) => `${key}: ${value}`).join(", ");
      detailLines.push(`**Computed Styles:** ${styles}`);
    }
    if (pin.element.ariaAttributes && Object.keys(pin.element.ariaAttributes).length > 0) {
      const aria = Object.entries(pin.element.ariaAttributes).map(([key, value]) => `${key}="${value}"`).join(", ");
      detailLines.push(`**Accessibility:** ${aria}`);
    }
    if (pin.element.textContent) {
      detailLines.push(`**Text Content:** "${pin.element.textContent}"`);
    }
    if (pin.element.dataAttributes && Object.keys(pin.element.dataAttributes).length > 0) {
      const data = Object.entries(pin.element.dataAttributes).map(([key, value]) => `${key}="${value}"`).join(", ");
      detailLines.push(`**Data Attributes:** ${data}`);
    }
    if (detailLines.length > 0) {
      lines.push(`#### Details for #${i + 1}:`);
      lines.push(detailLines.join("\n"));
      lines.push("");
    }
  }
  return lines.join("\n");
}

// src/output/agent-context.ts
function formatRichPinContext(pin) {
  const lines = [];
  const tagName = pin.element.tagName.toLowerCase();
  const classes = pin.element.classNames.length > 0 ? ` class="${pin.element.classNames.join(" ")}"` : "";
  const component = pin.framework?.componentPath ? ` in ${pin.framework.componentPath} component` : "";
  lines.push(`[Annotation on <${tagName}${classes}>${component}]`);
  lines.push(`Comment: "${pin.comment}"`);
  const rect = pin.element.boundingRect;
  const classStr = pin.element.classNames.length > 0 ? `.${pin.element.classNames.join(".")}` : "";
  lines.push(
    `Element: ${tagName}${classStr} at (${Math.round(rect.x)}, ${Math.round(rect.y)})`
  );
  if (pin.framework?.sourceFile) {
    lines.push(`Source: ${pin.framework.sourceFile}`);
  }
  if (pin.element.textContent) {
    const truncated = pin.element.textContent.slice(0, 80);
    lines.push(
      `Text: "${truncated}${pin.element.textContent.length > 80 ? "..." : ""}"`
    );
  }
  return lines.join("\n");
}
function formatPinsForAgent(pins, format = "standard") {
  if (pins.length === 0) {
    return { message: "No annotations to send.", context: "" };
  }
  const richAnnotations = pins.map((pin) => formatRichPinContext(pin)).join("\n\n");
  const instruction = `The user has annotated ${pins.length} element${pins.length === 1 ? "" : "s"} on the page with visual feedback. Review each annotation and make the requested changes.

`;
  const details = formatPins(pins, format);
  const message = instruction + richAnnotations;
  return { message, context: details };
}
function formatQueueForAgent(queue, format = "standard") {
  if (queue.length === 0) {
    return { message: "No queued annotations to send.", context: "" };
  }
  const parts = [];
  const pins = [];
  parts.push(
    `The user has queued ${queue.length} annotation${queue.length === 1 ? "" : "s"} for batch review. Process each one:
`
  );
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    parts.push(`--- Item ${i + 1} ---`);
    if (item.pin) {
      parts.push(formatRichPinContext(item.pin));
      pins.push(item.pin);
    }
    if (item.drawings && item.drawings.length > 0) {
      parts.push(`[Drawing: ${item.drawings.length} stroke(s) on the page]`);
      for (const stroke of item.drawings) {
        const startPt = stroke.points[0];
        const endPt = stroke.points[stroke.points.length - 1];
        parts.push(
          `  ${stroke.type} from (${Math.round(startPt.x)}, ${Math.round(startPt.y)}) to (${Math.round(endPt.x)}, ${Math.round(endPt.y)}) [${stroke.color}]`
        );
      }
    }
    if (item.textNotes && item.textNotes.length > 0) {
      for (const note of item.textNotes) {
        parts.push(
          `[Text note at (${Math.round(note.x)}, ${Math.round(note.y)}): "${note.text}"]`
        );
      }
    }
    parts.push("");
  }
  const message = parts.join("\n");
  const context = pins.length > 0 ? formatPins(pins, format) : "";
  return { message, context };
}

// src/plugins/registry.ts
var plugins = /* @__PURE__ */ new Map();
var hookHandlers = /* @__PURE__ */ new Map();
function registerPlugin(plugin, api) {
  if (plugins.has(plugin.name)) {
    unregisterPlugin(plugin.name);
  }
  plugins.set(plugin.name, plugin);
  if (plugin.hooks) {
    for (const [hookName, handler] of Object.entries(plugin.hooks)) {
      if (typeof handler === "function") {
        const key = hookName;
        if (!hookHandlers.has(key)) {
          hookHandlers.set(key, /* @__PURE__ */ new Set());
        }
        hookHandlers.get(key).add(handler);
      }
    }
  }
  if (plugin.setup && api) {
    const registry = {
      register(hookName, handler) {
        if (!hookHandlers.has(hookName)) {
          hookHandlers.set(hookName, /* @__PURE__ */ new Set());
        }
        hookHandlers.get(hookName).add(handler);
      },
      unregister(hookName, handler) {
        hookHandlers.get(hookName)?.delete(handler);
      }
    };
    plugin.setup(api, registry);
  }
}
function unregisterPlugin(name) {
  const plugin = plugins.get(name);
  if (!plugin) return;
  if (plugin.hooks) {
    for (const [hookName, handler] of Object.entries(plugin.hooks)) {
      if (typeof handler === "function") {
        hookHandlers.get(hookName)?.delete(handler);
      }
    }
  }
  plugins.delete(name);
}
function getPlugins() {
  return Array.from(plugins.keys());
}
function dispatchHook(name, ...args) {
  const handlers = hookHandlers.get(name);
  if (!handlers) return;
  for (const handler of handlers) {
    try {
      handler(...args);
    } catch (err) {
      console.warn(`[pinpoint] Plugin hook ${name} error:`, err);
    }
  }
}

// src/plugins/agent-native-plugin.ts
var agentNativePlugin = {
  name: "agent-native",
  setup(_api, hooks) {
    hooks.register("onPinCreate", (_pin) => {
    });
    hooks.register("onPinResolve", (_pin) => {
    });
  },
  hooks: {
    onPinCreate(pin) {
      if (typeof console !== "undefined") {
        console.debug("[pinpoint] Pin created:", pin.id);
      }
    },
    onPinResolve(pin) {
      if (typeof console !== "undefined") {
        console.debug("[pinpoint] Pin resolved:", pin.id);
      }
    },
    transformOutput(output) {
      return output;
    }
  }
};

// src/security/input-sanitization.ts
var HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] || char);
}
function sanitizeString(str, maxLength = 1e3) {
  const cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned.slice(0, maxLength);
}

// src/security/origin-validation.ts
function isAllowedOrigin(origin, allowedOrigins) {
  if (origin === window.location.origin) return true;
  if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1") || origin.startsWith("https://localhost")) {
    return true;
  }
  if (allowedOrigins && allowedOrigins.length > 0) {
    return allowedOrigins.includes(origin);
  }
  return false;
}
export {
  DragSelect,
  ElementInfoSchema,
  ElementPicker,
  FrameworkInfoSchema,
  MemoryStore,
  PinSchema,
  RestClient,
  TextSelect,
  agentNativePlugin,
  buildElementContext,
  buildSelector,
  detectFramework,
  dispatchHook,
  escapeHtml,
  extractElementInfo,
  formatPins,
  formatPinsForAgent,
  formatQueueForAgent,
  formatRichPinContext,
  freeze,
  genericAdapter,
  getComponentInfo,
  getPlugins,
  getSourceLocation,
  isAllowedOrigin,
  isFreezeActive,
  openFile,
  reactAdapter,
  registerAdapter,
  registerPlugin,
  sanitizeString,
  unfreeze,
  unregisterPlugin,
  vueAdapter
};
//# sourceMappingURL=index.js.map