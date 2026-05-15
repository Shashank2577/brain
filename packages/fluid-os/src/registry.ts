import type { AppManifest, CapabilityDef, CapabilityEntry, CapabilityMap } from "./manifest/types.js";

export interface ResolvedCapability {
  app: AppManifest;
  capabilityId: string;
  def: CapabilityDef;
  fqid: string;
}

export class CapabilityRegistry {
  private apps = new Map<string, AppManifest>();

  register(manifest: AppManifest): void {
    if (this.apps.has(manifest.id)) {
      throw new Error(`App "${manifest.id}" is already registered`);
    }
    this.apps.set(manifest.id, manifest);
  }

  unregister(appId: string): void {
    this.apps.delete(appId);
  }

  hasApp(appId: string): boolean {
    return this.apps.has(appId);
  }

  getApp(appId: string): AppManifest | undefined {
    return this.apps.get(appId);
  }

  listApps(): AppManifest[] {
    return Array.from(this.apps.values());
  }

  listCapabilities(): CapabilityEntry[] {
    const out: CapabilityEntry[] = [];
    for (const app of this.apps.values()) {
      for (const [capId, def] of Object.entries(app.capabilities as CapabilityMap)) {
        out.push({
          id: `${app.id}.${capId}`,
          appId: app.id,
          description: def.description,
          tags: def.tags,
        });
      }
    }
    return out;
  }

  resolve(fqid: string): ResolvedCapability | undefined {
    const dot = fqid.indexOf(".");
    if (dot <= 0) return undefined;
    const appId = fqid.slice(0, dot);
    const capabilityId = fqid.slice(dot + 1);
    const app = this.apps.get(appId);
    if (!app) return undefined;
    const def = (app.capabilities as CapabilityMap)[capabilityId];
    if (!def) return undefined;
    return { app, capabilityId, def, fqid };
  }

  describeForAgent(): string {
    const lines: string[] = ["# Installed apps", ""];
    for (const app of this.apps.values()) {
      lines.push(`## ${app.name} (\`${app.id}\`)`);
      lines.push(app.description);
      if (app.routes?.length) {
        lines.push("");
        lines.push("Routes:");
        for (const r of app.routes) lines.push(`- \`${r.path}\` — ${r.label}`);
      }
      lines.push("");
      lines.push("Capabilities:");
      for (const [capId, def] of Object.entries(app.capabilities as CapabilityMap)) {
        lines.push(`- \`${app.id}.${capId}\` — ${def.description}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }
}
