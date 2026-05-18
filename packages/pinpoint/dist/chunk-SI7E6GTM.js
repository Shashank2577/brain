"use client";

// src/storage/memory-store.ts
var MemoryStore = class {
  pins = /* @__PURE__ */ new Map();
  async load(pageUrl) {
    return Array.from(this.pins.values()).filter(
      (pin) => pin.pageUrl === pageUrl
    );
  }
  async save(pin) {
    this.pins.set(pin.id, { ...pin });
  }
  async update(id, patch) {
    const existing = this.pins.get(id);
    if (!existing) return;
    this.pins.set(id, {
      ...existing,
      ...patch,
      id: existing.id,
      // never overwrite ID
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  async delete(id) {
    this.pins.delete(id);
  }
  async list(filter) {
    let result = Array.from(this.pins.values());
    if (filter?.pageUrl) {
      result = result.filter((pin) => pin.pageUrl === filter.pageUrl);
    }
    if (filter?.status) {
      result = result.filter((pin) => pin.status.state === filter.status);
    }
    return result;
  }
  async clear(pageUrl) {
    if (pageUrl) {
      for (const [id, pin] of this.pins) {
        if (pin.pageUrl === pageUrl) {
          this.pins.delete(id);
        }
      }
    } else {
      this.pins.clear();
    }
  }
};

// src/storage/schemas.ts
import { z } from "zod";
var ElementInfoSchema = z.object({
  tagName: z.string(),
  id: z.string().optional(),
  classNames: z.array(z.string()),
  selector: z.string(),
  textContent: z.string().optional(),
  boundingRect: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }),
  computedStyles: z.record(z.string(), z.string()).optional(),
  ariaAttributes: z.record(z.string(), z.string()).optional(),
  dataAttributes: z.record(z.string(), z.string()).optional(),
  domPath: z.string().optional()
});
var FrameworkInfoSchema = z.object({
  framework: z.string(),
  componentPath: z.string(),
  sourceFile: z.string().optional(),
  frameworkVersion: z.string().optional()
});
var PinStatusSchema = z.enum([
  "open",
  "acknowledged",
  "resolved",
  "dismissed"
]);
var PinSchema = z.object({
  id: z.string().uuid(),
  pageUrl: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  author: z.string().optional(),
  comment: z.string(),
  element: ElementInfoSchema,
  framework: FrameworkInfoSchema.optional(),
  status: z.object({
    state: PinStatusSchema,
    changedAt: z.string().datetime(),
    changedBy: z.string().optional()
  })
});

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

// src/detection/selector-builder.ts
import { finder } from "@medv/finder";
var DEFAULT_SKIP_CLASSES = [
  /^css-/,
  // CSS-in-JS (Emotion, etc.)
  /^_/,
  // CSS Modules hashes
  /^sc-/,
  // styled-components
  /^go\d/,
  // Goober
  /^tw-/,
  // Tailwind utilities (sometimes hashed)
  /^chakra-/
  // Chakra UI internals
];
var DEFAULT_SKIP_IDS = [
  /^:r[0-9]/,
  // React auto-generated IDs
  /^radix-/,
  // Radix UI auto IDs
  /^headlessui-/
  // HeadlessUI auto IDs
];
function buildSelector(element, options = {}) {
  const { timeoutMs = 200, skipClassPatterns = [] } = options;
  const allSkipClasses = [...DEFAULT_SKIP_CLASSES, ...skipClassPatterns];
  try {
    return finder(element, {
      className: (name) => !allSkipClasses.some((pattern) => pattern.test(name)),
      idName: (name) => !DEFAULT_SKIP_IDS.some((pattern) => pattern.test(name)),
      attr: (name) => name.startsWith("data-testid") || name.startsWith("data-cy"),
      timeoutMs
    });
  } catch {
    return buildFallbackSelector(element);
  }
}
function buildFallbackSelector(element) {
  const parts = [];
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }
  parts.push(element.tagName.toLowerCase());
  const testId = element.getAttribute("data-testid");
  if (testId) {
    return `[data-testid="${CSS.escape(testId)}"]`;
  }
  const classes = Array.from(element.classList).filter(
    (name) => !DEFAULT_SKIP_CLASSES.some((pattern) => pattern.test(name))
  );
  if (classes.length > 0) {
    parts.push(`.${classes.map((c) => CSS.escape(c)).join(".")}`);
  }
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      (child) => child.tagName === element.tagName
    );
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      parts.push(`:nth-child(${index})`);
    }
  }
  return parts.join("");
}

// src/detection/element-info.ts
var STYLE_KEYS = [
  "color",
  "backgroundColor",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "lineHeight",
  "padding",
  "margin",
  "border",
  "borderRadius",
  "display",
  "position",
  "width",
  "height",
  "opacity",
  "zIndex",
  "overflow",
  "textAlign",
  "textDecoration"
];
function extractElementInfo(element) {
  const rect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);
  const computedStyles = {};
  for (const key of STYLE_KEYS) {
    const value = computed.getPropertyValue(
      key.replace(/([A-Z])/g, "-$1").toLowerCase()
    );
    if (value) {
      computedStyles[key] = value;
    }
  }
  const ariaAttributes = {};
  for (const attr of element.attributes) {
    if (attr.name.startsWith("aria-") || attr.name === "role") {
      ariaAttributes[attr.name] = attr.value;
    }
  }
  const dataAttributes = {};
  for (const attr of element.attributes) {
    if (attr.name.startsWith("data-")) {
      dataAttributes[attr.name] = attr.value;
    }
  }
  const domPath = buildDomPath(element);
  const textContent = getTextContent(element);
  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || void 0,
    classNames: Array.from(element.classList),
    selector: buildSelector(element),
    textContent,
    boundingRect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    },
    computedStyles,
    ariaAttributes: Object.keys(ariaAttributes).length > 0 ? ariaAttributes : void 0,
    dataAttributes: Object.keys(dataAttributes).length > 0 ? dataAttributes : void 0,
    domPath
  };
}
function buildElementContext(element, frameworkInfo) {
  const info = extractElementInfo(element);
  const htmlSnippet = getCleanedHtml(element);
  return {
    element: info,
    framework: frameworkInfo,
    htmlSnippet,
    cssSelector: info.selector,
    computedStyles: info.computedStyles || {}
  };
}
function getTextContent(element) {
  let text = "";
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent?.trim() || "";
    }
  }
  if (!text) {
    text = element.textContent?.trim() || "";
  }
  if (!text) return void 0;
  return text.length > 200 ? text.slice(0, 200) + "..." : text;
}
function buildDomPath(element) {
  const parts = [];
  let current = element;
  while (current && current !== document.documentElement) {
    let part = current.tagName.toLowerCase();
    if (current.id) {
      part += `#${current.id}`;
    } else if (current.classList.length > 0) {
      const firstClass = current.classList[0];
      if (firstClass && !/^(css-|_|sc-)/.test(firstClass)) {
        part += `.${firstClass}`;
      }
    }
    parts.unshift(part);
    current = current.parentElement;
  }
  return parts.join(" > ");
}
function getCleanedHtml(element, maxLength = 500) {
  const clone = element.cloneNode(true);
  const allElements = [clone, ...Array.from(clone.querySelectorAll("*"))];
  for (const el of allElements) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    }
  }
  let html = clone.outerHTML;
  html = html.replace(/\s+/g, " ").trim();
  if (html.length > maxLength) {
    const openTagEnd = html.indexOf(">") + 1;
    if (openTagEnd > 0 && openTagEnd < maxLength) {
      html = html.slice(0, maxLength) + "...";
    }
  }
  return html;
}

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

// src/frameworks/adapter.ts
var adapters = [];
var detectedAdapter = null;
var detected = false;
function registerAdapter(adapter) {
  adapters.push(adapter);
  detected = false;
  detectedAdapter = null;
}
function detectFramework() {
  if (detected && detectedAdapter) return detectedAdapter;
  for (const adapter of adapters) {
    try {
      if (adapter.detect()) {
        detectedAdapter = adapter;
        detected = true;
        return adapter;
      }
    } catch {
    }
  }
  detectedAdapter = genericAdapter;
  detected = true;
  return genericAdapter;
}
function getComponentInfo(element) {
  const adapter = detectFramework();
  try {
    return adapter.getComponentInfo(element);
  } catch {
    return null;
  }
}
function getSourceLocation(element) {
  const adapter = detectFramework();
  try {
    return adapter.getSourceLocation(element);
  } catch {
    return null;
  }
}
var genericAdapter = {
  name: "generic",
  detect: () => true,
  // Always matches as fallback
  getComponentInfo: () => null,
  getSourceLocation: () => null
};

// src/ui/components/PinMarker.tsx
var MAX_MARKERS = 100;
var BADGE_SIZE = 20;
var BADGE_FONT = 11;
var BADGE_OFFSET = -10;
var STATUS_COLORS = {
  open: "#3b82f6",
  acknowledged: "#eab308",
  resolved: "#22c55e",
  dismissed: "#a1a1aa"
};
var PinMarkerManager = class {
  markers = /* @__PURE__ */ new Map();
  updateTimer = null;
  onClick = null;
  onToggleSelect = null;
  selectedPinIds = /* @__PURE__ */ new Set();
  showCheckboxes = false;
  constructor(markerColor = "#3b82f6") {
    this.markerColor = markerColor;
  }
  setOnClick(handler) {
    this.onClick = handler;
  }
  setOnToggleSelect(handler) {
    this.onToggleSelect = handler;
  }
  setSelectedPins(ids) {
    this.selectedPinIds = ids;
    for (const [id, pair] of this.markers) {
      this.updateCheckboxVisual(pair.checkbox, ids.has(id));
    }
  }
  setShowCheckboxes(show) {
    this.showCheckboxes = show;
    for (const pair of this.markers.values()) {
      pair.checkbox.style.display = show ? "flex" : "none";
    }
  }
  update(pins) {
    const visiblePins = pins.slice(0, MAX_MARKERS);
    const pinIds = new Set(visiblePins.map((p) => p.id));
    for (const [id, pair] of this.markers) {
      if (!pinIds.has(id)) {
        pair.wrapper.remove();
        this.markers.delete(id);
      }
    }
    for (let i = 0; i < visiblePins.length; i++) {
      this.updateMarker(visiblePins[i], i + 1);
    }
  }
  updateCheckboxVisual(checkbox, selected) {
    const inner = checkbox.querySelector(".pp-marker-checkbox-inner");
    if (!inner) return;
    if (selected) {
      inner.style.background = "#3b82f6";
      inner.style.borderColor = "#3b82f6";
      inner.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"/></svg>`;
    } else {
      inner.style.background = "rgba(0,0,0,0.5)";
      inner.style.borderColor = "rgba(255,255,255,0.3)";
      inner.innerHTML = "";
    }
  }
  updateMarker(pin, number) {
    const element = document.querySelector(pin.element.selector);
    if (!element) {
      const existing = this.markers.get(pin.id);
      if (existing) existing.wrapper.style.display = "none";
      return;
    }
    let pair = this.markers.get(pin.id);
    const statusColor = STATUS_COLORS[pin.status.state] || this.markerColor;
    if (!pair) {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-pinpoint-marker", pin.id);
      wrapper.style.cssText = `
        position: fixed;
        z-index: 2147483646;
        pointer-events: none;
      `;
      const outline = document.createElement("div");
      outline.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        border: 1.5px solid ${statusColor};
        border-radius: 3px;
        pointer-events: none;
        opacity: 0.6;
      `;
      const badge = document.createElement("div");
      badge.style.cssText = `
        position: absolute;
        top: ${BADGE_OFFSET}px;
        right: ${BADGE_OFFSET}px;
        width: ${BADGE_SIZE}px;
        height: ${BADGE_SIZE}px;
        min-width: ${BADGE_SIZE}px;
        padding: 0 4px;
        border-radius: ${BADGE_SIZE / 2}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${BADGE_FONT}px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-variant-numeric: tabular-nums;
        color: #fff;
        background: ${statusColor};
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        cursor: pointer;
        pointer-events: auto;
        user-select: none;
        z-index: 1;
        animation: pp-badge-appear 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      `;
      if (!document.getElementById("pp-marker-keyframes")) {
        const style2 = document.createElement("style");
        style2.id = "pp-marker-keyframes";
        style2.textContent = `
          @keyframes pp-badge-appear {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `;
        document.head.appendChild(style2);
      }
      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.onClick?.(pin);
      });
      badge.addEventListener("mouseenter", () => {
        badge.style.transform = "scale(1.15)";
      });
      badge.addEventListener("mouseleave", () => {
        badge.style.transform = "scale(1)";
      });
      const checkbox = document.createElement("div");
      checkbox.style.cssText = `
        position: absolute;
        top: ${BADGE_OFFSET}px;
        left: ${BADGE_OFFSET}px;
        width: ${BADGE_SIZE}px;
        height: ${BADGE_SIZE}px;
        display: ${this.showCheckboxes ? "flex" : "none"};
        align-items: center;
        justify-content: center;
        cursor: pointer;
        pointer-events: auto;
        z-index: 1;
      `;
      const checkboxInner = document.createElement("div");
      checkboxInner.className = "pp-marker-checkbox-inner";
      checkboxInner.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 4px;
        border: 1.5px solid rgba(255,255,255,0.3);
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      checkbox.appendChild(checkboxInner);
      checkbox.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.onToggleSelect?.(pin);
      });
      const resolvedOverlay = document.createElement("div");
      resolvedOverlay.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: ${pin.status.state === "resolved" ? "flex" : "none"};
        align-items: center;
        justify-content: center;
        background: rgba(34, 197, 94, 0.12);
        border-radius: 3px;
        pointer-events: none;
      `;
      resolvedOverlay.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"/></svg>`;
      wrapper.appendChild(outline);
      wrapper.appendChild(badge);
      wrapper.appendChild(checkbox);
      wrapper.appendChild(resolvedOverlay);
      document.body.appendChild(wrapper);
      pair = {
        wrapper,
        outline,
        badge,
        checkbox,
        resolvedOverlay
      };
      this.markers.set(pin.id, pair);
    }
    pair.badge.textContent = String(number);
    pair.badge.title = pin.comment;
    pair.badge.style.background = statusColor;
    pair.outline.style.borderColor = statusColor;
    pair.resolvedOverlay.style.display = pin.status.state === "resolved" ? "flex" : "none";
    this.updateCheckboxVisual(pair.checkbox, this.selectedPinIds.has(pin.id));
    const rect = element.getBoundingClientRect();
    pair.wrapper.style.left = `${rect.left}px`;
    pair.wrapper.style.top = `${rect.top}px`;
    pair.wrapper.style.width = `${rect.width}px`;
    pair.wrapper.style.height = `${rect.height}px`;
    const visible = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    pair.wrapper.style.display = visible ? "block" : "none";
  }
  startTracking(pins) {
    this.stopTracking();
    this.update(pins);
    this.updateTimer = setInterval(() => this.update(pins), 200);
  }
  stopTracking() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
  dispose() {
    this.stopTracking();
    for (const pair of this.markers.values()) {
      pair.wrapper.remove();
    }
    this.markers.clear();
  }
};

// ../../node_modules/.pnpm/solid-js@1.9.12/node_modules/solid-js/dist/solid.js
var sharedConfig = {
  context: void 0,
  registry: void 0,
  effects: void 0,
  done: false,
  getContextId() {
    return getContextId(this.context.count);
  },
  getNextContextId() {
    return getContextId(this.context.count++);
  }
};
function getContextId(count) {
  const num = String(count), len = num.length - 1;
  return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
}
function setHydrateContext(context) {
  sharedConfig.context = context;
}
function nextHydrateContext() {
  return {
    ...sharedConfig.context,
    id: sharedConfig.getNextContextId(),
    count: 0
  };
}
var IS_DEV = false;
var equalFn = (a, b) => a === b;
var $TRACK = /* @__PURE__ */ Symbol("solid-track");
var signalOptions = {
  equals: equalFn
};
var ERROR = null;
var runEffects = runQueue;
var STALE = 1;
var PENDING = 2;
var UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var Owner = null;
var Transition = null;
var Scheduler = null;
var ExternalSourceConfig = null;
var Listener = null;
var Updates = null;
var Effects = null;
var ExecCount = 0;
function createRoot(fn, detachedOwner) {
  const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root = unowned ? UNOWNED : {
    owned: null,
    cleanups: null,
    context: current ? current.context : null,
    owner: current
  }, updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
  Owner = root;
  Listener = null;
  try {
    return runUpdates(updateFn, true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
}
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || void 0
  };
  const setter = (value2) => {
    if (typeof value2 === "function") {
      if (Transition && Transition.running && Transition.sources.has(s)) value2 = value2(s.tValue);
      else value2 = value2(s.value);
    }
    return writeSignal(s, value2);
  };
  return [readSignal.bind(s), setter];
}
function createRenderEffect(fn, value, options) {
  const c = createComputation(fn, value, false, STALE);
  if (Scheduler && Transition && Transition.running) Updates.push(c);
  else updateComputation(c);
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c = createComputation(fn, value, false, STALE), s = SuspenseContext && useContext(SuspenseContext);
  if (s) c.suspense = s;
  if (!options || !options.render) c.user = true;
  Effects ? Effects.push(c) : updateComputation(c);
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c = createComputation(fn, value, true, 0);
  c.observers = null;
  c.observerSlots = null;
  c.comparator = options.equals || void 0;
  if (Scheduler && Transition && Transition.running) {
    c.tState = STALE;
    Updates.push(c);
  } else updateComputation(c);
  return readSignal.bind(c);
}
function untrack(fn) {
  if (!ExternalSourceConfig && Listener === null) return fn();
  const listener = Listener;
  Listener = null;
  try {
    if (ExternalSourceConfig) return ExternalSourceConfig.untrack(fn);
    return fn();
  } finally {
    Listener = listener;
  }
}
function onMount(fn) {
  createEffect(() => untrack(fn));
}
function onCleanup(fn) {
  if (Owner === null) ;
  else if (Owner.cleanups === null) Owner.cleanups = [fn];
  else Owner.cleanups.push(fn);
  return fn;
}
function startTransition(fn) {
  if (Transition && Transition.running) {
    fn();
    return Transition.done;
  }
  const l = Listener;
  const o = Owner;
  return Promise.resolve().then(() => {
    Listener = l;
    Owner = o;
    let t;
    if (Scheduler || SuspenseContext) {
      t = Transition || (Transition = {
        sources: /* @__PURE__ */ new Set(),
        effects: [],
        promises: /* @__PURE__ */ new Set(),
        disposed: /* @__PURE__ */ new Set(),
        queue: /* @__PURE__ */ new Set(),
        running: true
      });
      t.done || (t.done = new Promise((res) => t.resolve = res));
      t.running = true;
    }
    runUpdates(fn, false);
    Listener = Owner = null;
    return t ? t.done : void 0;
  });
}
var [transPending, setTransPending] = /* @__PURE__ */ createSignal(false);
function useContext(context) {
  let value;
  return Owner && Owner.context && (value = Owner.context[context.id]) !== void 0 ? value : context.defaultValue;
}
var SuspenseContext;
function readSignal() {
  const runningTransition = Transition && Transition.running;
  if (this.sources && (runningTransition ? this.tState : this.state)) {
    if ((runningTransition ? this.tState : this.state) === STALE) updateComputation(this);
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots.push(Listener.sources.length - 1);
    }
  }
  if (runningTransition && Transition.sources.has(this)) return this.tValue;
  return this.value;
}
function writeSignal(node, value, isComp) {
  let current = Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    if (Transition) {
      const TransitionRunning = Transition.running;
      if (TransitionRunning || !isComp && Transition.sources.has(node)) {
        Transition.sources.add(node);
        node.tValue = value;
      }
      if (!TransitionRunning) node.value = value;
    } else node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers.length; i += 1) {
          const o = node.observers[i];
          const TransitionRunning = Transition && Transition.running;
          if (TransitionRunning && Transition.disposed.has(o)) continue;
          if (TransitionRunning ? !o.tState : !o.state) {
            if (o.pure) Updates.push(o);
            else Effects.push(o);
            if (o.observers) markDownstream(o);
          }
          if (!TransitionRunning) o.state = STALE;
          else o.tState = STALE;
        }
        if (Updates.length > 1e6) {
          Updates = [];
          if (IS_DEV) ;
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn) return;
  cleanNode(node);
  const time = ExecCount;
  runComputation(node, Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value, time);
  if (Transition && !Transition.running && Transition.sources.has(node)) {
    queueMicrotask(() => {
      runUpdates(() => {
        Transition && (Transition.running = true);
        Listener = Owner = node;
        runComputation(node, node.tValue, time);
        Listener = Owner = null;
      }, false);
    });
  }
}
function runComputation(node, value, time) {
  let nextValue;
  const owner = Owner, listener = Listener;
  Listener = Owner = node;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      if (Transition && Transition.running) {
        node.tState = STALE;
        node.tOwned && node.tOwned.forEach(cleanNode);
        node.tOwned = void 0;
      } else {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue, true);
    } else if (Transition && Transition.running && node.pure) {
      if (!Transition.sources.has(node)) node.value = nextValue;
      Transition.sources.add(node);
      node.tValue = nextValue;
    } else node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init, pure, state = STALE, options) {
  const c = {
    fn,
    state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure
  };
  if (Transition && Transition.running) {
    c.state = 0;
    c.tState = state;
  }
  if (Owner === null) ;
  else if (Owner !== UNOWNED) {
    if (Transition && Transition.running && Owner.pure) {
      if (!Owner.tOwned) Owner.tOwned = [c];
      else Owner.tOwned.push(c);
    } else {
      if (!Owner.owned) Owner.owned = [c];
      else Owner.owned.push(c);
    }
  }
  if (ExternalSourceConfig && c.fn) {
    const sourceFn = c.fn;
    const [track, trigger] = createSignal(void 0, {
      equals: false
    });
    const ordinary = ExternalSourceConfig.factory(sourceFn, trigger);
    onCleanup(() => ordinary.dispose());
    let inTransition;
    const triggerInTransition = () => startTransition(trigger).then(() => {
      if (inTransition) {
        inTransition.dispose();
        inTransition = void 0;
      }
    });
    c.fn = (x) => {
      track();
      if (Transition && Transition.running) {
        if (!inTransition) inTransition = ExternalSourceConfig.factory(sourceFn, triggerInTransition);
        return inTransition.track(x);
      }
      return ordinary.track(x);
    };
  }
  return c;
}
function runTop(node) {
  const runningTransition = Transition && Transition.running;
  if ((runningTransition ? node.tState : node.state) === 0) return;
  if ((runningTransition ? node.tState : node.state) === PENDING) return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (runningTransition && Transition.disposed.has(node)) return;
    if (runningTransition ? node.tState : node.state) ancestors.push(node);
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    if (runningTransition) {
      let top = node, prev = ancestors[i + 1];
      while ((top = top.owner) && top !== prev) {
        if (Transition.disposed.has(top)) return;
      }
    }
    if ((runningTransition ? node.tState : node.state) === STALE) {
      updateComputation(node);
    } else if ((runningTransition ? node.tState : node.state) === PENDING) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
function runUpdates(fn, init) {
  if (Updates) return fn();
  let wait = false;
  if (!init) Updates = [];
  if (Effects) wait = true;
  else Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!wait) Effects = null;
    Updates = null;
    handleError(err);
  }
}
function completeUpdates(wait) {
  if (Updates) {
    if (Scheduler && Transition && Transition.running) scheduleQueue(Updates);
    else runQueue(Updates);
    Updates = null;
  }
  if (wait) return;
  let res;
  if (Transition) {
    if (!Transition.promises.size && !Transition.queue.size) {
      const sources = Transition.sources;
      const disposed = Transition.disposed;
      Effects.push.apply(Effects, Transition.effects);
      res = Transition.resolve;
      for (const e2 of Effects) {
        "tState" in e2 && (e2.state = e2.tState);
        delete e2.tState;
      }
      Transition = null;
      runUpdates(() => {
        for (const d of disposed) cleanNode(d);
        for (const v of sources) {
          v.value = v.tValue;
          if (v.owned) {
            for (let i = 0, len = v.owned.length; i < len; i++) cleanNode(v.owned[i]);
          }
          if (v.tOwned) v.owned = v.tOwned;
          delete v.tValue;
          delete v.tOwned;
          v.tState = 0;
        }
        setTransPending(false);
      }, false);
    } else if (Transition.running) {
      Transition.running = false;
      Transition.effects.push.apply(Transition.effects, Effects);
      Effects = null;
      setTransPending(true);
      return;
    }
  }
  const e = Effects;
  Effects = null;
  if (e.length) runUpdates(() => runEffects(e), false);
  if (res) res();
}
function runQueue(queue) {
  for (let i = 0; i < queue.length; i++) runTop(queue[i]);
}
function scheduleQueue(queue) {
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    const tasks = Transition.queue;
    if (!tasks.has(item)) {
      tasks.add(item);
      Scheduler(() => {
        tasks.delete(item);
        runUpdates(() => {
          Transition.running = true;
          runTop(item);
        }, false);
        Transition && (Transition.running = false);
      });
    }
  }
}
function runUserEffects(queue) {
  let i, userLength = 0;
  for (i = 0; i < queue.length; i++) {
    const e = queue[i];
    if (!e.user) runTop(e);
    else queue[userLength++] = e;
  }
  if (sharedConfig.context) {
    if (sharedConfig.count) {
      sharedConfig.effects || (sharedConfig.effects = []);
      sharedConfig.effects.push(...queue.slice(0, userLength));
      return;
    }
    setHydrateContext();
  }
  if (sharedConfig.effects && (sharedConfig.done || !sharedConfig.count)) {
    queue = [...sharedConfig.effects, ...queue];
    userLength += sharedConfig.effects.length;
    delete sharedConfig.effects;
  }
  for (i = 0; i < userLength; i++) runTop(queue[i]);
}
function lookUpstream(node, ignore) {
  const runningTransition = Transition && Transition.running;
  if (runningTransition) node.tState = 0;
  else node.state = 0;
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      const state = runningTransition ? source.tState : source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount)) runTop(source);
      } else if (state === PENDING) lookUpstream(source, ignore);
    }
  }
}
function markDownstream(node) {
  const runningTransition = Transition && Transition.running;
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (runningTransition ? !o.tState : !o.state) {
      if (runningTransition) o.tState = PENDING;
      else o.state = PENDING;
      if (o.pure) Updates.push(o);
      else Effects.push(o);
      o.observers && markDownstream(o);
    }
  }
}
function cleanNode(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(), s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (node.tOwned) {
    for (i = node.tOwned.length - 1; i >= 0; i--) cleanNode(node.tOwned[i]);
    delete node.tOwned;
  }
  if (Transition && Transition.running && node.pure) {
    reset(node, true);
  } else if (node.owned) {
    for (i = node.owned.length - 1; i >= 0; i--) cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = node.cleanups.length - 1; i >= 0; i--) node.cleanups[i]();
    node.cleanups = null;
  }
  if (Transition && Transition.running) node.tState = 0;
  else node.state = 0;
}
function reset(node, top) {
  if (!top) {
    node.tState = 0;
    Transition.disposed.add(node);
  }
  if (node.owned) {
    for (let i = 0; i < node.owned.length; i++) reset(node.owned[i]);
  }
}
function castError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function runErrors(err, fns, owner) {
  try {
    for (const f of fns) f(err);
  } catch (e) {
    handleError(e, owner && owner.owner || null);
  }
}
function handleError(err, owner = Owner) {
  const fns = ERROR && owner && owner.context && owner.context[ERROR];
  const error = castError(err);
  if (!fns) throw error;
  if (Effects) Effects.push({
    fn() {
      runErrors(error, fns, owner);
    },
    state: STALE
  });
  else runErrors(error, fns, owner);
}
var FALLBACK = /* @__PURE__ */ Symbol("fallback");
function dispose(d) {
  for (let i = 0; i < d.length; i++) d[i]();
}
function mapArray(list, mapFn, options = {}) {
  let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
  onCleanup(() => dispose(disposers));
  return () => {
    let newItems = list() || [], newLen = newItems.length, i, j;
    newItems[$TRACK];
    return untrack(() => {
      let newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot((disposer) => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
      } else if (len === 0) {
        mapped = new Array(newLen);
        for (j = 0; j < newLen; j++) {
          items[j] = newItems[j];
          mapped[j] = createRoot(mapper);
        }
        len = newLen;
      } else {
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        indexes && (tempIndexes = new Array(newLen));
        for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++) ;
        for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
          indexes && (tempIndexes[newEnd] = indexes[end]);
        }
        newIndices = /* @__PURE__ */ new Map();
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd; j >= start; j--) {
          item = newItems[j];
          i = newIndices.get(item);
          newIndicesNext[j] = i === void 0 ? -1 : i;
          newIndices.set(item, j);
        }
        for (i = start; i <= end; i++) {
          item = items[i];
          j = newIndices.get(item);
          if (j !== void 0 && j !== -1) {
            temp[j] = mapped[i];
            tempdisposers[j] = disposers[i];
            indexes && (tempIndexes[j] = indexes[i]);
            j = newIndicesNext[j];
            newIndices.set(item, j);
          } else disposers[i]();
        }
        for (j = start; j < newLen; j++) {
          if (j in temp) {
            mapped[j] = temp[j];
            disposers[j] = tempdisposers[j];
            if (indexes) {
              indexes[j] = tempIndexes[j];
              indexes[j](j);
            }
          } else mapped[j] = createRoot(mapper);
        }
        mapped = mapped.slice(0, len = newLen);
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j] = disposer;
      if (indexes) {
        const [s, set] = createSignal(j);
        indexes[j] = set;
        return mapFn(newItems[j], s);
      }
      return mapFn(newItems[j]);
    }
  };
}
var hydrationEnabled = false;
function createComponent(Comp, props) {
  if (hydrationEnabled) {
    if (sharedConfig.context) {
      const c = sharedConfig.context;
      setHydrateContext(nextHydrateContext());
      const r = untrack(() => Comp(props || {}));
      setHydrateContext(c);
      return r;
    }
  }
  return untrack(() => Comp(props || {}));
}
var narrowedError = (name) => `Stale read from <${name}>.`;
function For(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(mapArray(() => props.each, props.children, fallback || void 0));
}
function Show(props) {
  const keyed = props.keyed;
  const conditionValue = createMemo(() => props.when, void 0, void 0);
  const condition = keyed ? conditionValue : createMemo(conditionValue, void 0, {
    equals: (a, b) => !a === !b
  });
  return createMemo(() => {
    const c = condition();
    if (c) {
      const child = props.children;
      const fn = typeof child === "function" && child.length > 0;
      return fn ? untrack(() => child(keyed ? c : () => {
        if (!untrack(condition)) throw narrowedError("Show");
        return conditionValue();
      })) : child;
    }
    return props.fallback;
  }, void 0, void 0);
}

// ../../node_modules/.pnpm/solid-js@1.9.12/node_modules/solid-js/web/dist/web.js
var booleans = [
  "allowfullscreen",
  "async",
  "alpha",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected",
  "adauctionheaders",
  "browsingtopics",
  "credentialless",
  "defaultchecked",
  "defaultmuted",
  "defaultselected",
  "defer",
  "disablepictureinpicture",
  "disableremoteplayback",
  "preservespitch",
  "shadowrootclonable",
  "shadowrootcustomelementregistry",
  "shadowrootdelegatesfocus",
  "shadowrootserializable",
  "sharedstoragewritable"
];
var Properties = /* @__PURE__ */ new Set([
  "className",
  "value",
  "readOnly",
  "noValidate",
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  "adAuctionHeaders",
  "allowFullscreen",
  "browsingTopics",
  "defaultChecked",
  "defaultMuted",
  "defaultSelected",
  "disablePictureInPicture",
  "disableRemotePlayback",
  "preservesPitch",
  "shadowRootClonable",
  "shadowRootCustomElementRegistry",
  "shadowRootDelegatesFocus",
  "shadowRootSerializable",
  "sharedStorageWritable",
  ...booleans
]);
var memo = (fn) => createMemo(() => fn());
function reconcileArrays(parentNode, a, b) {
  let bLength = b.length, aEnd = a.length, bEnd = bLength, aStart = 0, bStart = 0, after = a[aEnd - 1].nextSibling, map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    while (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
      while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) a[aStart].remove();
        aStart++;
      }
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = /* @__PURE__ */ new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart, sequence = 1, t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index) parentNode.insertBefore(b[bStart++], node);
          } else parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else aStart++;
      } else a[aStart++].remove();
    }
  }
}
var $$EVENTS = "_$DX_DELEGATE";
function render(code, element, init, options = {}) {
  let disposer;
  createRoot((dispose2) => {
    disposer = dispose2;
    element === document ? code() : insert(element, code(), element.firstChild ? null : void 0, init);
  }, options.owner);
  return () => {
    disposer();
    element.textContent = "";
  };
}
function template(html, isImportNode, isSVG, isMathML) {
  let node;
  const create = () => {
    const t = isMathML ? document.createElementNS("http://www.w3.org/1998/Math/MathML", "template") : document.createElement("template");
    t.innerHTML = html;
    return isSVG ? t.content.firstChild.firstChild : isMathML ? t.firstChild : t.content.firstChild;
  };
  const fn = isImportNode ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
  fn.cloneNode = fn;
  return fn;
}
function delegateEvents(eventNames, document2 = window.document) {
  const e = document2[$$EVENTS] || (document2[$$EVENTS] = /* @__PURE__ */ new Set());
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!e.has(name)) {
      e.add(name);
      document2.addEventListener(name, eventHandler);
    }
  }
}
function setAttribute(node, name, value) {
  if (isHydrating(node)) return;
  if (value == null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}
function className(node, value) {
  if (isHydrating(node)) return;
  if (value == null) node.removeAttribute("class");
  else node.className = value;
}
function addEventListener(node, name, handler, delegate) {
  if (delegate) {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else node[`$$${name}`] = handler;
  } else if (Array.isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, handler[0] = (e) => handlerFn.call(node, handler[1], e));
  } else node.addEventListener(name, handler, typeof handler !== "function" && handler);
}
function style(node, value, prev) {
  if (!value) return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string") return nodeStyle.cssText = value;
  typeof prev === "string" && (nodeStyle.cssText = prev = void 0);
  prev || (prev = {});
  value || (value = {});
  let v, s;
  for (s in prev) {
    value[s] == null && nodeStyle.removeProperty(s);
    delete prev[s];
  }
  for (s in value) {
    v = value[s];
    if (v !== prev[s]) {
      nodeStyle.setProperty(s, v);
      prev[s] = v;
    }
  }
  return prev;
}
function setStyleProperty(node, name, value) {
  value != null ? node.style.setProperty(name, value) : node.style.removeProperty(name);
}
function use(fn, element, arg) {
  return untrack(() => fn(element, arg));
}
function insert(parent, accessor, marker, initial) {
  if (marker !== void 0 && !initial) initial = [];
  if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
  createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
}
function isHydrating(node) {
  return !!sharedConfig.context && !sharedConfig.done && (!node || node.isConnected);
}
function eventHandler(e) {
  if (sharedConfig.registry && sharedConfig.events) {
    if (sharedConfig.events.find(([el, ev]) => ev === e)) return;
  }
  let node = e.target;
  const key = `$$${e.type}`;
  const oriTarget = e.target;
  const oriCurrentTarget = e.currentTarget;
  const retarget = (value) => Object.defineProperty(e, "target", {
    configurable: true,
    value
  });
  const handleNode = () => {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== void 0 ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble) return;
    }
    node.host && typeof node.host !== "string" && !node.host._$host && node.contains(e.target) && retarget(node.host);
    return true;
  };
  const walkUpTree = () => {
    while (handleNode() && (node = node._$host || node.parentNode || node.host)) ;
  };
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node || document;
    }
  });
  if (sharedConfig.registry && !sharedConfig.done) sharedConfig.done = _$HY.done = true;
  if (e.composedPath) {
    const path = e.composedPath();
    retarget(path[0]);
    for (let i = 0; i < path.length - 2; i++) {
      node = path[i];
      if (!handleNode()) break;
      if (node._$host) {
        node = node._$host;
        walkUpTree();
        break;
      }
      if (node.parentNode === oriCurrentTarget) {
        break;
      }
    }
  } else walkUpTree();
  retarget(oriTarget);
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  const hydrating = isHydrating(parent);
  if (hydrating) {
    !current && (current = [...parent.childNodes]);
    let cleaned = [];
    for (let i = 0; i < current.length; i++) {
      const node = current[i];
      if (node.nodeType === 8 && node.data.slice(0, 2) === "!$") node.remove();
      else cleaned.push(node);
    }
    current = cleaned;
  }
  while (typeof current === "function") current = current();
  if (value === current) return current;
  const t = typeof value, multi = marker !== void 0;
  parent = multi && current[0] && current[0].parentNode || parent;
  if (t === "string" || t === "number") {
    if (hydrating) return current;
    if (t === "number") {
      value = value.toString();
      if (value === current) return current;
    }
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data !== value && (node.data = value);
      } else node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t === "boolean") {
    if (hydrating) return current;
    current = cleanChildren(parent, current, marker);
  } else if (t === "function") {
    createRenderEffect(() => {
      let v = value();
      while (typeof v === "function") v = v();
      current = insertExpression(parent, v, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    const currentArray = current && Array.isArray(current);
    if (normalizeIncomingArray(array, value, current, unwrapArray)) {
      createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
      return () => current;
    }
    if (hydrating) {
      if (!array.length) return current;
      if (marker === void 0) return current = [...parent.childNodes];
      let node = array[0];
      if (node.parentNode !== parent) return current;
      const nodes = [node];
      while ((node = node.nextSibling) !== marker) nodes.push(node);
      return current = nodes;
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi) return current;
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, array, marker);
      } else reconcileArrays(parent, current, array);
    } else {
      current && cleanChildren(parent);
      appendNodes(parent, array);
    }
    current = array;
  } else if (value.nodeType) {
    if (hydrating && value.parentNode) return current = multi ? [value] : value;
    if (Array.isArray(current)) {
      if (multi) return current = cleanChildren(parent, current, marker, value);
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
    current = value;
  } else ;
  return current;
}
function normalizeIncomingArray(normalized, array, current, unwrap) {
  let dynamic = false;
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i], prev = current && current[normalized.length], t;
    if (item == null || item === true || item === false) ;
    else if ((t = typeof item) === "object" && item.nodeType) {
      normalized.push(item);
    } else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
    } else if (t === "function") {
      if (unwrap) {
        while (typeof item === "function") item = item();
        dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);
      else normalized.push(document.createTextNode(value));
    }
  }
  return dynamic;
}
function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === void 0) return parent.textContent = "";
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i) isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
        else isParent && el.remove();
      } else inserted = true;
    }
  } else parent.insertBefore(node, marker);
  return [node];
}

// src/ui/styles/theme.ts
var overlayStyles = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: var(--pp-text);
  pointer-events: none;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Theme variables */
:host {
  --pp-bg: rgba(24, 24, 27, 0.92);
  --pp-bg-solid: #18181b;
  --pp-text: #fafafa;
  --pp-text-muted: #a1a1aa;
  --pp-border: rgba(63, 63, 70, 0.6);
  --pp-accent: #3b82f6;
  --pp-accent-hover: #60a5fa;
  --pp-success: #22c55e;
  --pp-warning: #eab308;
  --pp-danger: #ef4444;
  --pp-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.06);
  --pp-radius: 10px;
  --pp-radius-sm: 6px;
}

:host([data-theme="light"]) {
  --pp-bg: rgba(255, 255, 255, 0.92);
  --pp-bg-solid: #ffffff;
  --pp-text: #18181b;
  --pp-text-muted: #71717a;
  --pp-border: rgba(228, 228, 231, 0.8);
  --pp-accent: #2563eb;
  --pp-accent-hover: #3b82f6;
  --pp-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
}

:host([data-theme="light"]) .pp-popup__textarea {
  background: rgba(0, 0, 0, 0.06);
}

/* Toolbar */
.pp-toolbar {
  position: fixed;
  z-index: 2147483646;
  pointer-events: auto;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  background: var(--pp-bg);
  border: 1px solid var(--pp-border);
  border-radius: var(--pp-radius);
  box-shadow: var(--pp-shadow);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  cursor: default;
}

.pp-toolbar--collapsed {
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.pp-toolbar--expanded {
  padding: 12px;
  width: 320px;
  max-height: 420px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pp-toolbar__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--pp-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

/* Buttons */
.pp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid var(--pp-border);
  border-radius: var(--pp-radius-sm);
  background: transparent;
  color: var(--pp-text);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.pp-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--pp-accent);
}

.pp-btn--primary {
  background: var(--pp-accent);
  border-color: var(--pp-accent);
  color: #fff;
}

.pp-btn--primary:hover {
  background: var(--pp-accent-hover);
}

.pp-btn--sm {
  padding: 3px 6px;
  font-size: 11px;
}

.pp-btn--icon {
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--pp-text-muted);
  cursor: pointer;
  border-radius: var(--pp-radius-sm);
}

.pp-btn--icon:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--pp-text);
}

.pp-btn--icon-sm {
  padding: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, color 0.15s ease, background-color 0.15s ease;
}

.pp-pin-item:hover .pp-btn--icon-sm,
.pp-pin-item:focus-within .pp-btn--icon-sm {
  opacity: 1;
  pointer-events: auto;
}

.pp-btn--icon-sm:hover {
  background: rgba(239, 68, 68, 0.15);
  color: var(--pp-danger);
}

@media (hover: none) {
  .pp-btn--icon-sm {
    opacity: 0.6;
    pointer-events: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pp-btn--icon-sm { transition: none; }
}

/* Pin list */
.pp-pin-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  max-height: 240px;
  scrollbar-width: thin;
  scrollbar-color: var(--pp-border) transparent;
}

.pp-pin-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--pp-radius-sm);
  cursor: pointer;
  transition: background 0.1s;
}

.pp-pin-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.pp-pin-item__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  padding: 0 4px;
  border-radius: 11px;
  background: var(--pp-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.pp-pin-item__content {
  flex: 1;
  min-width: 0;
}

.pp-pin-item__comment {
  font-size: 12px;
  color: var(--pp-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.pp-pin-item__status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pp-pin-item__status--open { background: var(--pp-danger); }
.pp-pin-item__status--acknowledged { background: var(--pp-warning); }
.pp-pin-item__status--resolved { background: var(--pp-success); }
.pp-pin-item__status--dismissed { background: var(--pp-text-muted); }

/* Action bar \u2014 horizontal icon bar at bottom */
.pp-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--pp-border);
}

.pp-actions .pp-btn--icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pp-actions .pp-btn--icon:focus-visible {
  outline: 2px solid var(--pp-accent);
  outline-offset: 2px;
}

/* Popup */
.pp-popup {
  position: fixed;
  z-index: 2147483647;
  pointer-events: auto;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  background: var(--pp-bg);
  border: 1px solid var(--pp-border);
  border-radius: var(--pp-radius);
  box-shadow: var(--pp-shadow);
  padding: 10px;
  min-width: 280px;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pp-popup__element-info {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--pp-accent);
  word-break: break-all;
}

.pp-popup__component {
  font-size: 12px;
  color: var(--pp-text-muted);
}

.pp-popup__source {
  font-size: 11px;
  color: var(--pp-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pp-popup__source:hover {
  color: var(--pp-accent);
  text-decoration: underline;
}

/* Popup header with chevron toggle */
.pp-popup__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 2px 0;
}

.pp-popup__name {
  font-size: 12px;
  font-weight: 500;
  color: var(--pp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}

.pp-popup__chevron {
  color: var(--pp-text-muted);
  transition: transform 0.15s ease;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transform: rotate(-90deg);
}

.pp-popup__chevron--open {
  transform: rotate(0deg);
}

/* CSS-based collapsible \u2014 keeps DOM, animates height */
.pp-popup__details {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease-out;
}

.pp-popup__details--open {
  grid-template-rows: 1fr;
}

.pp-popup__details-inner {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .pp-popup__chevron,
  .pp-popup__details {
    transition: none;
  }
}

.pp-popup__textarea {
  width: 100%;
  min-height: 48px;
  max-height: 120px;
  padding: 8px;
  border: 1px solid var(--pp-border);
  border-radius: var(--pp-radius-sm);
  background: rgba(0, 0, 0, 0.2);
  color: var(--pp-text);
  font-size: 13px;
  font-family: inherit;
  resize: none;
  overflow-y: auto;
  outline: none;
}

.pp-popup__textarea:focus {
  border-color: var(--pp-accent);
}

.pp-popup__actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.pp-popup__actions .pp-btn {
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
}

/* Selection label */
.pp-selection-label {
  position: fixed;
  z-index: 2147483646;
  pointer-events: none;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--pp-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Context menu */
.pp-context-menu {
  position: fixed;
  z-index: 2147483647;
  pointer-events: auto;
  background: var(--pp-bg-solid);
  border: 1px solid var(--pp-border);
  border-radius: var(--pp-radius-sm);
  box-shadow: var(--pp-shadow);
  padding: 4px;
  min-width: 180px;
}

.pp-context-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--pp-text);
  transition: background 0.1s;
}

.pp-context-menu__item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.pp-context-menu__separator {
  height: 1px;
  background: var(--pp-border);
  margin: 4px 0;
}

/* Prompt mode */
.pp-prompt {
  position: fixed;
  z-index: 2147483647;
  pointer-events: auto;
  display: flex;
  gap: 6px;
  align-items: center;
}

.pp-prompt__input {
  padding: 6px 10px;
  border: 1px solid var(--pp-accent);
  border-radius: var(--pp-radius-sm);
  background: var(--pp-bg);
  color: var(--pp-text);
  font-size: 13px;
  font-family: inherit;
  min-width: 240px;
  outline: none;
  backdrop-filter: blur(12px) saturate(180%);
}

/* Settings panel */
.pp-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--pp-border);
}

.pp-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pp-settings__label {
  font-size: 12px;
  color: var(--pp-text);
}

.pp-settings__value {
  font-size: 11px;
  color: var(--pp-text-muted);
}

/* Toggle switch */
.pp-toggle {
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: var(--pp-border);
  cursor: pointer;
  transition: background 0.2s;
}

.pp-toggle--active {
  background: var(--pp-accent);
}

.pp-toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}

.pp-toggle--active .pp-toggle__thumb {
  transform: translateX(14px);
}

/* Kbd hints */
.pp-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 4px;
  border: 1px solid var(--pp-border);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 10px;
  font-family: inherit;
  color: var(--pp-text-muted);
  line-height: 1;
}

/* Mode tabs */
.pp-mode-tabs {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--pp-radius-sm);
}

.pp-mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--pp-text-muted);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.pp-mode-tab:hover {
  color: var(--pp-text);
  background: rgba(255, 255, 255, 0.04);
}

.pp-mode-tab--active {
  background: rgba(255, 255, 255, 0.08);
  color: var(--pp-text);
}

.pp-mode-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--pp-accent);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
}

/* Draw tools bar */
.pp-draw-tools {
  display: flex;
  align-items: center;
  gap: 2px;
}

.pp-draw-tool {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--pp-radius-sm);
  background: transparent;
  color: var(--pp-text-muted);
  cursor: pointer;
}

.pp-draw-tool:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--pp-text);
}

.pp-draw-tool--active {
  background: rgba(59, 130, 246, 0.15);
  color: var(--pp-accent);
}

.pp-draw-tool:disabled {
  opacity: 0.3;
  cursor: default;
}

/* Draw options row */
.pp-draw-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pp-draw-colors {
  display: flex;
  gap: 4px;
}

.pp-color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
}

.pp-color-swatch:hover {
  opacity: 0.85;
}

.pp-color-swatch--active {
  border-color: #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
}

.pp-draw-widths {
  display: flex;
  gap: 4px;
}

.pp-width-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--pp-radius-sm);
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.pp-width-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.pp-width-btn--active {
  background: rgba(255, 255, 255, 0.1);
  outline: 1px solid var(--pp-border);
}

/* Queue badge in toolbar header */
.pp-toolbar__queue-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--pp-warning);
  color: #000;
  font-size: 10px;
  font-weight: 700;
}

/* Popup input row with mic */
.pp-popup__input-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.pp-popup__input-row .pp-popup__textarea {
  flex: 1;
}

.pp-popup__mic {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-top: 4px;
}

.pp-popup__mic--recording {
  color: var(--pp-danger) !important;
  background: rgba(239, 68, 68, 0.15) !important;
  animation: pp-mic-pulse 1.2s ease-in-out infinite;
}

@keyframes pp-mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}

/* Ghost button (Fix this) */
.pp-btn--ghost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: none;
  border-radius: var(--pp-radius-sm);
  background: transparent;
  color: var(--pp-warning);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}

.pp-btn--ghost:hover {
  background: rgba(234, 179, 8, 0.1);
}

/* Text input popup for draw-mode text annotations */
.pp-text-input-popup {
  position: fixed;
  z-index: 2147483647;
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--pp-bg);
  border: 1px solid var(--pp-border);
  border-radius: var(--pp-radius-sm);
  box-shadow: var(--pp-shadow);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
}

.pp-text-input-popup__indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pp-text-input-popup__input {
  border: none;
  background: transparent;
  color: var(--pp-text);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  min-width: 200px;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--pp-border);
  border-radius: 2px;
}
`;

// src/ui/icons/index.ts
var S = 'width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
var icons = {
  pin: `<svg ${S}><path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4"/><path d="M9 15l-4.5 4.5"/><path d="M14.5 4l5.5 5.5"/></svg>`,
  mapPin: `<svg ${S}><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0"/></svg>`,
  crosshair: `<svg ${S}><path d="M4 8v-2a2 2 0 0 1 2 -2h2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M16 20h2a2 2 0 0 0 2 -2v-2"/><path d="M9 12l6 0"/><path d="M12 9l0 6"/></svg>`,
  send: `<svg ${S}><path d="M10 14l11 -11"/><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"/></svg>`,
  copy: `<svg ${S}><path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"/><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"/></svg>`,
  trash: `<svg ${S}><path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>`,
  settings: `<svg ${S}><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065"/><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/></svg>`,
  x: `<svg ${S}><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>`,
  chevronDown: `<svg ${S}><path d="M6 9l6 6l6 -6"/></svg>`,
  check: `<svg ${S}><path d="M5 12l5 5l10 -10"/></svg>`,
  messageSquare: `<svg ${S}><path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12"/></svg>`,
  eye: `<svg ${S}><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"/></svg>`,
  fileCode: `<svg ${S}><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2"/><path d="M10 13l-1 2l1 2"/><path d="M14 13l1 2l-1 2"/></svg>`,
  history: `<svg ${S}><path d="M12 8l0 4l2 2"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>`,
  minus: `<svg ${S}><path d="M5 12l14 0"/></svg>`,
  // Draw mode icons
  pencil: `<svg ${S}><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/><path d="M13.5 6.5l4 4"/></svg>`,
  arrowUpRight: `<svg ${S}><path d="M17 7l-10 10"/><path d="M8 7l9 0l0 9"/></svg>`,
  circle: `<svg ${S}><circle cx="12" cy="12" r="9"/></svg>`,
  square: `<svg ${S}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
  typography: `<svg ${S}><path d="M4 20l3 0"/><path d="M14 20l7 0"/><path d="M6.9 15l6.9 0"/><path d="M10.2 6.3l5.8 13.7"/><path d="M5 20l6 -16l2 0l7 16"/></svg>`,
  undo: `<svg ${S}><path d="M9 14l-4 -4l4 -4"/><path d="M5 10h11a4 4 0 1 1 0 8h-1"/></svg>`,
  palette: `<svg ${S}><path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25"/><circle cx="8.5" cy="10.5" r="1"/><circle cx="12.5" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/></svg>`,
  lineWeight: `<svg ${S}><path d="M4 6h16"/><path d="M4 12h16" stroke-width="3"/><path d="M4 18h16" stroke-width="5"/></svg>`,
  // Voice icon
  microphone: `<svg ${S}><path d="M9 2m0 3a3 3 0 0 1 3 -3h0a3 3 0 0 1 3 3v5a3 3 0 0 1 -3 3h0a3 3 0 0 1 -3 -3z"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M8 21l8 0"/><path d="M12 17l0 4"/></svg>`,
  microphoneOff: `<svg ${S}><path d="M3 3l18 18"/><path d="M9 5a3 3 0 0 1 6 0v5a3 3 0 0 1 -.13 .874m-2 2a3 3 0 0 1 -3.87 -2.872v-1"/><path d="M5 10a7 7 0 0 0 10.846 5.85m2 -2a6.967 6.967 0 0 0 1.152 -3.85"/><path d="M8 21l8 0"/><path d="M12 17l0 4"/></svg>`,
  // Queue & batch icons
  plus: `<svg ${S}><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg>`,
  stack: `<svg ${S}><path d="M12 2l-8 4l8 4l8 -4l-8 -4"/><path d="M4 10l8 4l8 -4"/><path d="M4 14l8 4l8 -4"/></svg>`,
  checkSquare: `<svg ${S}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2l4 -4"/></svg>`,
  squareEmpty: `<svg ${S}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  bolt: `<svg ${S}><path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"/></svg>`,
  checkCircle: `<svg ${S}><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2l4 -4"/></svg>`
};

// src/ui/components/Toolbar.tsx
var _tmpl$ = /* @__PURE__ */ template(`<div>`);
var _tmpl$2 = /* @__PURE__ */ template(`<div style=display:flex;align-items:center;justify-content:center;gap:6px><span style=display:flex;align-items:center>`);
var _tmpl$3 = /* @__PURE__ */ template(`<span class=pp-toolbar__badge>`);
var _tmpl$4 = /* @__PURE__ */ template(`<button class="pp-btn pp-btn--primary"style=width:100%><span style=display:inline-flex></span>Send <!> selected to Claude`);
var _tmpl$5 = /* @__PURE__ */ template(`<div class=pp-draw-tools><button title=Freehand></button><button title=Arrow></button><button title=Circle></button><button title=Rectangle></button><button title="Text note"></button><div style=flex:1></div><button class=pp-draw-tool title="Undo (remove last stroke)"></button><button class=pp-draw-tool title="Clear drawing">`);
var _tmpl$6 = /* @__PURE__ */ template(`<div class=pp-draw-options><div class=pp-draw-colors></div><div class=pp-draw-widths>`);
var _tmpl$7 = /* @__PURE__ */ template(`<div style=font-size:11px;color:var(--pp-text-muted);text-align:center> stroke`);
var _tmpl$8 = /* @__PURE__ */ template(`<div class=pp-settings><div class=pp-settings__row><span class=pp-settings__label>Output detail</span><select style="background:var(--pp-bg-solid);color:var(--pp-text);border:1px solid var(--pp-border);border-radius:var(--pp-radius-sm);padding:2px 6px;font-size:11px"><option value=compact>Compact</option><option value=standard>Standard</option><option value=detailed>Detailed</option></select></div><div class=pp-settings__row><span class=pp-settings__label>Auto-submit</span><div><div class=pp-toggle__thumb></div></div></div><div class=pp-settings__row><span class=pp-settings__label>Clear on send</span><div><div class=pp-toggle__thumb></div></div></div><div class=pp-settings__row><span class=pp-settings__label>Block page clicks</span><div><div class=pp-toggle__thumb></div></div></div><div class=pp-settings__row><span class=pp-settings__label>Compact popup</span><div><div class=pp-toggle__thumb>`);
var _tmpl$9 = /* @__PURE__ */ template(`<div style=display:contents><div style=display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;letter-spacing:0.02em;color:var(--pp-text-muted)><span></span></div><div class=pp-mode-tabs role=tablist><button role=tab><span></span>Select</button><button role=tab><span></span>Draw</button><button role=tab><span></span>Queue</button></div><div class=pp-actions role=toolbar aria-label="Pinpoint actions"><button class=pp-btn--icon title="Send to agent"aria-label="Send to agent"></button><button class=pp-btn--icon title="Copy to clipboard"aria-label="Copy to clipboard"></button><button class=pp-btn--icon title=Settings aria-label="Toggle settings"></button><button class=pp-btn--icon title=Close aria-label="Close toolbar">`);
var _tmpl$0 = /* @__PURE__ */ template(`<span class=pp-toolbar__queue-badge>`);
var _tmpl$1 = /* @__PURE__ */ template(`<span class=pp-mode-tab__count>`);
var _tmpl$10 = /* @__PURE__ */ template(`<div style=font-size:11px;color:var(--pp-accent);display:flex;align-items:center;gap:4px><span></span>Click any element to annotate`);
var _tmpl$11 = /* @__PURE__ */ template(`<div class=pp-pin-list>`);
var _tmpl$12 = /* @__PURE__ */ template(`<div class=pp-pin-item><div></div><span class=pp-pin-item__number></span><div class=pp-pin-item__content><div class=pp-pin-item__comment></div></div><button class="pp-btn--icon pp-btn--icon-sm"style=opacity:1;pointer-events:auto></button><button class="pp-btn--icon pp-btn--icon-sm"title="Remove pin"aria-label="Remove pin">`);
var _tmpl$13 = /* @__PURE__ */ template(`<span style=color:var(--pp-text-muted);font-style:italic>No comment`);
var _tmpl$14 = /* @__PURE__ */ template(`<button>`);
var _tmpl$15 = /* @__PURE__ */ template(`<button><div style=width:16px>`);
var _tmpl$16 = /* @__PURE__ */ template(`<div style="font-size:11px;color:var(--pp-text-muted);text-align:center;padding:8px 0">Queue is empty. Add pins or drawings, then queue them here.`);
var _tmpl$17 = /* @__PURE__ */ template(`<div style=font-size:11px;color:var(--pp-text-muted);text-align:center>`);
var _tmpl$18 = /* @__PURE__ */ template(`<div style=display:flex;gap:6px><button class=pp-btn style=flex:1>Clear</button><button class="pp-btn pp-btn--primary"style=flex:1><span style=display:inline-flex></span>Send All`);
var _tmpl$19 = /* @__PURE__ */ template(`<div class=pp-pin-item><span class=pp-pin-item__number></span><div class=pp-pin-item__content><div class=pp-pin-item__comment>`);
var _tmpl$20 = /* @__PURE__ */ template(`<button class=pp-btn--icon title="Clear all"aria-label="Clear all pins">`);
var DRAW_COLORS = [{
  color: "#EF4444",
  name: "Red"
}, {
  color: "#3B82F6",
  name: "Blue"
}, {
  color: "#22C55E",
  name: "Green"
}, {
  color: "#EAB308",
  name: "Yellow"
}];
var LINE_WIDTHS = [{
  width: 2,
  name: "Thin"
}, {
  width: 4,
  name: "Medium"
}, {
  width: 8,
  name: "Thick"
}];
var EDGE_GAP = 16;
var COLLAPSED_TOOLBAR_SIZE = 60;
var EXPANDED_TOOLBAR_WIDTH = 320;
var AGENT_SIDEBAR_SELECTOR = ".agent-sidebar-panel";
function clampRightOffset(right, toolbarWidth) {
  if (typeof window === "undefined") return right;
  const maxRight = Math.max(0, window.innerWidth - toolbarWidth - EDGE_GAP);
  return Math.min(right, maxRight);
}
function getVisibleRightSidebarInset() {
  if (typeof window === "undefined") return 0;
  let inset = 0;
  for (const panel of document.querySelectorAll(AGENT_SIDEBAR_SELECTOR)) {
    const style2 = window.getComputedStyle(panel);
    if (style2.display === "none" || style2.visibility === "hidden" || panel.getAttribute("aria-hidden") === "true") {
      continue;
    }
    const rect = panel.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const isAnchoredToRight = rect.right >= window.innerWidth - 1 && rect.left < window.innerWidth - 1;
    if (!isVisible || !isAnchoredToRight) continue;
    inset = Math.max(inset, Math.ceil(window.innerWidth - rect.left));
  }
  return inset;
}
var Toolbar = (props) => {
  const [pos, setPos] = createSignal(props.position ? {
    right: window.innerWidth - props.position.x,
    bottom: window.innerHeight - props.position.y
  } : {
    right: EDGE_GAP,
    bottom: EDGE_GAP
  });
  const [reservedRight, setReservedRight] = createSignal(0);
  const [dragging, setDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({
    x: 0,
    y: 0,
    right: 0,
    bottom: 0
  });
  const [didDrag, setDidDrag] = createSignal(false);
  onMount(() => {
    if (typeof window === "undefined") return;
    let resizeObserver;
    const updateReservedRight = () => {
      setReservedRight(getVisibleRightSidebarInset());
      resizeObserver?.disconnect();
      if (typeof ResizeObserver === "undefined") return;
      resizeObserver = new ResizeObserver(() => {
        setReservedRight(getVisibleRightSidebarInset());
      });
      for (const panel of document.querySelectorAll(AGENT_SIDEBAR_SELECTOR)) {
        resizeObserver.observe(panel);
      }
    };
    updateReservedRight();
    const mutationObserver = new MutationObserver(updateReservedRight);
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"],
      childList: true,
      subtree: true
    });
    window.addEventListener("resize", updateReservedRight);
    onCleanup(() => {
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateReservedRight);
    });
  });
  const toolbarRight = () => {
    const toolbarWidth = props.expanded ? EXPANDED_TOOLBAR_WIDTH : COLLAPSED_TOOLBAR_SIZE;
    return clampRightOffset((props.expanded ? EDGE_GAP : pos().right) + reservedRight(), toolbarWidth);
  };
  function handleMouseDown(e) {
    if (props.expanded) return;
    setDragging(true);
    setDidDrag(false);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      right: pos().right,
      bottom: pos().bottom
    });
    const handleMove = (e2) => {
      setDidDrag(true);
      const start = dragStart();
      const dx = e2.clientX - start.x;
      const dy = e2.clientY - start.y;
      const maxRight = Math.max(0, window.innerWidth - reservedRight() - COLLAPSED_TOOLBAR_SIZE);
      setPos({
        right: Math.max(0, Math.min(maxRight, start.right - dx)),
        bottom: Math.max(0, Math.min(window.innerHeight - COLLAPSED_TOOLBAR_SIZE, start.bottom - dy))
      });
    };
    const handleUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }
  function handleClick(e) {
    if (props.expanded) return;
    if (didDrag()) return;
    props.onToggleExpand();
  }
  const queueSummary = () => {
    const q = props.queue;
    let draws = 0;
    let clicks = 0;
    for (const item of q) {
      if (item.drawings?.length || item.textNotes?.length) draws++;
      if (item.pin) clicks++;
    }
    const parts = [];
    if (draws > 0) parts.push(`Draw x${draws}`);
    if (clicks > 0) parts.push(`Click x${clicks}`);
    return parts.join(" / ") || "Empty";
  };
  const totalBadgeCount = () => props.pins.length + props.queue.length + props.drawStrokeCount;
  return (() => {
    var _el$ = _tmpl$();
    addEventListener(_el$, "click", handleClick);
    addEventListener(_el$, "mousedown", props.expanded ? void 0 : handleMouseDown, true);
    insert(_el$, (() => {
      var _c$ = memo(() => !!!props.expanded);
      return () => _c$() ? (
        /* Collapsed pill */
        (() => {
          var _el$2 = _tmpl$2(), _el$3 = _el$2.firstChild;
          insert(_el$2, (() => {
            var _c$2 = memo(() => totalBadgeCount() > 0);
            return () => _c$2() && (() => {
              var _el$4 = _tmpl$3();
              insert(_el$4, totalBadgeCount);
              return _el$4;
            })();
          })(), _el$3);
          createRenderEffect(() => _el$3.innerHTML = icons.pin);
          return _el$2;
        })()
      ) : (
        /* Expanded toolbar */
        (() => {
          var _el$5 = _tmpl$9(), _el$6 = _el$5.firstChild, _el$7 = _el$6.firstChild, _el$8 = _el$6.nextSibling, _el$9 = _el$8.firstChild, _el$0 = _el$9.firstChild, _el$1 = _el$9.nextSibling, _el$10 = _el$1.firstChild, _el$11 = _el$1.nextSibling, _el$12 = _el$11.firstChild, _el$13 = _el$12.nextSibling, _el$49 = _el$8.nextSibling, _el$50 = _el$49.firstChild, _el$51 = _el$50.nextSibling, _el$52 = _el$51.nextSibling, _el$53 = _el$52.nextSibling;
          addEventListener(_el$5, "click", (e) => e.stopPropagation());
          insert(_el$7, () => props.author || "Pinpoint");
          insert(_el$6, (() => {
            var _c$3 = memo(() => props.queue.length > 0);
            return () => _c$3() && (() => {
              var _el$54 = _tmpl$0();
              insert(_el$54, () => props.queue.length);
              return _el$54;
            })();
          })(), null);
          addEventListener(_el$9, "click", () => props.onModeChange("select"));
          addEventListener(_el$1, "click", () => props.onModeChange("draw"));
          addEventListener(_el$11, "click", () => props.onModeChange("queue"));
          insert(_el$11, (() => {
            var _c$4 = memo(() => props.queue.length > 0);
            return () => _c$4() && (() => {
              var _el$55 = _tmpl$1();
              insert(_el$55, () => props.queue.length);
              return _el$55;
            })();
          })(), null);
          insert(_el$5, createComponent(Show, {
            get when() {
              return props.mode === "select";
            },
            get children() {
              return [memo(() => memo(() => props.pins.length === 0)() && (() => {
                var _el$56 = _tmpl$10(), _el$57 = _el$56.firstChild;
                createRenderEffect(() => _el$57.innerHTML = icons.crosshair);
                return _el$56;
              })()), memo(() => memo(() => props.pins.length > 0)() && (() => {
                var _el$58 = _tmpl$11();
                insert(_el$58, createComponent(For, {
                  get each() {
                    return props.pins;
                  },
                  children: (pin, index) => (() => {
                    var _el$59 = _tmpl$12(), _el$60 = _el$59.firstChild, _el$61 = _el$60.nextSibling, _el$62 = _el$61.nextSibling, _el$63 = _el$62.firstChild, _el$64 = _el$62.nextSibling, _el$65 = _el$64.nextSibling;
                    addEventListener(_el$59, "click", () => props.onEditPin(pin));
                    insert(_el$61, () => index() + 1);
                    insert(_el$63, () => pin.comment || _tmpl$13());
                    addEventListener(_el$64, "click", (e) => {
                      e.stopPropagation();
                      props.onTogglePinSelect(pin);
                    });
                    addEventListener(_el$65, "click", (e) => {
                      e.stopPropagation();
                      props.onRemovePin(pin.id);
                    });
                    createRenderEffect((_p$) => {
                      var _v$32 = `pp-pin-item__status pp-pin-item__status--${pin.status.state}`, _v$33 = props.selectedPinIds.has(pin.id) ? "Deselect" : "Select for send", _v$34 = props.selectedPinIds.has(pin.id) ? "Deselect" : "Select for send", _v$35 = props.selectedPinIds.has(pin.id) ? icons.checkSquare : icons.squareEmpty, _v$36 = props.selectedPinIds.has(pin.id) ? "var(--pp-accent)" : "var(--pp-text-muted)", _v$37 = icons.minus;
                      _v$32 !== _p$.e && className(_el$60, _p$.e = _v$32);
                      _v$33 !== _p$.t && setAttribute(_el$64, "title", _p$.t = _v$33);
                      _v$34 !== _p$.a && setAttribute(_el$64, "aria-label", _p$.a = _v$34);
                      _v$35 !== _p$.o && (_el$64.innerHTML = _p$.o = _v$35);
                      _v$36 !== _p$.i && setStyleProperty(_el$64, "color", _p$.i = _v$36);
                      _v$37 !== _p$.n && (_el$65.innerHTML = _p$.n = _v$37);
                      return _p$;
                    }, {
                      e: void 0,
                      t: void 0,
                      a: void 0,
                      o: void 0,
                      i: void 0,
                      n: void 0
                    });
                    return _el$59;
                  })()
                }));
                return _el$58;
              })()), createComponent(Show, {
                get when() {
                  return props.selectedPinIds.size > 0;
                },
                get children() {
                  var _el$14 = _tmpl$4(), _el$15 = _el$14.firstChild, _el$16 = _el$15.nextSibling, _el$18 = _el$16.nextSibling, _el$17 = _el$18.nextSibling;
                  addEventListener(_el$14, "click", () => props.onSendSelected());
                  insert(_el$14, () => props.selectedPinIds.size, _el$18);
                  createRenderEffect(() => _el$15.innerHTML = icons.send);
                  return _el$14;
                }
              })];
            }
          }), _el$49);
          insert(_el$5, createComponent(Show, {
            get when() {
              return props.mode === "draw";
            },
            get children() {
              return [(() => {
                var _el$19 = _tmpl$5(), _el$20 = _el$19.firstChild, _el$21 = _el$20.nextSibling, _el$22 = _el$21.nextSibling, _el$23 = _el$22.nextSibling, _el$24 = _el$23.nextSibling, _el$25 = _el$24.nextSibling, _el$26 = _el$25.nextSibling, _el$27 = _el$26.nextSibling;
                addEventListener(_el$20, "click", () => props.onDrawToolChange("freehand"));
                addEventListener(_el$21, "click", () => props.onDrawToolChange("arrow"));
                addEventListener(_el$22, "click", () => props.onDrawToolChange("circle"));
                addEventListener(_el$23, "click", () => props.onDrawToolChange("rect"));
                addEventListener(_el$24, "click", () => props.onDrawToolChange("text"));
                addEventListener(_el$26, "click", () => props.onDrawUndo());
                addEventListener(_el$27, "click", () => props.onDrawClear());
                createRenderEffect((_p$) => {
                  var _v$3 = `pp-draw-tool ${props.drawTool === "freehand" ? "pp-draw-tool--active" : ""}`, _v$4 = icons.pencil, _v$5 = `pp-draw-tool ${props.drawTool === "arrow" ? "pp-draw-tool--active" : ""}`, _v$6 = icons.arrowUpRight, _v$7 = `pp-draw-tool ${props.drawTool === "circle" ? "pp-draw-tool--active" : ""}`, _v$8 = icons.circle, _v$9 = `pp-draw-tool ${props.drawTool === "rect" ? "pp-draw-tool--active" : ""}`, _v$0 = icons.square, _v$1 = `pp-draw-tool ${props.drawTool === "text" ? "pp-draw-tool--active" : ""}`, _v$10 = icons.typography, _v$11 = icons.undo, _v$12 = props.drawStrokeCount === 0, _v$13 = icons.trash, _v$14 = props.drawStrokeCount === 0;
                  _v$3 !== _p$.e && className(_el$20, _p$.e = _v$3);
                  _v$4 !== _p$.t && (_el$20.innerHTML = _p$.t = _v$4);
                  _v$5 !== _p$.a && className(_el$21, _p$.a = _v$5);
                  _v$6 !== _p$.o && (_el$21.innerHTML = _p$.o = _v$6);
                  _v$7 !== _p$.i && className(_el$22, _p$.i = _v$7);
                  _v$8 !== _p$.n && (_el$22.innerHTML = _p$.n = _v$8);
                  _v$9 !== _p$.s && className(_el$23, _p$.s = _v$9);
                  _v$0 !== _p$.h && (_el$23.innerHTML = _p$.h = _v$0);
                  _v$1 !== _p$.r && className(_el$24, _p$.r = _v$1);
                  _v$10 !== _p$.d && (_el$24.innerHTML = _p$.d = _v$10);
                  _v$11 !== _p$.l && (_el$26.innerHTML = _p$.l = _v$11);
                  _v$12 !== _p$.u && (_el$26.disabled = _p$.u = _v$12);
                  _v$13 !== _p$.c && (_el$27.innerHTML = _p$.c = _v$13);
                  _v$14 !== _p$.w && (_el$27.disabled = _p$.w = _v$14);
                  return _p$;
                }, {
                  e: void 0,
                  t: void 0,
                  a: void 0,
                  o: void 0,
                  i: void 0,
                  n: void 0,
                  s: void 0,
                  h: void 0,
                  r: void 0,
                  d: void 0,
                  l: void 0,
                  u: void 0,
                  c: void 0,
                  w: void 0
                });
                return _el$19;
              })(), (() => {
                var _el$28 = _tmpl$6(), _el$29 = _el$28.firstChild, _el$30 = _el$29.nextSibling;
                insert(_el$29, createComponent(For, {
                  each: DRAW_COLORS,
                  children: (c) => (() => {
                    var _el$67 = _tmpl$14();
                    addEventListener(_el$67, "click", () => props.onDrawColorChange(c.color));
                    createRenderEffect((_p$) => {
                      var _v$38 = `pp-color-swatch ${props.drawColor === c.color ? "pp-color-swatch--active" : ""}`, _v$39 = c.color, _v$40 = c.name;
                      _v$38 !== _p$.e && className(_el$67, _p$.e = _v$38);
                      _v$39 !== _p$.t && setStyleProperty(_el$67, "background", _p$.t = _v$39);
                      _v$40 !== _p$.a && setAttribute(_el$67, "title", _p$.a = _v$40);
                      return _p$;
                    }, {
                      e: void 0,
                      t: void 0,
                      a: void 0
                    });
                    return _el$67;
                  })()
                }));
                insert(_el$30, createComponent(For, {
                  each: LINE_WIDTHS,
                  children: (w) => (() => {
                    var _el$68 = _tmpl$15(), _el$69 = _el$68.firstChild;
                    addEventListener(_el$68, "click", () => props.onDrawLineWidthChange(w.width));
                    createRenderEffect((_p$) => {
                      var _v$41 = `pp-width-btn ${props.drawLineWidth === w.width ? "pp-width-btn--active" : ""}`, _v$42 = w.name, _v$43 = `${w.width}px`, _v$44 = props.drawColor, _v$45 = `${w.width / 2}px`;
                      _v$41 !== _p$.e && className(_el$68, _p$.e = _v$41);
                      _v$42 !== _p$.t && setAttribute(_el$68, "title", _p$.t = _v$42);
                      _v$43 !== _p$.a && setStyleProperty(_el$69, "height", _p$.a = _v$43);
                      _v$44 !== _p$.o && setStyleProperty(_el$69, "background", _p$.o = _v$44);
                      _v$45 !== _p$.i && setStyleProperty(_el$69, "border-radius", _p$.i = _v$45);
                      return _p$;
                    }, {
                      e: void 0,
                      t: void 0,
                      a: void 0,
                      o: void 0,
                      i: void 0
                    });
                    return _el$68;
                  })()
                }));
                return _el$28;
              })(), createComponent(Show, {
                get when() {
                  return props.drawStrokeCount > 0;
                },
                get children() {
                  var _el$31 = _tmpl$7(), _el$32 = _el$31.firstChild;
                  insert(_el$31, () => props.drawStrokeCount, _el$32);
                  insert(_el$31, () => props.drawStrokeCount !== 1 ? "s" : "", null);
                  return _el$31;
                }
              })];
            }
          }), _el$49);
          insert(_el$5, createComponent(Show, {
            get when() {
              return props.mode === "queue";
            },
            get children() {
              return memo(() => props.queue.length === 0)() ? _tmpl$16() : [(() => {
                var _el$71 = _tmpl$17();
                insert(_el$71, queueSummary);
                return _el$71;
              })(), (() => {
                var _el$72 = _tmpl$11();
                insert(_el$72, createComponent(For, {
                  get each() {
                    return props.queue;
                  },
                  children: (item, index) => (() => {
                    var _el$77 = _tmpl$19(), _el$78 = _el$77.firstChild, _el$79 = _el$78.nextSibling, _el$80 = _el$79.firstChild;
                    insert(_el$78, () => index() + 1);
                    insert(_el$80, (() => {
                      var _c$6 = memo(() => !!item.pin);
                      return () => _c$6() ? item.pin.comment || "Pin annotation" : `Drawing (${(item.drawings?.length || 0) + (item.textNotes?.length || 0)} items)`;
                    })());
                    return _el$77;
                  })()
                }));
                return _el$72;
              })(), (() => {
                var _el$73 = _tmpl$18(), _el$74 = _el$73.firstChild, _el$75 = _el$74.nextSibling, _el$76 = _el$75.firstChild;
                addEventListener(_el$74, "click", () => props.onQueueClear());
                addEventListener(_el$75, "click", () => props.onQueueSend());
                createRenderEffect(() => _el$76.innerHTML = icons.send);
                return _el$73;
              })()];
            }
          }), _el$49);
          insert(_el$5, createComponent(Show, {
            get when() {
              return props.showSettings;
            },
            get children() {
              var _el$33 = _tmpl$8(), _el$34 = _el$33.firstChild, _el$35 = _el$34.firstChild, _el$36 = _el$35.nextSibling, _el$37 = _el$34.nextSibling, _el$38 = _el$37.firstChild, _el$39 = _el$38.nextSibling, _el$40 = _el$37.nextSibling, _el$41 = _el$40.firstChild, _el$42 = _el$41.nextSibling, _el$43 = _el$40.nextSibling, _el$44 = _el$43.firstChild, _el$45 = _el$44.nextSibling, _el$46 = _el$43.nextSibling, _el$47 = _el$46.firstChild, _el$48 = _el$47.nextSibling;
              _el$36.addEventListener("change", (e) => props.onOutputFormatChange(e.currentTarget.value));
              addEventListener(_el$39, "click", () => props.onAutoSubmitChange(!props.autoSubmit));
              addEventListener(_el$42, "click", () => props.onClearOnSendChange(!props.clearOnSend));
              addEventListener(_el$45, "click", () => props.onBlockInteractionsChange(!props.blockInteractions));
              addEventListener(_el$48, "click", () => props.onCompactPopupChange(!props.compactPopup));
              createRenderEffect((_p$) => {
                var _v$15 = `pp-toggle ${props.autoSubmit ? "pp-toggle--active" : ""}`, _v$16 = `pp-toggle ${props.clearOnSend ? "pp-toggle--active" : ""}`, _v$17 = `pp-toggle ${props.blockInteractions ? "pp-toggle--active" : ""}`, _v$18 = `pp-toggle ${props.compactPopup ? "pp-toggle--active" : ""}`;
                _v$15 !== _p$.e && className(_el$39, _p$.e = _v$15);
                _v$16 !== _p$.t && className(_el$42, _p$.t = _v$16);
                _v$17 !== _p$.a && className(_el$45, _p$.a = _v$17);
                _v$18 !== _p$.o && className(_el$48, _p$.o = _v$18);
                return _p$;
              }, {
                e: void 0,
                t: void 0,
                a: void 0,
                o: void 0
              });
              createRenderEffect(() => _el$36.value = props.outputFormat);
              return _el$33;
            }
          }), _el$49);
          addEventListener(_el$50, "click", () => props.onSend());
          addEventListener(_el$51, "click", () => props.onCopy());
          insert(_el$49, (() => {
            var _c$5 = memo(() => props.pins.length > 0);
            return () => _c$5() && (() => {
              var _el$81 = _tmpl$20();
              addEventListener(_el$81, "click", () => props.onClear());
              createRenderEffect(() => _el$81.innerHTML = icons.trash);
              return _el$81;
            })();
          })(), _el$52);
          addEventListener(_el$52, "click", () => props.onToggleSettings());
          addEventListener(_el$53, "click", () => props.onToggleExpand());
          createRenderEffect((_p$) => {
            var _v$19 = `pp-mode-tab ${props.mode === "select" ? "pp-mode-tab--active" : ""}`, _v$20 = props.mode === "select", _v$21 = icons.crosshair, _v$22 = `pp-mode-tab ${props.mode === "draw" ? "pp-mode-tab--active" : ""}`, _v$23 = props.mode === "draw", _v$24 = icons.pencil, _v$25 = `pp-mode-tab ${props.mode === "queue" ? "pp-mode-tab--active" : ""}`, _v$26 = props.mode === "queue", _v$27 = icons.stack, _v$28 = icons.send, _v$29 = icons.copy, _v$30 = icons.settings, _v$31 = icons.x;
            _v$19 !== _p$.e && className(_el$9, _p$.e = _v$19);
            _v$20 !== _p$.t && setAttribute(_el$9, "aria-selected", _p$.t = _v$20);
            _v$21 !== _p$.a && (_el$0.innerHTML = _p$.a = _v$21);
            _v$22 !== _p$.o && className(_el$1, _p$.o = _v$22);
            _v$23 !== _p$.i && setAttribute(_el$1, "aria-selected", _p$.i = _v$23);
            _v$24 !== _p$.n && (_el$10.innerHTML = _p$.n = _v$24);
            _v$25 !== _p$.s && className(_el$11, _p$.s = _v$25);
            _v$26 !== _p$.h && setAttribute(_el$11, "aria-selected", _p$.h = _v$26);
            _v$27 !== _p$.r && (_el$12.innerHTML = _p$.r = _v$27);
            _v$28 !== _p$.d && (_el$50.innerHTML = _p$.d = _v$28);
            _v$29 !== _p$.l && (_el$51.innerHTML = _p$.l = _v$29);
            _v$30 !== _p$.u && (_el$52.innerHTML = _p$.u = _v$30);
            _v$31 !== _p$.c && (_el$53.innerHTML = _p$.c = _v$31);
            return _p$;
          }, {
            e: void 0,
            t: void 0,
            a: void 0,
            o: void 0,
            i: void 0,
            n: void 0,
            s: void 0,
            h: void 0,
            r: void 0,
            d: void 0,
            l: void 0,
            u: void 0,
            c: void 0
          });
          return _el$5;
        })()
      );
    })());
    createRenderEffect((_p$) => {
      var _v$ = `pp-toolbar ${props.expanded ? "pp-toolbar--expanded" : "pp-toolbar--collapsed"}`, _v$2 = {
        ...props.expanded ? {
          bottom: `${EDGE_GAP}px`,
          right: `${toolbarRight()}px`
        } : {
          right: `${toolbarRight()}px`,
          bottom: `${pos().bottom}px`
        }
      };
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _p$.t = style(_el$, _v$2, _p$.t);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$;
  })();
};
delegateEvents(["mousedown"]);

// src/ui/components/OverlayCanvas.tsx
var _tmpl$21 = /* @__PURE__ */ template(`<canvas style=position:fixed;top:0;left:0;z-index:2147483645>`);
function lerp(start, end, t) {
  return start + (end - start) * t;
}
var OverlayCanvas = (props) => {
  let canvasRef;
  let animFrameId = null;
  let currentRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };
  let targetRect = null;
  const LERP_SPEED = 0.25;
  function resizeCanvas() {
    if (!canvasRef) return;
    const dpr = window.devicePixelRatio || 1;
    canvasRef.width = window.innerWidth * dpr;
    canvasRef.height = window.innerHeight * dpr;
    canvasRef.style.width = `${window.innerWidth}px`;
    canvasRef.style.height = `${window.innerHeight}px`;
    const ctx = canvasRef.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }
  function drawStroke(ctx, stroke) {
    if (stroke.points.length < 1) return;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
    if (stroke.type === "freehand") {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    } else if (stroke.type === "arrow") {
      if (stroke.points.length < 2) return;
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLen = 12 + stroke.lineWidth * 2;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    } else if (stroke.type === "circle") {
      if (stroke.points.length < 2) return;
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (stroke.type === "rect") {
      if (stroke.points.length < 2) return;
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    }
  }
  function drawTextNote(ctx, note) {
    const fontSize = 13;
    const padding = 6;
    ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    const metrics = ctx.measureText(note.text);
    const textWidth = metrics.width;
    const textHeight = fontSize + 2;
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    const bgX = note.x - 2;
    const bgY = note.y - textHeight - padding / 2;
    const bgW = textWidth + padding * 2;
    const bgH = textHeight + padding;
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(bgX + r, bgY);
    ctx.lineTo(bgX + bgW - r, bgY);
    ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + r);
    ctx.lineTo(bgX + bgW, bgY + bgH - r);
    ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - r, bgY + bgH);
    ctx.lineTo(bgX + r, bgY + bgH);
    ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - r);
    ctx.lineTo(bgX, bgY + r);
    ctx.quadraticCurveTo(bgX, bgY, bgX + r, bgY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = note.color;
    ctx.beginPath();
    ctx.arc(bgX + padding, bgY + bgH / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(note.text, bgX + padding + 10, note.y - 2);
  }
  function draw() {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvasRef.width / dpr, canvasRef.height / dpr);
    if (props.active && !props.drawMode && props.hoveredRect) {
      targetRect = {
        x: props.hoveredRect.x,
        y: props.hoveredRect.y,
        width: props.hoveredRect.width,
        height: props.hoveredRect.height
      };
    } else if (props.active && !props.drawMode) {
      targetRect = null;
    }
    if (props.active && !props.drawMode && targetRect) {
      currentRect.x = lerp(currentRect.x, targetRect.x, LERP_SPEED);
      currentRect.y = lerp(currentRect.y, targetRect.y, LERP_SPEED);
      currentRect.width = lerp(currentRect.width, targetRect.width, LERP_SPEED);
      currentRect.height = lerp(currentRect.height, targetRect.height, LERP_SPEED);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.fillStyle = "rgba(59, 130, 246, 0.06)";
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }
    if (props.active && !props.drawMode && props.dragRect) {
      ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(props.dragRect.x, props.dragRect.y, props.dragRect.width, props.dragRect.height);
      ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
      ctx.fillRect(props.dragRect.x, props.dragRect.y, props.dragRect.width, props.dragRect.height);
    }
    for (const stroke of props.drawStrokes) {
      drawStroke(ctx, stroke);
    }
    if (props.currentStroke) {
      drawStroke(ctx, props.currentStroke);
    }
    for (const note of props.textNotes) {
      drawTextNote(ctx, note);
    }
    animFrameId = requestAnimationFrame(draw);
  }
  function handleMouseDown(e) {
    if (!props.drawMode) return;
    if (props.drawTool === "text") {
      props.onTextPlace(e.clientX, e.clientY);
    } else {
      props.onDrawStart(e.clientX, e.clientY);
    }
  }
  function handleMouseMove(e) {
    if (!props.drawMode) return;
    props.onDrawMove(e.clientX, e.clientY);
  }
  function handleMouseUp(_e) {
    if (!props.drawMode) return;
    props.onDrawEnd();
  }
  function handleTouchStart(e) {
    if (!props.drawMode) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (props.drawTool === "text") {
      props.onTextPlace(touch.clientX, touch.clientY);
    } else {
      props.onDrawStart(touch.clientX, touch.clientY);
    }
  }
  function handleTouchMove(e) {
    if (!props.drawMode) return;
    e.preventDefault();
    const touch = e.touches[0];
    props.onDrawMove(touch.clientX, touch.clientY);
  }
  function handleTouchEnd(e) {
    if (!props.drawMode) return;
    e.preventDefault();
    props.onDrawEnd();
  }
  onMount(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animFrameId = requestAnimationFrame(draw);
  });
  onCleanup(() => {
    window.removeEventListener("resize", resizeCanvas);
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
    }
  });
  return (() => {
    var _el$ = _tmpl$21();
    _el$.$$touchend = handleTouchEnd;
    _el$.$$touchmove = handleTouchMove;
    _el$.$$touchstart = handleTouchStart;
    _el$.$$mouseup = handleMouseUp;
    _el$.$$mousemove = handleMouseMove;
    _el$.$$mousedown = handleMouseDown;
    var _ref$ = canvasRef;
    typeof _ref$ === "function" ? use(_ref$, _el$) : canvasRef = _el$;
    createRenderEffect((_p$) => {
      var _v$ = props.drawMode ? "auto" : "none", _v$2 = props.drawMode ? props.drawTool === "text" ? "text" : "crosshair" : "default";
      _v$ !== _p$.e && setStyleProperty(_el$, "pointer-events", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "cursor", _p$.t = _v$2);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$;
  })();
};
delegateEvents(["mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend"]);

// src/ui/components/PinPopup.tsx
var _tmpl$22 = /* @__PURE__ */ template(`<div class=pp-popup><div class=pp-popup__input-row><textarea class=pp-popup__textarea placeholder="Add your feedback..."></textarea></div><div class=pp-popup__actions><button class="pp-btn pp-btn--ghost"title="Send 'Fix this' to agent"><span style=display:inline-flex></span>Fix</button><div style=flex:1></div><button class=pp-btn>Cancel</button><button class="pp-btn pp-btn--primary">`);
var _tmpl$23 = /* @__PURE__ */ template(`<div class=pp-popup__header><span class=pp-popup__name></span><span>`);
var _tmpl$32 = /* @__PURE__ */ template(`<div><div class=pp-popup__details-inner><div class=pp-popup__element-info>`);
var _tmpl$42 = /* @__PURE__ */ template(`<div class=pp-popup__source><span style=display:inline-flex;vertical-align:middle></span> `);
var _tmpl$52 = /* @__PURE__ */ template(`<div class=pp-popup__component>`);
var _tmpl$62 = /* @__PURE__ */ template(`<div class=pp-popup__element-info>`);
var _tmpl$72 = /* @__PURE__ */ template(`<button>`);
var _tmpl$82 = /* @__PURE__ */ template(`<button class=pp-btn title="Add to queue"><span style=display:inline-flex></span>Queue`);
function getSpeechRecognition() {
  const w = window;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}
var PinPopup = (props) => {
  const [comment, setComment] = createSignal(props.initialComment || "");
  const [showDetails, setShowDetails] = createSignal(false);
  const [isRecording, setIsRecording] = createSignal(false);
  let textareaRef;
  let recognitionRef = null;
  const compact = () => props.compactPopup ?? true;
  const hasSpeechAPI = !!getSpeechRecognition();
  const displayName = () => {
    if (props.context.framework?.componentPath) {
      return props.context.framework.componentPath;
    }
    return `<${props.context.element.tagName.toLowerCase()}>`;
  };
  const popupPosition = () => {
    const rect = props.context.element.boundingRect;
    const estimatedHeight = compact() && showDetails() ? 260 : 220;
    const popupX = Math.min(rect.x, window.innerWidth - 380);
    const popupY = rect.y + rect.height + 8;
    const adjustedY = popupY + estimatedHeight > window.innerHeight ? rect.y - estimatedHeight - 8 : popupY;
    return {
      x: Math.max(8, popupX),
      y: Math.max(8, adjustedY)
    };
  };
  async function openFileHandler() {
    try {
      const file = props.context.framework?.sourceFile;
      if (!file) return;
      const {
        openFile
      } = await import("./open-file-RQVHOCXI.js");
      openFile(file);
    } catch {
    }
  }
  function toggleRecording() {
    if (isRecording()) {
      stopRecording();
    } else {
      startRecording();
    }
  }
  function startRecording() {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalTranscript = "";
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim = transcript;
        }
      }
      const current = comment();
      const separator = current && !current.endsWith(" ") ? " " : "";
      setComment(current + separator + finalTranscript + interim);
      finalTranscript = "";
      if (textareaRef) {
        textareaRef.style.height = "auto";
        textareaRef.style.height = Math.min(textareaRef.scrollHeight, 120) + "px";
      }
    };
    recognition.onerror = () => {
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognition.start();
    recognitionRef = recognition;
    setIsRecording(true);
  }
  function stopRecording() {
    recognitionRef?.stop();
    recognitionRef = null;
    setIsRecording(false);
  }
  onMount(() => {
    textareaRef?.focus();
    if (props.initialComment && textareaRef) {
      textareaRef.selectionStart = textareaRef.value.length;
    }
    const onEsc = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        stopRecording();
        props.onCancel();
      }
    };
    document.addEventListener("keydown", onEsc, true);
    onCleanup(() => {
      document.removeEventListener("keydown", onEsc, true);
      stopRecording();
    });
  });
  function handleSubmit() {
    const text = comment().trim();
    if (!text) return;
    stopRecording();
    props.onAdd(text);
  }
  function handleQueue() {
    const text = comment().trim();
    if (!text) return;
    stopRecording();
    props.onQueue?.(text);
  }
  function handleFixThis() {
    const text = comment().trim() || `Fix this ${displayName()}`;
    stopRecording();
    props.onFixThis?.(text);
  }
  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      stopRecording();
      props.onCancel();
    }
  }
  function handleAutoGrow(e) {
    const el = e.currentTarget;
    setComment(el.value);
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }
  return (() => {
    var _el$ = _tmpl$22(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$2.nextSibling, _el$5 = _el$4.firstChild, _el$6 = _el$5.firstChild, _el$7 = _el$5.nextSibling, _el$8 = _el$7.nextSibling, _el$9 = _el$8.nextSibling;
    insert(_el$, (() => {
      var _c$ = memo(() => !!compact());
      return () => _c$() ? (
        /* Compact mode — friendly name + collapsible details */
        [(() => {
          var _el$0 = _tmpl$23(), _el$1 = _el$0.firstChild, _el$10 = _el$1.nextSibling;
          addEventListener(_el$0, "click", () => setShowDetails(!showDetails()));
          insert(_el$1, displayName);
          createRenderEffect((_p$) => {
            var _v$5 = `pp-popup__chevron ${showDetails() ? "pp-popup__chevron--open" : ""}`, _v$6 = icons.chevronDown, _v$7 = showDetails();
            _v$5 !== _p$.e && className(_el$10, _p$.e = _v$5);
            _v$6 !== _p$.t && (_el$10.innerHTML = _p$.t = _v$6);
            _v$7 !== _p$.a && setAttribute(_el$10, "aria-expanded", _p$.a = _v$7);
            return _p$;
          }, {
            e: void 0,
            t: void 0,
            a: void 0
          });
          return _el$0;
        })(), (() => {
          var _el$11 = _tmpl$32(), _el$12 = _el$11.firstChild, _el$13 = _el$12.firstChild;
          insert(_el$13, () => props.context.cssSelector);
          insert(_el$12, createComponent(Show, {
            get when() {
              return props.context.framework?.sourceFile;
            },
            children: (file) => (() => {
              var _el$14 = _tmpl$42(), _el$15 = _el$14.firstChild, _el$16 = _el$15.nextSibling;
              addEventListener(_el$14, "click", openFileHandler);
              insert(_el$14, () => file().split("/").pop(), null);
              createRenderEffect((_p$) => {
                var _v$8 = file(), _v$9 = icons.fileCode;
                _v$8 !== _p$.e && setAttribute(_el$14, "title", _p$.e = _v$8);
                _v$9 !== _p$.t && (_el$15.innerHTML = _p$.t = _v$9);
                return _p$;
              }, {
                e: void 0,
                t: void 0
              });
              return _el$14;
            })()
          }), null);
          createRenderEffect(() => className(_el$11, `pp-popup__details ${showDetails() ? "pp-popup__details--open" : ""}`));
          return _el$11;
        })()]
      ) : (
        /* Expanded mode — all info visible */
        [(() => {
          var _el$17 = _tmpl$52();
          insert(_el$17, displayName);
          return _el$17;
        })(), (() => {
          var _el$18 = _tmpl$62();
          insert(_el$18, () => props.context.cssSelector);
          return _el$18;
        })(), createComponent(Show, {
          get when() {
            return props.context.framework?.sourceFile;
          },
          children: (file) => (() => {
            var _el$19 = _tmpl$42(), _el$20 = _el$19.firstChild, _el$21 = _el$20.nextSibling;
            addEventListener(_el$19, "click", openFileHandler);
            insert(_el$19, () => file().split("/").pop(), null);
            createRenderEffect((_p$) => {
              var _v$0 = file(), _v$1 = icons.fileCode;
              _v$0 !== _p$.e && setAttribute(_el$19, "title", _p$.e = _v$0);
              _v$1 !== _p$.t && (_el$20.innerHTML = _p$.t = _v$1);
              return _p$;
            }, {
              e: void 0,
              t: void 0
            });
            return _el$19;
          })()
        })]
      );
    })(), _el$2);
    addEventListener(_el$3, "keydown", handleKeyDown);
    addEventListener(_el$3, "input", handleAutoGrow);
    var _ref$ = textareaRef;
    typeof _ref$ === "function" ? use(_ref$, _el$3) : textareaRef = _el$3;
    insert(_el$2, hasSpeechAPI && (() => {
      var _el$22 = _tmpl$72();
      addEventListener(_el$22, "click", toggleRecording);
      createRenderEffect((_p$) => {
        var _v$10 = `pp-btn--icon pp-popup__mic ${isRecording() ? "pp-popup__mic--recording" : ""}`, _v$11 = isRecording() ? "Stop recording" : "Voice input", _v$12 = isRecording() ? "Stop recording" : "Voice input", _v$13 = isRecording() ? icons.microphoneOff : icons.microphone;
        _v$10 !== _p$.e && className(_el$22, _p$.e = _v$10);
        _v$11 !== _p$.t && setAttribute(_el$22, "title", _p$.t = _v$11);
        _v$12 !== _p$.a && setAttribute(_el$22, "aria-label", _p$.a = _v$12);
        _v$13 !== _p$.o && (_el$22.innerHTML = _p$.o = _v$13);
        return _p$;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0
      });
      return _el$22;
    })(), null);
    addEventListener(_el$5, "click", handleFixThis);
    addEventListener(_el$8, "click", () => props.onCancel());
    insert(_el$4, (() => {
      var _c$2 = memo(() => !!(props.queueMode && props.onQueue));
      return () => _c$2() && (() => {
        var _el$23 = _tmpl$82(), _el$24 = _el$23.firstChild;
        addEventListener(_el$23, "click", handleQueue);
        createRenderEffect((_p$) => {
          var _v$14 = !comment().trim(), _v$15 = icons.plus;
          _v$14 !== _p$.e && (_el$23.disabled = _p$.e = _v$14);
          _v$15 !== _p$.t && (_el$24.innerHTML = _p$.t = _v$15);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$23;
      })();
    })(), _el$9);
    addEventListener(_el$9, "click", () => handleSubmit());
    insert(_el$9, () => props.isEditing ? "Save" : "Add Pin");
    createRenderEffect((_p$) => {
      var _v$ = `${popupPosition().x}px`, _v$2 = `${popupPosition().y}px`, _v$3 = icons.bolt, _v$4 = !comment().trim();
      _v$ !== _p$.e && setStyleProperty(_el$, "left", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "top", _p$.t = _v$2);
      _v$3 !== _p$.a && (_el$6.innerHTML = _p$.a = _v$3);
      _v$4 !== _p$.o && (_el$9.disabled = _p$.o = _v$4);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    createRenderEffect(() => _el$3.value = comment());
    return _el$;
  })();
};

// src/ui/components/ContextMenu.tsx
var _tmpl$24 = /* @__PURE__ */ template(`<div class=pp-context-menu><div class=pp-context-menu__item><span></span>Add Annotation</div><div class=pp-context-menu__item><span></span>Quick Prompt</div><div class=pp-context-menu__separator></div><div class=pp-context-menu__item><span></span>Copy Element Context</div><div class=pp-context-menu__item><span></span>Copy HTML Snippet</div><div class=pp-context-menu__item><span></span>Copy Computed Styles`);
var ContextMenu = (props) => {
  let menuRef;
  onMount(() => {
    const handleClick = (e) => {
      if (menuRef && !e.composedPath().includes(menuRef)) {
        props.onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") props.onClose();
    };
    setTimeout(() => {
      document.addEventListener("click", handleClick, true);
      document.addEventListener("keydown", handleKeyDown, true);
    }, 0);
    onCleanup(() => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    });
  });
  const x = Math.min(props.position.x, window.innerWidth - 200);
  const y = Math.min(props.position.y, window.innerHeight - 250);
  return (() => {
    var _el$ = _tmpl$24(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$2.nextSibling, _el$5 = _el$4.firstChild, _el$6 = _el$4.nextSibling, _el$7 = _el$6.nextSibling, _el$8 = _el$7.firstChild, _el$9 = _el$7.nextSibling, _el$0 = _el$9.firstChild, _el$1 = _el$9.nextSibling, _el$10 = _el$1.firstChild;
    var _ref$ = menuRef;
    typeof _ref$ === "function" ? use(_ref$, _el$) : menuRef = _el$;
    setStyleProperty(_el$, "left", `${x}px`);
    setStyleProperty(_el$, "top", `${y}px`);
    addEventListener(_el$2, "click", () => props.onAnnotate());
    addEventListener(_el$4, "click", () => props.onPrompt());
    addEventListener(_el$7, "click", () => props.onCopyContext());
    addEventListener(_el$9, "click", async () => {
      const html = props.element.outerHTML.replace(/\s+/g, " ").trim().slice(0, 500);
      await navigator.clipboard.writeText(html);
      props.onClose();
    });
    addEventListener(_el$1, "click", async () => {
      const styles = window.getComputedStyle(props.element);
      const relevant = ["color", "background-color", "font-size", "font-family", "padding", "margin", "border", "display", "position", "width", "height"];
      const result = relevant.map((key) => `${key}: ${styles.getPropertyValue(key)}`).join("\n");
      await navigator.clipboard.writeText(result);
      props.onClose();
    });
    createRenderEffect((_p$) => {
      var _v$ = icons.pin, _v$2 = icons.messageSquare, _v$3 = icons.copy, _v$4 = icons.fileCode, _v$5 = icons.eye;
      _v$ !== _p$.e && (_el$3.innerHTML = _p$.e = _v$);
      _v$2 !== _p$.t && (_el$5.innerHTML = _p$.t = _v$2);
      _v$3 !== _p$.a && (_el$8.innerHTML = _p$.a = _v$3);
      _v$4 !== _p$.o && (_el$0.innerHTML = _p$.o = _v$4);
      _v$5 !== _p$.i && (_el$10.innerHTML = _p$.i = _v$5);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0
    });
    return _el$;
  })();
};

// src/ui/components/SelectionLabel.tsx
var _tmpl$25 = /* @__PURE__ */ template(`<div class=pp-selection-label>`);
var SelectionLabel = (props) => {
  return createComponent(Show, {
    get when() {
      return props.info;
    },
    children: (info) => {
      const {
        text,
        rect
      } = info();
      const y = rect.top > 30 ? rect.top - 24 : rect.bottom + 4;
      const x = Math.max(4, Math.min(rect.left, window.innerWidth - 300));
      return (() => {
        var _el$ = _tmpl$25();
        setStyleProperty(_el$, "left", `${x}px`);
        setStyleProperty(_el$, "top", `${y}px`);
        insert(_el$, text);
        return _el$;
      })();
    }
  });
};

// src/ui/components/PromptMode.tsx
var _tmpl$26 = /* @__PURE__ */ template(`<div class=pp-prompt><input class=pp-prompt__input type=text placeholder="Tell the agent what to do..."><button class="pp-btn pp-btn--primary pp-btn--sm"><span>`);
var PromptMode = (props) => {
  const [instruction, setInstruction] = createSignal("");
  let inputRef;
  onMount(() => inputRef?.focus());
  function handleSubmit() {
    const text = instruction().trim();
    if (!text) return;
    props.onSend(text);
  }
  const rect = props.element.getBoundingClientRect();
  const x = Math.max(8, Math.min(rect.left, window.innerWidth - 300));
  const y = rect.bottom + 8 > window.innerHeight - 40 ? rect.top - 40 : rect.bottom + 8;
  return (() => {
    var _el$ = _tmpl$26(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.firstChild;
    setStyleProperty(_el$, "left", `${x}px`);
    setStyleProperty(_el$, "top", `${y}px`);
    _el$2.$$keydown = (e) => {
      if (e.key === "Enter") handleSubmit();
      if (e.key === "Escape") props.onCancel();
    };
    _el$2.$$input = (e) => setInstruction(e.currentTarget.value);
    var _ref$ = inputRef;
    typeof _ref$ === "function" ? use(_ref$, _el$2) : inputRef = _el$2;
    _el$3.$$click = handleSubmit;
    createRenderEffect(() => _el$4.innerHTML = icons.send);
    createRenderEffect(() => _el$2.value = instruction());
    return _el$;
  })();
};
delegateEvents(["input", "keydown", "click"]);

// src/ui/components/TextInputPopup.tsx
var _tmpl$27 = /* @__PURE__ */ template(`<div class=pp-text-input-popup><div class=pp-text-input-popup__indicator></div><input class=pp-text-input-popup__input type=text placeholder="Add text note...">`);
var TextInputPopup = (props) => {
  const [text, setText] = createSignal("");
  let inputRef;
  onMount(() => inputRef?.focus());
  function handleSubmit() {
    const t = text().trim();
    if (t) props.onSubmit(t);
    else props.onCancel();
  }
  const x = Math.max(8, Math.min(props.x, window.innerWidth - 260));
  const y = Math.max(8, Math.min(props.y + 8, window.innerHeight - 50));
  return (() => {
    var _el$ = _tmpl$27(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
    setStyleProperty(_el$, "left", `${x}px`);
    setStyleProperty(_el$, "top", `${y}px`);
    _el$3.addEventListener("blur", handleSubmit);
    _el$3.$$keydown = (e) => {
      if (e.key === "Enter") handleSubmit();
      if (e.key === "Escape") props.onCancel();
    };
    _el$3.$$input = (e) => setText(e.currentTarget.value);
    var _ref$ = inputRef;
    typeof _ref$ === "function" ? use(_ref$, _el$3) : inputRef = _el$3;
    createRenderEffect((_$p) => setStyleProperty(_el$2, "background", props.color));
    createRenderEffect(() => _el$3.value = text());
    return _el$;
  })();
};
delegateEvents(["input", "keydown"]);

// src/ui/components/PinpointApp.tsx
var PinpointApp = (props) => {
  const [active, setActive] = createSignal(false);
  const [expanded, setExpanded] = createSignal(false);
  const [pins, setPins] = createSignal([]);
  const [hoveredElement, setHoveredElement] = createSignal(null);
  const [hoveredRect, setHoveredRect] = createSignal(null);
  const [selectedElement, setSelectedElement] = createSignal(null);
  const [selectedContext, setSelectedContext] = createSignal(null);
  const [showPopup, setShowPopup] = createSignal(false);
  const [editingPin, setEditingPin] = createSignal(null);
  const [showContextMenu, setShowContextMenu] = createSignal(false);
  const [contextMenuPos, setContextMenuPos] = createSignal({
    x: 0,
    y: 0
  });
  const [showSettings, setShowSettings] = createSignal(false);
  const [showPrompt, setShowPrompt] = createSignal(false);
  const [selectionLabelInfo, setSelectionLabelInfo] = createSignal(null);
  const [dragRect, setDragRect] = createSignal(null);
  const [mode, setMode] = createSignal("select");
  const [drawMode, setDrawMode] = createSignal(false);
  const [drawStrokes, setDrawStrokes] = createSignal([]);
  const [currentStroke, setCurrentStroke] = createSignal(null);
  const [drawColor, setDrawColor] = createSignal("#EF4444");
  const [drawLineWidth, setDrawLineWidth] = createSignal(4);
  const [drawTool, setDrawTool] = createSignal("freehand");
  const [textNotes, setTextNotes] = createSignal([]);
  const [showTextInput, setShowTextInput] = createSignal(false);
  const [textInputPos, setTextInputPos] = createSignal({
    x: 0,
    y: 0
  });
  let isDrawing = false;
  const [queue, setQueue] = createSignal([]);
  const [selectedPinIds, setSelectedPinIds] = createSignal(/* @__PURE__ */ new Set());
  const [outputFormat, setOutputFormat] = createSignal(props.config.outputFormat || "detailed");
  const [clearOnSend, setClearOnSend] = createSignal(props.config.clearOnSend ?? false);
  const [blockInteractions, setBlockInteractions] = createSignal(props.config.blockInteractions ?? false);
  const [autoSubmit, setAutoSubmit] = createSignal(props.config.autoSubmit ?? true);
  const [compactPopup, setCompactPopup] = createSignal(props.config.compactPopup ?? true);
  async function deliverToAgent(output) {
    const agentOutput = {
      ...output,
      submit: output.submit ?? autoSubmit()
    };
    if (props.config.sendToAgent) {
      await props.config.sendToAgent(agentOutput);
      return;
    }
    try {
      const {
        sendToAgentChat
      } = await import("@agent-native/core/client");
      sendToAgentChat(agentOutput);
    } catch {
      await navigator.clipboard.writeText([agentOutput.message, agentOutput.context].filter(Boolean).join("\n\n"));
    }
  }
  const storage = props.config.storage || (props.config.endpoint ? new RestClient(props.config.endpoint) : new MemoryStore());
  const picker = new ElementPicker({
    ignoreSelector: "#pinpoint-root, [data-pinpoint-marker]",
    blockInteractions: blockInteractions(),
    onHover: (element, rect) => {
      setHoveredElement(element);
      setHoveredRect(rect);
      if (element && rect) {
        const framework = detectFramework();
        const componentInfo = framework.getComponentInfo(element);
        const tagName = element.tagName.toLowerCase();
        const componentName = componentInfo?.name;
        const sourceFile = framework.getSourceLocation(element)?.file;
        const parts = [tagName];
        if (componentName) parts.push(componentName);
        if (sourceFile) parts.push(sourceFile);
        setSelectionLabelInfo({
          text: parts.join(" \xB7 "),
          rect
        });
      } else {
        setSelectionLabelInfo(null);
      }
    },
    onStableHover: (_element) => {
    },
    onSelect: (element) => {
      const framework = detectFramework();
      const frameworkInfo = (() => {
        const info = framework.getComponentInfo(element);
        const source = framework.getSourceLocation(element);
        if (!info && !source) return void 0;
        return {
          framework: framework.name,
          componentPath: info?.name ? `<${info.name}>` : "",
          sourceFile: source ? `${source.file}${source.line ? `:${source.line}` : ""}` : void 0,
          frameworkVersion: void 0
        };
      })();
      const context = buildElementContext(element, frameworkInfo);
      setSelectedElement(element);
      setSelectedContext(context);
      setShowPopup(true);
      picker.pause();
    }
  });
  const dragSelect = new DragSelect({
    ignoreSelector: "#pinpoint-root, [data-pinpoint-marker]",
    onDragStart: (rect) => setDragRect(rect),
    onDragMove: (rect) => setDragRect(rect),
    onDragEnd: (elements) => {
      setDragRect(null);
      for (const el of elements) {
        addPin(el, "Multi-selected element");
      }
    }
  });
  const textSelect = new TextSelect({
    onSelect: (_selection) => {
    }
  });
  const handleKeyDown = (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.shiftKey && e.key === ".") {
      e.preventDefault();
      toggleActive();
      return;
    }
    if (mod && e.shiftKey && (e.key === "D" || e.key === "d")) {
      e.preventDefault();
      if (active()) {
        if (mode() === "draw") {
          handleModeChange("select");
        } else {
          handleModeChange("draw");
        }
      }
      return;
    }
    if (!active()) return;
    if (mod && e.shiftKey && e.key === "C") {
      e.preventDefault();
      copyPins();
      return;
    }
    if (mod && e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      if (queue().length > 0) {
        sendQueue();
      } else if (selectedPinIds().size > 0) {
        sendSelected();
      } else {
        sendPins();
      }
      return;
    }
    if (mod && e.key === "z" && drawMode()) {
      e.preventDefault();
      undoDrawStroke();
      return;
    }
    if (e.key === "Escape") {
      if (showTextInput()) {
        setShowTextInput(false);
      } else if (showPopup()) {
        closePopup();
      } else if (showContextMenu()) {
        setShowContextMenu(false);
      } else if (showPrompt()) {
        setShowPrompt(false);
      } else if (drawMode()) {
        handleModeChange("select");
      } else if (expanded()) {
        setExpanded(false);
      } else {
        deactivateSelection();
      }
    }
  };
  const handleContextMenu = (e) => {
    if (!active() || drawMode()) return;
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element || element.closest("#pinpoint-root")) return;
    e.preventDefault();
    setSelectedElement(element);
    setContextMenuPos({
      x: e.clientX,
      y: e.clientY
    });
    setShowContextMenu(true);
  };
  createEffect(() => {
    picker.setBlockInteractions(blockInteractions());
  });
  createEffect(() => {
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      picker.dispose();
      dragSelect.dispose();
      textSelect.dispose();
      markerManager.dispose();
    });
  });
  const markerManager = new PinMarkerManager(props.config.markerColor);
  markerManager.setOnClick((pin) => openEditPopup(pin));
  markerManager.setOnToggleSelect((pin) => togglePinSelect(pin));
  createEffect(() => {
    const pageUrl = window.location.pathname;
    storage.load(pageUrl).then((loaded) => setPins(loaded));
  });
  createEffect(() => {
    const currentPins = pins();
    markerManager.update(currentPins);
  });
  createEffect(() => {
    markerManager.setSelectedPins(selectedPinIds());
  });
  function handleModeChange(newMode) {
    setMode(newMode);
    if (newMode === "draw") {
      setDrawMode(true);
      picker.pause();
      dragSelect.deactivate();
      textSelect.deactivate();
      markerManager.setShowCheckboxes(false);
    } else if (newMode === "select") {
      setDrawMode(false);
      picker.resume();
      if (active()) {
        dragSelect.activate();
        textSelect.activate();
      }
      markerManager.setShowCheckboxes(false);
    } else if (newMode === "queue") {
      setDrawMode(false);
      picker.pause();
      markerManager.setShowCheckboxes(true);
    }
  }
  function handleDrawStart(x, y) {
    isDrawing = true;
    const toolType = drawTool();
    if (toolType === "text") return;
    setCurrentStroke({
      points: [{
        x,
        y
      }],
      color: drawColor(),
      lineWidth: drawLineWidth(),
      type: toolType
    });
  }
  function handleDrawMove(x, y) {
    if (!isDrawing) return;
    const stroke = currentStroke();
    if (!stroke) return;
    if (stroke.type === "freehand") {
      setCurrentStroke({
        ...stroke,
        points: [...stroke.points, {
          x,
          y
        }]
      });
    } else {
      setCurrentStroke({
        ...stroke,
        points: [stroke.points[0], {
          x,
          y
        }]
      });
    }
  }
  function handleDrawEnd() {
    if (!isDrawing) return;
    isDrawing = false;
    const stroke = currentStroke();
    if (stroke && stroke.points.length > 1) {
      setDrawStrokes((prev) => [...prev, stroke]);
    }
    setCurrentStroke(null);
  }
  function handleTextPlace(x, y) {
    setTextInputPos({
      x,
      y
    });
    setShowTextInput(true);
  }
  function handleTextSubmit(text) {
    setTextNotes((prev) => [...prev, {
      x: textInputPos().x,
      y: textInputPos().y,
      text,
      color: drawColor()
    }]);
    setShowTextInput(false);
  }
  function undoDrawStroke() {
    if (textNotes().length > 0) {
      setTextNotes((prev) => prev.slice(0, -1));
    } else if (drawStrokes().length > 0) {
      setDrawStrokes((prev) => prev.slice(0, -1));
    }
  }
  function clearDrawing() {
    setDrawStrokes([]);
    setTextNotes([]);
    setCurrentStroke(null);
  }
  function addToQueue(pin) {
    const item = {
      id: crypto.randomUUID(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (pin) {
      item.pin = pin;
    }
    const strokes = drawStrokes();
    const notes = textNotes();
    if (strokes.length > 0 || notes.length > 0) {
      item.drawings = [...strokes];
      item.textNotes = [...notes];
      clearDrawing();
    }
    setQueue((prev) => [...prev, item]);
  }
  async function sendQueue() {
    const items = queue();
    if (items.length === 0) return;
    const {
      formatQueueForAgent
    } = await import("./agent-context-OICFLRJ7.js");
    const {
      message,
      context
    } = formatQueueForAgent(items, outputFormat());
    await deliverToAgent({
      message,
      context
    });
    setQueue([]);
    if (clearOnSend()) {
      const pageUrl = window.location.pathname;
      await storage.clear(pageUrl);
      setPins([]);
    }
  }
  function clearQueue() {
    setQueue([]);
  }
  function togglePinSelect(pin) {
    setSelectedPinIds((prev) => {
      const next = new Set(prev);
      if (next.has(pin.id)) {
        next.delete(pin.id);
      } else {
        next.add(pin.id);
      }
      return next;
    });
  }
  async function sendSelected() {
    const ids = selectedPinIds();
    if (ids.size === 0) return;
    const selected = pins().filter((p) => ids.has(p.id));
    const {
      formatPinsForAgent
    } = await import("./agent-context-OICFLRJ7.js");
    const {
      message,
      context
    } = formatPinsForAgent(selected, outputFormat());
    await deliverToAgent({
      message,
      context
    });
    setSelectedPinIds(/* @__PURE__ */ new Set());
  }
  function toggleActive() {
    if (active()) {
      deactivateSelection();
    } else {
      activateSelection();
    }
  }
  function activateSelection() {
    setActive(true);
    setExpanded(true);
    if (mode() !== "draw") {
      picker.activate();
      dragSelect.activate();
      textSelect.activate();
    }
  }
  function deactivateSelection() {
    setActive(false);
    setDrawMode(false);
    setMode("select");
    picker.deactivate();
    dragSelect.deactivate();
    textSelect.deactivate();
    setHoveredElement(null);
    setHoveredRect(null);
    setSelectionLabelInfo(null);
  }
  function closePopup() {
    setShowPopup(false);
    setEditingPin(null);
    if (mode() !== "draw") {
      picker.resume();
    }
  }
  function addPin(element, comment) {
    const framework = detectFramework();
    const frameworkInfo = (() => {
      const info = framework.getComponentInfo(element);
      const source = framework.getSourceLocation(element);
      if (!info && !source) return void 0;
      return {
        framework: framework.name,
        componentPath: info?.name ? `<${info.name}>` : "",
        sourceFile: source ? `${source.file}${source.line ? `:${source.line}` : ""}` : void 0,
        frameworkVersion: void 0
      };
    })();
    const elementInfo = extractElementInfo(element);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const pin = {
      id: crypto.randomUUID(),
      pageUrl: window.location.pathname,
      createdAt: now,
      updatedAt: now,
      author: props.config.author,
      comment,
      element: elementInfo,
      framework: frameworkInfo,
      status: {
        state: "open",
        changedAt: now,
        changedBy: "user"
      }
    };
    setPins((prev) => [...prev, pin]);
    storage.save(pin);
    closePopup();
    return pin;
  }
  function handleQueueFromPopup(comment) {
    const el = selectedElement();
    if (!el) return;
    const pin = addPin(el, comment);
    addToQueue(pin);
  }
  async function handleFixThis(comment) {
    const el = selectedElement();
    if (!el) return;
    const pin = addPin(el, comment);
    const {
      formatRichPinContext
    } = await import("./agent-context-OICFLRJ7.js");
    const richMessage = `Please fix: ${formatRichPinContext(pin)}`;
    await deliverToAgent({
      message: richMessage,
      context: ""
    });
  }
  function openEditPopup(pin) {
    setShowPopup(false);
    queueMicrotask(() => {
      const el = document.querySelector(pin.element.selector);
      setEditingPin(pin);
      setSelectedContext(buildElementContext(el || document.body, pin.framework));
      setShowPopup(true);
      picker.pause();
    });
  }
  function updatePin(comment) {
    const pin = editingPin();
    if (!pin) return;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updated = {
      ...pin,
      comment,
      updatedAt: now
    };
    setPins((prev) => prev.map((p) => p.id === pin.id ? updated : p));
    storage.update(pin.id, {
      comment,
      updatedAt: now
    });
    closePopup();
  }
  async function copyPins() {
    const {
      formatPins
    } = await import("./formatter-25JPHXYA.js");
    const text = formatPins(pins(), outputFormat());
    await navigator.clipboard.writeText(text);
  }
  async function sendPins() {
    const {
      formatPinsForAgent
    } = await import("./agent-context-OICFLRJ7.js");
    const {
      message,
      context
    } = formatPinsForAgent(pins(), outputFormat());
    await deliverToAgent({
      message,
      context
    });
    if (clearOnSend()) {
      const pageUrl = window.location.pathname;
      await storage.clear(pageUrl);
      setPins([]);
    }
  }
  function removePin(id) {
    setPins((prev) => prev.filter((p) => p.id !== id));
    storage.delete(id);
    setSelectedPinIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }
  function clearPins() {
    const pageUrl = window.location.pathname;
    storage.clear(pageUrl);
    setPins([]);
    setSelectedPinIds(/* @__PURE__ */ new Set());
  }
  return [createComponent(OverlayCanvas, {
    get hoveredRect() {
      return hoveredRect();
    },
    get dragRect() {
      return dragRect();
    },
    get pins() {
      return pins();
    },
    get active() {
      return active();
    },
    get drawMode() {
      return drawMode();
    },
    get drawStrokes() {
      return drawStrokes();
    },
    get currentStroke() {
      return currentStroke();
    },
    get drawColor() {
      return drawColor();
    },
    get drawLineWidth() {
      return drawLineWidth();
    },
    get drawTool() {
      return drawTool();
    },
    get textNotes() {
      return textNotes();
    },
    onDrawStart: handleDrawStart,
    onDrawMove: handleDrawMove,
    onDrawEnd: handleDrawEnd,
    onTextPlace: handleTextPlace
  }), createComponent(SelectionLabel, {
    get info() {
      return selectionLabelInfo();
    }
  }), createComponent(Toolbar, {
    get expanded() {
      return expanded();
    },
    get active() {
      return active();
    },
    get pins() {
      return pins();
    },
    get position() {
      return props.config.position;
    },
    get author() {
      return props.config.author;
    },
    get showSettings() {
      return showSettings();
    },
    get outputFormat() {
      return outputFormat();
    },
    get clearOnSend() {
      return clearOnSend();
    },
    get blockInteractions() {
      return blockInteractions();
    },
    get autoSubmit() {
      return autoSubmit();
    },
    get webhookUrl() {
      return props.config.webhookUrl;
    },
    get compactPopup() {
      return compactPopup();
    },
    get mode() {
      return mode();
    },
    get drawTool() {
      return drawTool();
    },
    get drawColor() {
      return drawColor();
    },
    get drawLineWidth() {
      return drawLineWidth();
    },
    get drawStrokeCount() {
      return drawStrokes().length + textNotes().length;
    },
    get queue() {
      return queue();
    },
    get selectedPinIds() {
      return selectedPinIds();
    },
    onToggleExpand: () => {
      const willExpand = !expanded();
      setExpanded(willExpand);
      if (willExpand) {
        activateSelection();
      } else {
        deactivateSelection();
        setShowSettings(false);
        if (showPopup()) {
          closePopup();
        }
      }
    },
    onModeChange: handleModeChange,
    onSend: sendPins,
    onCopy: copyPins,
    onClear: clearPins,
    onRemovePin: removePin,
    onEditPin: openEditPopup,
    onToggleSettings: () => setShowSettings(!showSettings()),
    onOutputFormatChange: setOutputFormat,
    onClearOnSendChange: setClearOnSend,
    onBlockInteractionsChange: setBlockInteractions,
    onAutoSubmitChange: setAutoSubmit,
    onCompactPopupChange: setCompactPopup,
    onDrawToolChange: setDrawTool,
    onDrawColorChange: setDrawColor,
    onDrawLineWidthChange: setDrawLineWidth,
    onDrawUndo: undoDrawStroke,
    onDrawClear: clearDrawing,
    onQueueAdd: () => addToQueue(),
    onQueueSend: sendQueue,
    onQueueClear: clearQueue,
    onSendSelected: sendSelected,
    onTogglePinSelect: togglePinSelect
  }), memo(() => memo(() => !!(showPopup() && selectedContext()))() && createComponent(PinPopup, {
    get context() {
      return selectedContext();
    },
    get initialComment() {
      return editingPin()?.comment;
    },
    get isEditing() {
      return !!editingPin();
    },
    get compactPopup() {
      return compactPopup();
    },
    get queueMode() {
      return mode() === "queue";
    },
    onAdd: (comment) => {
      if (editingPin()) {
        updatePin(comment);
      } else {
        addPin(selectedElement(), comment);
      }
    },
    onQueue: handleQueueFromPopup,
    onFixThis: handleFixThis,
    onCancel: () => closePopup()
  })), memo(() => memo(() => !!showTextInput())() && createComponent(TextInputPopup, {
    get x() {
      return textInputPos().x;
    },
    get y() {
      return textInputPos().y;
    },
    get color() {
      return drawColor();
    },
    onSubmit: handleTextSubmit,
    onCancel: () => setShowTextInput(false)
  })), memo(() => memo(() => !!(showContextMenu() && selectedElement()))() && createComponent(ContextMenu, {
    get position() {
      return contextMenuPos();
    },
    get element() {
      return selectedElement();
    },
    onClose: () => setShowContextMenu(false),
    onAnnotate: () => {
      setShowContextMenu(false);
      const el = selectedElement();
      const framework = detectFramework();
      const frameworkInfo = (() => {
        const info = framework.getComponentInfo(el);
        const source = framework.getSourceLocation(el);
        if (!info && !source) return void 0;
        return {
          framework: framework.name,
          componentPath: info?.name ? `<${info.name}>` : "",
          sourceFile: source?.file,
          frameworkVersion: void 0
        };
      })();
      setSelectedContext(buildElementContext(el, frameworkInfo));
      setShowPopup(true);
      picker.pause();
    },
    onCopyContext: async () => {
      const el = selectedElement();
      const context = buildElementContext(el);
      await navigator.clipboard.writeText(JSON.stringify(context, null, 2));
      setShowContextMenu(false);
    },
    onPrompt: () => {
      setShowContextMenu(false);
      setShowPrompt(true);
    }
  })), memo(() => memo(() => !!(showPrompt() && selectedElement()))() && createComponent(PromptMode, {
    get element() {
      return selectedElement();
    },
    onSend: async (instruction) => {
      const context = buildElementContext(selectedElement());
      await deliverToAgent({
        message: instruction,
        context: JSON.stringify(context, null, 2)
      });
      setShowPrompt(false);
    },
    onCancel: () => setShowPrompt(false)
  }))];
};

// src/ui/mount.ts
var CONTAINER_ID = "pinpoint-root";
function mountPinpoint(config = {}, target = document.body) {
  const w = window;
  w.__pinpoint_instances = (w.__pinpoint_instances || 0) + 1;
  if (w.__pinpoint_instances > 1) {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) {
      existing.remove();
    }
    w.__pinpoint_instances = 1;
  }
  const container = document.createElement("div");
  container.id = CONTAINER_ID;
  container.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;";
  target.appendChild(container);
  const shadowRoot = container.attachShadow({ mode: "open" });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(overlayStyles);
  shadowRoot.adoptedStyleSheets = [sheet];
  const theme = resolveColorScheme(config.colorScheme || "auto");
  if (theme === "light") {
    container.setAttribute("data-theme", "light");
  }
  const solidDispose = render(() => PinpointApp({ config }), shadowRoot);
  const dispose2 = () => {
    solidDispose();
    container.remove();
    w.__pinpoint_instances = Math.max(0, (w.__pinpoint_instances || 1) - 1);
  };
  if (import.meta.hot) {
    import.meta.hot.dispose(dispose2);
  }
  return { dispose: dispose2, shadowRoot, container };
}
function unmountPinpoint() {
  const container = document.getElementById(CONTAINER_ID);
  if (container) {
    container.remove();
    window.__pinpoint_instances = 0;
  }
}
function resolveColorScheme(scheme) {
  if (scheme === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return scheme;
}

export {
  MemoryStore,
  ElementInfoSchema,
  FrameworkInfoSchema,
  PinSchema,
  RestClient,
  ElementPicker,
  buildSelector,
  extractElementInfo,
  buildElementContext,
  DragSelect,
  TextSelect,
  registerAdapter,
  detectFramework,
  getComponentInfo,
  getSourceLocation,
  PinMarkerManager,
  mountPinpoint,
  unmountPinpoint
};
//# sourceMappingURL=chunk-SI7E6GTM.js.map