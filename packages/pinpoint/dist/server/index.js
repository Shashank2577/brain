import {
  PinSchema
} from "../chunk-JCYY4S7A.js";
import {
  __require
} from "../chunk-DGUM43GV.js";

// src/server/middleware.ts
import { Router } from "express";

// src/storage/file-store.ts
import {
  readdir,
  readFile,
  writeFile,
  unlink,
  rename,
  mkdir
} from "fs/promises";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
var VALID_ID = /^[a-zA-Z0-9_-]+$/;
var FileStore = class {
  dir;
  constructor(dataDir = "data/pins") {
    this.dir = resolve(dataDir);
  }
  validateId(id) {
    if (!VALID_ID.test(id)) {
      throw new Error(`Invalid pin ID: ${id}`);
    }
  }
  pinPath(id) {
    this.validateId(id);
    const resolved = join(this.dir, `${id}.json`);
    if (!resolved.startsWith(this.dir)) {
      throw new Error("Path traversal detected");
    }
    return resolved;
  }
  async ensureDir() {
    await mkdir(this.dir, { recursive: true });
  }
  async readPin(filePath) {
    try {
      const content = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);
      const result = PinSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }
  async atomicWrite(filePath, data) {
    await this.ensureDir();
    const tempPath = join(tmpdir(), `pinpoint-${randomUUID()}.tmp`);
    await writeFile(tempPath, data, "utf-8");
    await rename(tempPath, filePath);
  }
  async load(pageUrl) {
    return this.list({ pageUrl });
  }
  async save(pin) {
    const filePath = this.pinPath(pin.id);
    await this.atomicWrite(filePath, JSON.stringify(pin, null, 2));
  }
  async update(id, patch) {
    const filePath = this.pinPath(id);
    const existing = await this.readPin(filePath);
    if (!existing) return;
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.atomicWrite(filePath, JSON.stringify(updated, null, 2));
  }
  async delete(id) {
    try {
      await unlink(this.pinPath(id));
    } catch {
    }
  }
  async list(filter) {
    await this.ensureDir();
    let files;
    try {
      files = await readdir(this.dir);
    } catch {
      return [];
    }
    const pins = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const pin = await this.readPin(join(this.dir, file));
      if (!pin) continue;
      if (filter?.pageUrl && pin.pageUrl !== filter.pageUrl) continue;
      if (filter?.status && pin.status.state !== filter.status) continue;
      pins.push(pin);
    }
    return pins.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  async clear(pageUrl) {
    await this.ensureDir();
    let files;
    try {
      files = await readdir(this.dir);
    } catch {
      return;
    }
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = join(this.dir, file);
      if (pageUrl) {
        const pin = await this.readPin(filePath);
        if (pin && pin.pageUrl === pageUrl) {
          await unlink(filePath).catch(() => {
          });
        }
      } else {
        await unlink(filePath).catch(() => {
        });
      }
    }
  }
};

// src/server/middleware.ts
var VALID_ID2 = /^[a-zA-Z0-9_-]+$/;
function validateId(id) {
  return VALID_ID2.test(id) && id.length > 0 && id.length <= 128;
}
function pagePinRoutes(options = {}) {
  const router = Router();
  const store = new FileStore(options.dataDir || "data/pins");
  router.get("/", async (req, res) => {
    try {
      const pageUrl = String(req.query.pageUrl || "") || void 0;
      const status = req.query.status ? String(req.query.status) : void 0;
      const pins = await store.list({ pageUrl, status });
      res.json(pins);
    } catch (err) {
      res.status(500).json({ error: "Failed to list pins" });
    }
  });
  router.get("/:id", async (req, res) => {
    try {
      const id = String(req.params.id);
      if (!validateId(id)) {
        res.status(400).json({ error: "Invalid pin ID" });
        return;
      }
      const pins = await store.list();
      const pin = pins.find((p) => p.id === id);
      if (!pin) {
        res.status(404).json({ error: "Pin not found" });
        return;
      }
      res.json(pin);
    } catch (err) {
      res.status(500).json({ error: "Failed to get pin" });
    }
  });
  router.post("/", async (req, res) => {
    try {
      const result = PinSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Invalid pin data", details: result.error.issues });
        return;
      }
      await store.save(result.data);
      res.status(201).json(result.data);
    } catch (err) {
      res.status(500).json({ error: "Failed to create pin" });
    }
  });
  router.patch("/:id", async (req, res) => {
    try {
      const id = String(req.params.id);
      if (!validateId(id)) {
        res.status(400).json({ error: "Invalid pin ID" });
        return;
      }
      const result = PinSchema.partial().safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Invalid pin data", details: result.error.issues });
        return;
      }
      await store.update(id, result.data);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update pin" });
    }
  });
  router.delete("/:id", async (req, res) => {
    try {
      const id = String(req.params.id);
      if (!validateId(id)) {
        res.status(400).json({ error: "Invalid pin ID" });
        return;
      }
      await store.delete(id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete pin" });
    }
  });
  router.delete("/", async (req, res) => {
    try {
      const pageUrl = String(req.query.pageUrl || "") || void 0;
      await store.clear(pageUrl);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to clear pins" });
    }
  });
  return router;
}

// src/server/a2a.ts
function registerPinpointA2A(app, options = {}) {
  const store = new FileStore(options.dataDir || "data/pins");
  const config = {
    name: "pinpoint",
    description: "Visual feedback and annotation tool for web applications",
    skills: [
      {
        id: "get-annotations",
        name: "Get Pins",
        description: "Retrieve visual feedback annotations"
      },
      {
        id: "resolve-annotation",
        name: "Resolve Pin",
        description: "Mark an annotation as resolved"
      },
      {
        id: "create-annotation",
        name: "Create Pin",
        description: "Create a new annotation programmatically"
      }
    ],
    handler: async (message, _context) => {
      const { method, params } = message;
      switch (method) {
        case "get-annotations": {
          const pins = await store.list(params);
          return { result: pins };
        }
        case "resolve-annotation": {
          await store.update(params.id, {
            status: {
              state: "resolved",
              changedAt: (/* @__PURE__ */ new Date()).toISOString(),
              changedBy: "agent"
            }
          });
          return { result: { ok: true } };
        }
        case "create-annotation": {
          const validated = PinSchema.safeParse(params?.pin);
          if (!validated.success) {
            return { error: { code: -32602, message: "Invalid pin data" } };
          }
          await store.save(validated.data);
          return { result: { ok: true } };
        }
        default:
          return { error: { code: -32601, message: "Method not found" } };
      }
    }
  };
  try {
    const { enableA2A } = __require("@agent-native/core/a2a");
    enableA2A(app, config);
  } catch {
    app.get("/.well-known/agent-card.json", (_req, res) => {
      res.json({
        name: config.name,
        description: config.description,
        skills: config.skills,
        url: "/a2a/pinpoint"
      });
    });
    app.post("/a2a/pinpoint", async (req, res) => {
      try {
        const result = await config.handler(req.body, {});
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: "A2A handler error" });
      }
    });
  }
}

// src/server/mcp.ts
function createPinpointMCPTools(options = {}) {
  const store = new FileStore(options.dataDir || "data/pins");
  return {
    tools: [
      {
        name: "get_annotations",
        description: "Get visual feedback annotations from the page",
        inputSchema: {
          type: "object",
          properties: {
            pageUrl: {
              type: "string",
              description: "Filter by page URL"
            },
            status: {
              type: "string",
              enum: ["open", "acknowledged", "resolved", "dismissed"],
              description: "Filter by status"
            }
          }
        }
      },
      {
        name: "resolve_annotation",
        description: "Mark an annotation as resolved",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The annotation ID to resolve"
            },
            message: {
              type: "string",
              description: "Optional resolution message"
            }
          },
          required: ["id"]
        }
      },
      {
        name: "create_annotation",
        description: "Create a new annotation on a page element",
        inputSchema: {
          type: "object",
          properties: {
            pageUrl: {
              type: "string",
              description: "The page URL"
            },
            selector: {
              type: "string",
              description: "CSS selector of the element"
            },
            comment: {
              type: "string",
              description: "The annotation comment"
            }
          },
          required: ["pageUrl", "selector", "comment"]
        }
      },
      {
        name: "delete_annotation",
        description: "Delete an annotation",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The annotation ID to delete"
            }
          },
          required: ["id"]
        }
      }
    ],
    async handleTool(name, args) {
      switch (name) {
        case "get_annotations": {
          const pins = await store.list({
            pageUrl: args.pageUrl,
            status: args.status
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(pins, null, 2)
              }
            ]
          };
        }
        case "resolve_annotation": {
          await store.update(args.id, {
            status: {
              state: "resolved",
              changedAt: (/* @__PURE__ */ new Date()).toISOString(),
              changedBy: "agent"
            }
          });
          return {
            content: [{ type: "text", text: `Resolved annotation ${args.id}` }]
          };
        }
        case "create_annotation": {
          const { randomUUID: randomUUID2 } = await import("crypto");
          const now = (/* @__PURE__ */ new Date()).toISOString();
          const pin = {
            id: randomUUID2(),
            pageUrl: args.pageUrl,
            createdAt: now,
            updatedAt: now,
            comment: args.comment,
            element: {
              tagName: "unknown",
              classNames: [],
              selector: args.selector,
              boundingRect: { x: 0, y: 0, width: 0, height: 0 }
            },
            status: {
              state: "open",
              changedAt: now,
              changedBy: "agent"
            }
          };
          await store.save(pin);
          return {
            content: [
              {
                type: "text",
                text: `Created annotation ${pin.id} on ${args.selector}`
              }
            ]
          };
        }
        case "delete_annotation": {
          await store.delete(args.id);
          return {
            content: [{ type: "text", text: `Deleted annotation ${args.id}` }]
          };
        }
        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }]
          };
      }
    }
  };
}
export {
  FileStore,
  createPinpointMCPTools,
  pagePinRoutes,
  registerPinpointA2A
};
//# sourceMappingURL=index.js.map