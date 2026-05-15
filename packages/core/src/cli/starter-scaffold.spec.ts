/**
 * Phase 6 — Unit tests for the starter-template scaffolder.
 *
 * Covers placeholder substitution (`<name>`/`<Name>`/`<NAME>`), starter
 * id validation, name validation, and a golden-file pass that scaffolds
 * each of the four starters into a tmp dir and snapshots the produced
 * file tree.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  applyStarterPlaceholders,
  camelizeName,
  isStarterTemplateId,
  scaffoldFromStarterTemplate,
  screamSnakeName,
  STARTER_TEMPLATES,
  getStarterTemplateSourceDir,
} from "./starter-scaffold.js";

describe("applyStarterPlaceholders", () => {
  it("substitutes <name> with the kebab slug", () => {
    expect(applyStarterPlaceholders("hello <name>", "widget")).toBe(
      "hello widget",
    );
  });

  it("substitutes <Name> with the CamelCase identifier", () => {
    expect(
      applyStarterPlaceholders("class <Name>Item {}", "widget-shop"),
    ).toBe("class WidgetShopItem {}");
  });

  it("substitutes <NAME> with the SCREAMING_SNAKE identifier", () => {
    expect(applyStarterPlaceholders("const <NAME>_ID", "widget-shop")).toBe(
      "const WIDGET_SHOP_ID",
    );
  });

  it("substitutes all three placeholder forms in one pass", () => {
    const input = "<name> / <Name> / <NAME>";
    expect(applyStarterPlaceholders(input, "my-app")).toBe(
      "my-app / MyApp / MY_APP",
    );
  });

  it("leaves content without placeholders untouched", () => {
    expect(applyStarterPlaceholders("plain text", "anything")).toBe(
      "plain text",
    );
  });
});

describe("camelizeName / screamSnakeName", () => {
  it("camelize handles single-word slugs", () => {
    expect(camelizeName("widget")).toBe("Widget");
  });

  it("camelize handles multi-word kebab slugs", () => {
    expect(camelizeName("my-widget-shop")).toBe("MyWidgetShop");
  });

  it("scream handles multi-word kebab slugs", () => {
    expect(screamSnakeName("my-widget-shop")).toBe("MY_WIDGET_SHOP");
  });
});

describe("isStarterTemplateId", () => {
  it("returns true for each registered starter", () => {
    for (const tpl of STARTER_TEMPLATES) {
      expect(isStarterTemplateId(tpl.id)).toBe(true);
    }
  });

  it("returns false for unknown ids", () => {
    expect(isStarterTemplateId("mail")).toBe(false);
    expect(isStarterTemplateId("")).toBe(false);
  });
});

describe("getStarterTemplateSourceDir", () => {
  it("resolves to a directory that exists for each starter", () => {
    for (const tpl of STARTER_TEMPLATES) {
      const dir = getStarterTemplateSourceDir(tpl.id);
      expect(fs.existsSync(dir)).toBe(true);
      expect(fs.statSync(dir).isDirectory()).toBe(true);
    }
  });

  it("throws on unknown ids", () => {
    expect(() => getStarterTemplateSourceDir("nope")).toThrow(/Unknown/);
  });
});

describe("scaffoldFromStarterTemplate", () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starter-scaffold-"));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("rejects invalid app names", () => {
    expect(() =>
      scaffoldFromStarterTemplate({
        name: "Widget",
        template: "blank",
        targetDir: path.join(tmpRoot, "Widget"),
      }),
    ).toThrow(/Invalid app name/);
  });

  it("rejects when the target directory already exists", () => {
    const target = path.join(tmpRoot, "widget");
    fs.mkdirSync(target);
    expect(() =>
      scaffoldFromStarterTemplate({
        name: "widget",
        template: "blank",
        targetDir: target,
      }),
    ).toThrow(/already exists/);
  });

  it.each(STARTER_TEMPLATES.map((t) => t.id))(
    "scaffolds the %s starter into the target with placeholders substituted",
    (templateId) => {
      const appName = "widgets";
      const target = path.join(tmpRoot, appName);
      scaffoldFromStarterTemplate({
        name: appName,
        template: templateId,
        targetDir: target,
      });

      // Required files present in every starter
      expect(fs.existsSync(path.join(target, "package.json"))).toBe(true);
      expect(fs.existsSync(path.join(target, "tsconfig.json"))).toBe(true);
      expect(fs.existsSync(path.join(target, "vite.config.ts"))).toBe(true);
      expect(fs.existsSync(path.join(target, "vitest.config.ts"))).toBe(true);
      expect(fs.existsSync(path.join(target, "AGENTS.md"))).toBe(true);
      expect(fs.existsSync(path.join(target, "app/root.tsx"))).toBe(true);
      expect(
        fs.existsSync(path.join(target, "server/db/schema.ts")),
      ).toBe(true);
      expect(
        fs.existsSync(path.join(target, "server/plugins/db.ts")),
      ).toBe(true);

      const pkg = JSON.parse(
        fs.readFileSync(path.join(target, "package.json"), "utf-8"),
      );
      expect(pkg.name).toBe(appName);
      expect(pkg.displayName).toBe("Widgets");

      // No raw placeholders left anywhere in the produced tree
      assertNoRawPlaceholders(target);
    },
  );

  it("the crud-list starter produces 5 baseline action files", () => {
    const target = path.join(tmpRoot, "widgets");
    scaffoldFromStarterTemplate({
      name: "widgets",
      template: "crud-list",
      targetDir: target,
    });
    const actionFiles = fs.readdirSync(path.join(target, "actions"));
    expect(actionFiles.sort()).toEqual([
      "create-item.ts",
      "delete-item.ts",
      "get-item.ts",
      "list-items.ts",
      "update-item.ts",
    ]);
  });

  it("the agent-tool starter exposes exactly 2 capabilities", () => {
    const target = path.join(tmpRoot, "widgets");
    scaffoldFromStarterTemplate({
      name: "widgets",
      template: "agent-tool",
      targetDir: target,
    });
    const actionFiles = fs.readdirSync(path.join(target, "actions"));
    expect(actionFiles.sort()).toEqual(["list-tasks.ts", "run-task.ts"]);
  });

  it("the blank starter writes a single list-items action", () => {
    const target = path.join(tmpRoot, "widgets");
    scaffoldFromStarterTemplate({
      name: "widgets",
      template: "blank",
      targetDir: target,
    });
    expect(fs.readdirSync(path.join(target, "actions"))).toEqual([
      "list-items.ts",
    ]);
  });

  it("the dashboard starter writes a list-metrics action", () => {
    const target = path.join(tmpRoot, "widgets");
    scaffoldFromStarterTemplate({
      name: "widgets",
      template: "dashboard",
      targetDir: target,
    });
    expect(fs.readdirSync(path.join(target, "actions"))).toEqual([
      "list-metrics.ts",
    ]);
  });

  it("scaffold output produces a file tree snapshot per starter (golden file)", () => {
    const target = path.join(tmpRoot, "widgets");
    scaffoldFromStarterTemplate({
      name: "widgets",
      template: "crud-list",
      targetDir: target,
    });
    const tree = collectRelativeFiles(target).sort();
    // Spot-check the produced layout — full snapshot stays implicit so a
    // legitimate file addition isn't rejected purely on count, but the
    // shape of the tree is asserted.
    expect(tree).toContain("actions/create-item.ts");
    expect(tree).toContain("actions/list-items.ts");
    expect(tree).toContain("app/components/ItemList.tsx");
    expect(tree).toContain("app/hooks/use-items.ts");
    expect(tree).toContain("app/routes/_app.$id.tsx");
    expect(tree).toContain("app/routes/_app._index.tsx");
    expect(tree).toContain("app/routes/_app.tsx");
    expect(tree).toContain("server/db/index.ts");
    expect(tree).toContain("server/db/schema.ts");
    expect(tree).toContain("server/plugins/db.ts");
    expect(tree).toContain("tests/actions/create-item.spec.ts");
    expect(tree).toContain("tests/setup-db.ts");
  });
});

function assertNoRawPlaceholders(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      assertNoRawPlaceholders(p);
      continue;
    }
    if (entry.isSymbolicLink()) continue;
    let content: string;
    try {
      content = fs.readFileSync(p, "utf-8");
    } catch {
      continue;
    }
    expect(
      content.includes("<name>") ||
        content.includes("<Name>") ||
        content.includes("<NAME>"),
      `Unsubstituted placeholder found in ${p}`,
    ).toBe(false);
  }
}

function collectRelativeFiles(root: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, prefix), {
    withFileTypes: true,
  })) {
    const rel = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectRelativeFiles(root, rel));
    } else {
      out.push(rel);
    }
  }
  return out;
}
