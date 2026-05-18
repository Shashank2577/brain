export { parseArgs, camelCaseArgs } from "./parse-args.js";
/**
 * Load .env files. In an enterprise workspace (detected via
 * `agent-native.workspaceCore` in a parent package.json) this also loads
 * the workspace root's .env first, so shared keys like ANTHROPIC_API_KEY
 * flow to every app without duplication. Per-app .env values win on
 * conflict (dotenv doesn't overwrite existing process.env values).
 */
export declare function loadEnv(envPath?: string): void;
/**
 * Locate the nearest enterprise workspace root above `startDir`, identified
 * by the `agent-native.workspaceCore` field in its package.json.
 */
export declare function findWorkspaceRoot(startDir: string): string | null;
/**
 * Validate a relative file path (no traversal, no absolute).
 */
export declare function isValidPath(p: string): boolean;
/**
 * Validate a project slug (e.g. "my-project" or "group/my-project").
 */
export declare function isValidProjectPath(project: string): boolean;
/**
 * mkdir -p helper.
 */
export declare function ensureDir(dir: string): void;
/**
 * Throw an error to abort a script. When running as a CLI (`pnpm script`),
 * the runner catches this and exits with code 1. When running in-server
 * (agent tools, A2A handlers), the error is caught by the wrapper and
 * returned as a tool result — no process.exit needed.
 */
export declare function fail(message: string): never;
//# sourceMappingURL=utils.d.ts.map