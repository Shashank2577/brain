import { execFile } from "node:child_process";
/**
 * Generic adapter that wraps any CLI binary. Use this to quickly register
 * a CLI without writing a custom adapter class.
 *
 * ```ts
 * const gh = new ShellCliAdapter({
 *   command: "gh",
 *   description: "GitHub CLI for repos, PRs, issues, and releases",
 * });
 * ```
 */
export class ShellCliAdapter {
    name;
    description;
    command;
    env;
    cwd;
    timeoutMs;
    constructor(options) {
        this.name = options.name ?? options.command;
        this.description = options.description;
        this.command = options.command;
        this.env = options.env;
        this.cwd = options.cwd;
        this.timeoutMs = options.timeoutMs ?? 30_000;
    }
    async isAvailable() {
        try {
            const result = await this.execute(["--version"]);
            return result.exitCode === 0;
        }
        catch {
            return false;
        }
    }
    execute(args) {
        return new Promise((resolve) => {
            const child = execFile(this.command, args, {
                env: this.env ? { ...process.env, ...this.env } : process.env,
                cwd: this.cwd,
                timeout: this.timeoutMs,
                maxBuffer: 10 * 1024 * 1024, // 10MB
                encoding: "utf-8",
            }, (error, stdout, stderr) => {
                resolve({
                    stdout: stdout ?? "",
                    stderr: stderr ?? "",
                    exitCode: error?.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER"
                        ? 1
                        : (error?.code ?? child.exitCode ?? 0),
                });
            });
        });
    }
}
//# sourceMappingURL=shell-adapter.js.map