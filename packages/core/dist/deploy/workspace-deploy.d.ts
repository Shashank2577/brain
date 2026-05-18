/**
 * `agent-native deploy` — build and deploy every app in a workspace to a
 * single origin. Each app is served from `/<app-name>/*`, so:
 *
 *   https://your-agents.com/mail/*       → apps/mail
 *   https://your-agents.com/calendar/*   → apps/calendar
 *
 * Benefits of same-origin deploy:
 *   - Shared auth cookie → log in once, every app is signed in
 *   - Cross-app A2A is a same-origin fetch (no CORS, no JWT for siblings)
 *   - One DNS record, one TLS cert, one CDN cache
 *
 * Per-app independent deploy is still supported — just cd into the app and
 * run `agent-native build` as before. This orchestrator is for teams that
 * want the whole workspace behind one domain.
 */
import { execFileSync } from "child_process";
export type WorkspaceDeployPreset = "cloudflare_pages" | "netlify" | "vercel";
export interface WorkspaceDeployOptions {
    args?: string[];
    /** Override the workspace root (defaults to walking up from cwd). */
    workspaceRoot?: string;
    /** Only build — don't invoke the deploy platform CLI. */
    buildOnly?: boolean;
    /** Target preset. Defaults to `cloudflare_pages`. */
    preset?: WorkspaceDeployPreset;
    /** @internal Override process execution in tests. */
    execFile?: typeof execFileSync;
}
export declare function runWorkspaceDeploy(opts?: WorkspaceDeployOptions): Promise<void>;
//# sourceMappingURL=workspace-deploy.d.ts.map