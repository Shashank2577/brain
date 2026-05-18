"use client";
import {
  DragSelect,
  ElementInfoSchema,
  ElementPicker,
  FrameworkInfoSchema,
  MemoryStore,
  PinMarkerManager,
  PinSchema,
  RestClient,
  TextSelect,
  buildElementContext,
  buildSelector,
  detectFramework,
  extractElementInfo,
  getComponentInfo,
  getSourceLocation,
  mountPinpoint,
  registerAdapter,
  unmountPinpoint
} from "./chunk-SI7E6GTM.js";
import {
  formatPinsForAgent,
  formatQueueForAgent,
  formatRichPinContext
} from "./chunk-C5OZ7ZT5.js";
import {
  formatPins
} from "./chunk-BB7X7W3H.js";
import {
  openFile
} from "./chunk-Y7IWDHIU.js";

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

// src/index.browser.ts
registerAdapter(reactAdapter);
registerAdapter(vueAdapter);
export {
  DragSelect,
  ElementInfoSchema,
  ElementPicker,
  FrameworkInfoSchema,
  MemoryStore,
  PinMarkerManager,
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
  mountPinpoint,
  openFile,
  reactAdapter,
  registerAdapter,
  registerPlugin,
  sanitizeString,
  unfreeze,
  unmountPinpoint,
  unregisterPlugin,
  vueAdapter
};
//# sourceMappingURL=index.browser.js.map