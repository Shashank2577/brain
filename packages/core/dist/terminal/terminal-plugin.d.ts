export interface TerminalPluginOptions {
    /** CLI command to run. Defaults to AGENT_CLI_COMMAND env or 'builder' */
    command?: string;
    /** Port for the WebSocket server. Defaults to AGENT_TERMINAL_PORT env or auto-assigned */
    port?: number;
    /** Enable in production. Defaults to AGENT_TERMINAL_ENABLED env or false in prod */
    enabledInProduction?: boolean;
    /** Auth check for WebSocket connections in production */
    authCheck?: (req: any) => boolean | Promise<boolean>;
}
export declare function createTerminalPlugin(options?: TerminalPluginOptions): (nitroApp: any) => Promise<void>;
/** Pre-configured terminal plugin with defaults */
export declare const defaultTerminalPlugin: (nitroApp: any) => Promise<void>;
//# sourceMappingURL=terminal-plugin.d.ts.map