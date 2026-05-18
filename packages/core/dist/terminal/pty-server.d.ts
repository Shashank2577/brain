/**
 * PTY WebSocket Server
 *
 * Creates an HTTP server with WebSocket support that spawns PTY processes
 * for AI CLI tools. Each WebSocket connection gets its own PTY.
 *
 * Used by both the embedded AgentTerminal component and the CLI frame.
 */
import { type IncomingMessage, type Server as HttpServer } from "http";
export interface PtyServerOptions {
    /** Working directory for PTY processes. Defaults to process.cwd() */
    appDir?: string;
    /** Default CLI command. Defaults to 'claude' */
    command?: string;
    /** Port to listen on. Defaults to 0 (random available port) */
    port?: number;
    /** Auth check for WebSocket upgrade requests. Return false to reject. */
    authCheck?: (req: IncomingMessage) => boolean | Promise<boolean>;
    /** Log prefix for console output. Defaults to '[terminal]' */
    logPrefix?: string;
}
export interface PtyServerResult {
    /** The underlying HTTP server */
    server: HttpServer;
    /** The actual port the server is listening on */
    port: number;
    /** Shut down the server and kill all PTY processes */
    close: () => void;
}
export declare function createPtyWebSocketServer(options?: PtyServerOptions): Promise<PtyServerResult>;
//# sourceMappingURL=pty-server.d.ts.map