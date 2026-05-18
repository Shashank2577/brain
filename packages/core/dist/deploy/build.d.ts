#!/usr/bin/env node
/**
 * Post-build step for deploying agent-native apps to edge/serverless targets.
 *
 * When NITRO_PRESET is set, this script:
 * 1. Takes the React Router build output (build/client/ + build/server/)
 * 2. Generates a platform-specific server entry point
 * 3. Bundles everything with esbuild into the target format
 *
 * Supported presets:
 * - cloudflare_pages: Outputs dist/ with _worker.js for Cloudflare Pages
 *
 * Usage: node deploy/build.js (called automatically by `agent-native build`)
 */
import { type DiscoveredRoute, type DiscoveredAction } from "./route-discovery.js";
import { type WorkspaceCoreExports } from "./workspace-core.js";
/**
 * Generate the worker entry source code that wires up H3 + React Router SSR.
 *
 * If a workspace core is present (monorepo with `agent-native.workspaceCore`
 * configured and the named package resolves), any plugin slot that the
 * workspace core exports is imported from there instead of from
 * `@agent-native/core/server`. This is the middle layer of the three-layer
 * inheritance model: app local > workspace core > framework default.
 */
export declare function generateWorkerEntry(routes: DiscoveredRoute[], pluginPaths: string[], defaultPluginStems?: string[], actions?: DiscoveredAction[], workspaceCore?: WorkspaceCoreExports | null): string;
export declare function getNodeBuiltinNames(): string[];
//# sourceMappingURL=build.d.ts.map