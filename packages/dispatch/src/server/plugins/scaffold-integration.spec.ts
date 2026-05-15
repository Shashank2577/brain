/**
 * Phase 6 — Integration: scaffold a starter template into a templates/
 * directory layout the capability registry would scan, then assert the
 * action files the registry expects to find are all present.
 *
 * We don't dynamically `import()` the scaffolded action files inside
 * the test because they `import { defineAction } from "@agent-native/core"`
 * and the tmp dir has no resolved node_modules. The full import path is
 * exercised by the workspace's e2e tests; the integration test stays
 * filesystem-level so it can run hermetically.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scaffoldFromStarterTemplate } from "@agent-native/core/cli/starter-scaffold";

describe("scaffold + capability scan layout", () => {
  let tmpRoot: string;
  let templatesDir: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-integration-"));
    templatesDir = path.join(tmpRoot, "templates");
    fs.mkdirSync(templatesDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("writes the 5 CRUD action files the registry will auto-derive for a crud-list app", () => {
    scaffoldFromStarterTemplate({
      name: "widgets",
      template: "crud-list",
      targetDir: path.join(templatesDir, "widgets"),
    });

    const actionsDir = path.join(templatesDir, "widgets", "actions");
    const files = fs.readdirSync(actionsDir).sort();
    expect(files).toEqual([
      "create-item.ts",
      "delete-item.ts",
      "get-item.ts",
      "list-items.ts",
      "update-item.ts",
    ]);
  });

  it("writes a single action for a blank app", () => {
    scaffoldFromStarterTemplate({
      name: "widgets",
      template: "blank",
      targetDir: path.join(templatesDir, "widgets"),
    });

    const actionsDir = path.join(templatesDir, "widgets", "actions");
    expect(fs.readdirSync(actionsDir)).toEqual(["list-items.ts"]);
  });

  it("writes two action files for an agent-tool app", () => {
    scaffoldFromStarterTemplate({
      name: "summarizer",
      template: "agent-tool",
      targetDir: path.join(templatesDir, "summarizer"),
    });

    const actionsDir = path.join(templatesDir, "summarizer", "actions");
    expect(fs.readdirSync(actionsDir).sort()).toEqual([
      "list-tasks.ts",
      "run-task.ts",
    ]);
  });

  it("writes a list-metrics action for a dashboard app", () => {
    scaffoldFromStarterTemplate({
      name: "kpis",
      template: "dashboard",
      targetDir: path.join(templatesDir, "kpis"),
    });

    const actionsDir = path.join(templatesDir, "kpis", "actions");
    expect(fs.readdirSync(actionsDir)).toEqual(["list-metrics.ts"]);
  });

  it("substitutes the kebab name into the scaffolded action body", () => {
    scaffoldFromStarterTemplate({
      name: "widgets",
      template: "crud-list",
      targetDir: path.join(templatesDir, "widgets"),
    });

    const listItems = fs.readFileSync(
      path.join(templatesDir, "widgets", "actions", "list-items.ts"),
      "utf-8",
    );
    // Placeholder substitution happened — `<name>` is gone, kebab slug is in.
    expect(listItems).not.toContain("<name>");
    expect(listItems).toContain("widgets.list-items");
    expect(listItems).toContain("schema.widgetsItems");
  });
});
