/**
 * Isomorphic Agent Env Utility
 *
 * Works in both browser and Node.js contexts:
 * - Browser: sends via postMessage to the parent window
 * - Node.js (scripts): sends via BUILDER_PARENT_MESSAGE stdout format,
 *   which the Electron host translates to postMessage
 */
export interface EnvVar {
    key: string;
    value: string;
}
/**
 * Send env vars to the host (Builder cloud or Claude frame).
 * Automatically detects environment (browser vs Node.js) and uses the right transport.
 */
declare function setVars(vars: EnvVar[]): void;
export declare const agentEnv: {
    /** Send environment variables to the host for persistence */
    setVars: typeof setVars;
};
export {};
//# sourceMappingURL=agent-env.d.ts.map