#!/usr/bin/env tsx
import { spawn, type ChildProcess } from "node:child_process";
import http from "node:http";
export interface WorkspaceApp {
    id: string;
    name: string;
    dir: string;
    port: number;
    process?: ChildProcess;
    restartTimer?: NodeJS.Timeout;
    restartAttempts?: number;
    installing?: boolean;
    installAttempted?: boolean;
    /**
     * Set true once we've successfully connected to the upstream. After that we
     * skip the readiness probe on every request; the child server stays
     * listening for the rest of the dev session.
     */
    ready?: boolean;
    readinessProbe?: Promise<void>;
}
export interface WorkspaceDevOptions {
    args?: string[];
    env?: NodeJS.ProcessEnv;
    root?: string;
    spawnProcess?: typeof spawn;
    openBrowser?: boolean;
    stdout?: Pick<NodeJS.WriteStream, "write">;
    stderr?: Pick<NodeJS.WriteStream, "write">;
}
export interface WorkspaceDevHandle {
    apps: WorkspaceApp[];
    defaultApp: string;
    gatewayUrl: () => string;
    ready: Promise<{
        port: number;
        url: string;
    }>;
    server: http.Server;
    shutdown: () => void;
}
export declare function isWorkspaceWatcherLimitError(err: Pick<NodeJS.ErrnoException, "code">): boolean;
export declare function shouldEagerStartWorkspaceApps(args?: string[], env?: NodeJS.ProcessEnv): boolean;
export declare function initialWorkspaceAppIds(apps: Array<Pick<WorkspaceApp, "id">>, defaultApp: string, eager: boolean, startDefault?: boolean): string[];
export declare function runWorkspaceDev(options?: WorkspaceDevOptions): Promise<WorkspaceDevHandle>;
//# sourceMappingURL=workspace-dev.d.ts.map