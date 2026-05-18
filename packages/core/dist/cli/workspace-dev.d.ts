#!/usr/bin/env tsx
import { spawn, type ChildProcess } from "node:child_process";
import http from "node:http";
import { type WorkspaceAppAudience } from "../shared/workspace-app-audience.js";
export interface WorkspaceApp {
    id: string;
    name: string;
    description: string;
    audience: WorkspaceAppAudience;
    publicPaths: string[];
    protectedPaths: string[];
    dir: string;
    port: number;
    process?: ChildProcess;
    restartTimer?: NodeJS.Timeout;
    restartAttempts?: number;
    lastFailure?: {
        code: number | null;
        signal: NodeJS.Signals | null;
        at: number;
        installing: boolean;
        output: string;
        nextRetryAt: number;
    };
    outputTail?: string;
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
export type PollingFileWatcherMode = "enable" | "disable-explicit" | "disable-default";
/**
 * Three-way classification of the polling-watcher decision so callers can
 * tell apart "the user explicitly turned this off" (where we want to override
 * any inherited chokidar/TSC env vars from the parent shell) from "we just
 * didn't auto-detect a Builder/Codespaces/Gitpod container" (where the user's
 * own watcher vars should pass through untouched).
 */
export declare function pollingFileWatcherMode(env?: NodeJS.ProcessEnv, root?: string): PollingFileWatcherMode;
export declare function shouldUsePollingFileWatcher(env?: NodeJS.ProcessEnv, root?: string): boolean;
export declare function initialWorkspaceAppIds(apps: Array<Pick<WorkspaceApp, "id">>, defaultApp: string, eager: boolean, startDefault?: boolean): string[];
export declare function runWorkspaceDev(options?: WorkspaceDevOptions): Promise<WorkspaceDevHandle>;
//# sourceMappingURL=workspace-dev.d.ts.map