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

// src/freeze/css-freeze.ts
var FREEZE_STYLE_ID = "__pinpoint-css-freeze";
function freezeCSS() {
  if (document.getElementById(FREEZE_STYLE_ID)) {
    return () => {
    };
  }
  const style = document.createElement("style");
  style.id = FREEZE_STYLE_ID;
  style.textContent = `*, *::before, *::after {
    animation-play-state: paused !important;
    transition-property: none !important;
  }`;
  document.head.appendChild(style);
  return () => {
    style.remove();
  };
}

// src/freeze/waapi-freeze.ts
function freezeWAAPI() {
  const animations = document.getAnimations();
  const playing = animations.filter((a) => a.playState === "running");
  playing.forEach((a) => a.pause());
  return () => {
    playing.forEach((a) => {
      try {
        a.play();
      } catch {
      }
    });
  };
}

// src/freeze/react-freeze.ts
var frozen = false;
var originalDispatcher = null;
var queuedUpdates = [];
function getInternals() {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return null;
  const renderers = hook.renderers;
  if (!renderers || renderers.size === 0) return null;
  const renderer = renderers.values().next().value;
  return renderer?.currentDispatcherRef || null;
}
function freezeReact() {
  if (frozen) return () => {
  };
  const internals = getInternals();
  if (!internals) return () => {
  };
  frozen = true;
  originalDispatcher = internals.current;
  queuedUpdates = [];
  const proxyDispatcher = new Proxy(originalDispatcher, {
    get(target, prop) {
      if (prop === "useState" || prop === "useReducer") {
        return (...args) => {
          const result = target[prop](...args);
          if (Array.isArray(result) && typeof result[1] === "function") {
            const originalSetter = result[1];
            result[1] = (action) => {
              queuedUpdates.push({
                fiber: null,
                queue: null,
                update: { setter: originalSetter, action }
              });
            };
          }
          return result;
        };
      }
      return target[prop];
    }
  });
  internals.current = proxyDispatcher;
  return () => {
    if (!frozen) return;
    frozen = false;
    if (internals && originalDispatcher) {
      internals.current = originalDispatcher;
    }
    for (const { update } of queuedUpdates) {
      try {
        update.setter(update.action);
      } catch {
      }
    }
    queuedUpdates = [];
    originalDispatcher = null;
  };
}

// src/freeze/media-freeze.ts
function freezeMedia() {
  const mediaElements = document.querySelectorAll("video, audio");
  const playing = [];
  mediaElements.forEach((el) => {
    const media = el;
    if (!media.paused) {
      media.pause();
      playing.push(media);
    }
  });
  const svgElements = document.querySelectorAll("svg");
  const pausedSVGs = [];
  svgElements.forEach((svg) => {
    if (typeof svg.pauseAnimations === "function") {
      try {
        svg.pauseAnimations();
        pausedSVGs.push(svg);
      } catch {
      }
    }
  });
  return () => {
    playing.forEach((media) => {
      try {
        media.play();
      } catch {
      }
    });
    pausedSVGs.forEach((svg) => {
      try {
        svg.unpauseAnimations();
      } catch {
      }
    });
  };
}

// src/freeze/js-freeze.ts
var PINPOINT_SYMBOL = /* @__PURE__ */ Symbol.for("pinpoint-internal");
var MAX_QUEUE = 1e3;
var frozen2 = false;
var queue = [];
var originals = null;
function freezeJSTimers() {
  if (frozen2) return () => {
  };
  frozen2 = true;
  queue = [];
  originals = {
    setTimeout: window.setTimeout.bind(window),
    setInterval: window.setInterval.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    clearInterval: window.clearInterval.bind(window),
    requestAnimationFrame: window.requestAnimationFrame.bind(window)
  };
  window.setTimeout = (callback, delay, ...args) => {
    if (typeof callback !== "function") return 0;
    if (callback[PINPOINT_SYMBOL]) {
      return originals.setTimeout(callback, delay, ...args);
    }
    if (queue.length < MAX_QUEUE) {
      queue.push({ type: "timeout", callback, delay, args });
    }
    return 0;
  };
  window.setInterval = (callback, delay, ...args) => {
    if (typeof callback !== "function") return 0;
    if (callback[PINPOINT_SYMBOL]) {
      return originals.setInterval(callback, delay, ...args);
    }
    if (queue.length < MAX_QUEUE) {
      queue.push({ type: "interval", callback, delay, args });
    }
    return 0;
  };
  window.requestAnimationFrame = (callback) => {
    if (callback[PINPOINT_SYMBOL]) {
      return originals.requestAnimationFrame(callback);
    }
    if (queue.length < MAX_QUEUE) {
      queue.push({ type: "raf", callback });
    }
    return 0;
  };
  return () => {
    if (!frozen2 || !originals) return;
    frozen2 = false;
    window.setTimeout = originals.setTimeout;
    window.setInterval = originals.setInterval;
    window.clearTimeout = originals.clearTimeout;
    window.clearInterval = originals.clearInterval;
    window.requestAnimationFrame = originals.requestAnimationFrame;
    const replayBatch = () => {
      const batch = queue.splice(0, 50);
      for (const item of batch) {
        try {
          if (item.type === "raf") {
            originals.requestAnimationFrame(
              item.callback
            );
          } else {
            originals.setTimeout(
              item.callback,
              0,
              ...item.args || []
            );
          }
        } catch {
        }
      }
      if (queue.length > 0) {
        (window.requestIdleCallback || originals.setTimeout)(replayBatch);
      }
    };
    if (queue.length > 0) {
      (window.requestIdleCallback || originals.setTimeout)(replayBatch);
    }
    originals = null;
  };
}

// src/freeze/controller.ts
var cleanups = [];
var active = false;
function freeze(_elements, options = {}) {
  if (active) return;
  active = true;
  cleanups = [freezeCSS(), freezeWAAPI(), freezeReact(), freezeMedia()];
  if (options.jsTimers) {
    cleanups.push(freezeJSTimers());
  }
}
function unfreeze() {
  if (!active) return;
  active = false;
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch {
    }
  }
  cleanups = [];
}
function isFreezeActive() {
  return active;
}

// src/utils/open-file.ts
async function openFile(filePath, lineNumber) {
  const vsCodeUrl = lineNumber ? `vscode://file/${filePath}:${lineNumber}` : `vscode://file/${filePath}`;
  try {
    window.open(vsCodeUrl, "_blank");
    return;
  } catch {
  }
  try {
    await fetch("/api/open-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, lineNumber })
    });
  } catch {
    console.warn("[pinpoint] Could not open file:", filePath);
  }
}

export {
  MemoryStore,
  buildSelector,
  extractElementInfo,
  buildElementContext,
  registerAdapter,
  detectFramework,
  getComponentInfo,
  getSourceLocation,
  freeze,
  unfreeze,
  isFreezeActive,
  openFile
};
//# sourceMappingURL=chunk-W7IKAJ3P.js.map