/**
 * Phase 6 — Starter template scaffolder.
 *
 * Copies a starter template directory from `packages/core/src/cli/starter-templates/<id>/`
 * into the target app directory, substituting `<NAME>`, `<name>`, and
 * `<Name>` placeholders with the user-supplied app slug, kebab name, and
 * title-cased name respectively.
 *
 * Unlike `create.ts`'s template flow (which clones a full first-party
 * template like `templates/notes`), the starter templates produce a
 * minimal but complete file tree the agent can extend. They never carry
 * domain-specific UI / actions / tables — those are the starter user's
 * job.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface StarterTemplate {
  /** Stable id used by --template */
  id: "blank" | "crud-list" | "dashboard" | "agent-tool";
  /** Display name in the picker UI */
  label: string;
  /** One-line description */
  hint: string;
  /** Tabler icon hint for the picker UI */
  icon: string;
  /** Long description shown beneath the card */
  description: string;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "blank",
    label: "Blank",
    hint: "Minimal scaffold — one route, one table, one action.",
    icon: "Sparkles",
    description:
      "Start from a clean slate. One generic <name>_items table and a single list capability. Add the rest as you go.",
  },
  {
    id: "crud-list",
    label: "CRUD list",
    hint: "List view + detail page, 5 baseline CRUD actions.",
    icon: "ListDetails",
    description:
      "The most common pattern: a list of things the user creates, opens, edits, and deletes. Ships list/get/create/update/delete actions and the matching UI.",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    hint: "Grid of metric cards backed by a read-only query.",
    icon: "ChartBar",
    description:
      "Read-only metric grid. One list-metrics action surfaces per-card data. Add new actions to wire real data sources via A2A.",
  },
  {
    id: "agent-tool",
    label: "Agent tool",
    hint: "Backend-heavy agentic service with 2 capabilities.",
    icon: "Robot",
    description:
      "ADR-001 'agentic service' exception. Two capabilities (run-task, list-tasks), minimal UI. Use when other apps will call yours via ctx.call(...).",
  },
];

const STARTER_IDS = STARTER_TEMPLATES.map((t) => t.id);

export function isStarterTemplateId(value: string): value is StarterTemplate["id"] {
  return (STARTER_IDS as string[]).includes(value);
}

/**
 * Convert a kebab slug into a CamelCase identifier for placeholder
 * substitution (`<Name>`). `widget-shop` becomes `WidgetShop`.
 */
export function camelizeName(name: string): string {
  return name
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

/**
 * Convert a kebab slug into a SCREAMING_SNAKE form for `<NAME>`.
 * `widget-shop` becomes `WIDGET_SHOP`.
 */
export function screamSnakeName(name: string): string {
  return name.toUpperCase().replace(/-/g, "_");
}

/**
 * Apply all placeholder substitutions to a single string. Pure function
 * — no I/O — so it's trivially unit-testable.
 */
export function applyStarterPlaceholders(
  source: string,
  name: string,
): string {
  const camel = camelizeName(name);
  const scream = screamSnakeName(name);
  return source
    .replace(/<NAME>/g, scream)
    .replace(/<Name>/g, camel)
    .replace(/<name>/g, name);
}

/**
 * Walk up from this CLI file looking for the starter-templates directory.
 * Works both in src (during framework dev) and dist (when shipped as a
 * published package).
 */
function findStarterTemplatesRoot(): string {
  const candidates = [
    path.resolve(__dirname, "starter-templates"),
    path.resolve(__dirname, "../cli/starter-templates"),
    path.resolve(__dirname, "../src/cli/starter-templates"),
    path.resolve(__dirname, "../../src/cli/starter-templates"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    `Could not find starter-templates directory. Tried: ${candidates.join(", ")}`,
  );
}

export function getStarterTemplateSourceDir(id: string): string {
  if (!isStarterTemplateId(id)) {
    throw new Error(
      `Unknown starter template "${id}". Known: ${STARTER_IDS.join(", ")}`,
    );
  }
  const root = findStarterTemplatesRoot();
  const dir = path.join(root, id);
  if (!fs.existsSync(dir)) {
    throw new Error(`Starter template "${id}" not found at ${dir}`);
  }
  return dir;
}

/**
 * Skip files we never want to copy during scaffold (node_modules,
 * build outputs, etc.).
 */
function shouldSkipStarterEntry(name: string): boolean {
  return (
    name === "node_modules" ||
    name === ".agent-native" ||
    name === ".env" ||
    name === ".env.local" ||
    name === ".react-router" ||
    name === ".output" ||
    name === "build" ||
    name === "dist" ||
    name === ".DS_Store"
  );
}

/**
 * Recursive copy with placeholder substitution. Pure file-tree
 * transform — no network, no migrations, no git.
 */
export function copyStarterTree(
  srcDir: string,
  destDir: string,
  name: string,
): void {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (shouldSkipStarterEntry(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyStarterTree(srcPath, destPath, name);
      continue;
    }
    if (entry.isSymbolicLink()) {
      const target = fs.readlinkSync(srcPath);
      fs.symlinkSync(target, destPath);
      continue;
    }
    // Substitute placeholders in text content. Binary files are rare in
    // starter trees — JSON, TS, TSX, MD — but guard against decode errors
    // by falling back to a binary copy when reading as UTF-8 throws.
    let content: string;
    try {
      content = fs.readFileSync(srcPath, "utf-8");
    } catch {
      fs.copyFileSync(srcPath, destPath);
      continue;
    }
    fs.writeFileSync(destPath, applyStarterPlaceholders(content, name));
  }
}

export interface ScaffoldFromStarterOptions {
  /** Slug for the new mini-app (must be lower-kebab) */
  name: string;
  /** Which starter to copy */
  template: string;
  /** Destination directory (e.g. <workspaceRoot>/templates/<name>) */
  targetDir: string;
}

export function scaffoldFromStarterTemplate(
  opts: ScaffoldFromStarterOptions,
): { copiedFrom: string } {
  if (!/^[a-z][a-z0-9-]*$/.test(opts.name)) {
    throw new Error(
      `Invalid app name "${opts.name}". Use lowercase letters, numbers, and hyphens (must start with a letter).`,
    );
  }
  if (fs.existsSync(opts.targetDir)) {
    throw new Error(
      `Target directory already exists: ${opts.targetDir}. Choose a different name or remove the existing directory.`,
    );
  }
  const srcDir = getStarterTemplateSourceDir(opts.template);
  copyStarterTree(srcDir, opts.targetDir, opts.name);
  return { copiedFrom: srcDir };
}
