import type { IntegrationsPluginOptions } from "./types.js";
type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
type RemoteCodeCommandEnvelope = {
    kind?: unknown;
    ownerEmail?: unknown;
    orgId?: unknown;
    command?: unknown;
    source?: unknown;
};
export declare function enqueueRemoteCommand(envelope: RemoteCodeCommandEnvelope): Promise<Record<string, unknown>>;
/**
 * Creates a Nitro plugin that mounts messaging platform integration webhook routes.
 *
 * Routes:
 *   POST   /_agent-native/integrations/:platform/webhook  — receive platform webhooks
 *   GET    /_agent-native/integrations/status              — all integrations status
 *   GET    /_agent-native/integrations/:platform/status    — single platform status
 *   POST   /_agent-native/integrations/:platform/enable    — enable integration
 *   POST   /_agent-native/integrations/:platform/disable   — disable integration
 *   POST   /_agent-native/integrations/:platform/setup     — platform-specific setup
 */
export declare function createIntegrationsPlugin(options?: IntegrationsPluginOptions): NitroPluginDef;
/**
 * Default integrations plugin — auto-mounts all adapters.
 */
export declare const defaultIntegrationsPlugin: NitroPluginDef;
export {};
//# sourceMappingURL=plugin.d.ts.map