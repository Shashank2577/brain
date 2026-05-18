/**
 * AgentTerminal — Embeddable CLI terminal component
 *
 * Renders an xterm.js terminal connected to a PTY WebSocket server.
 * When running inside a frame, renders nothing (the frame manages the terminal).
 *
 * Usage:
 *   import { AgentTerminal } from "@agent-native/core/terminal";
 *   <AgentTerminal className="w-full h-[400px]" />
 */
import { type CSSProperties } from "react";
export interface AgentTerminalProps {
    /** CLI command to run. Default: 'builder' */
    command?: string;
    /** Additional CLI flags */
    flags?: string;
    /** Custom WebSocket URL (overrides auto-discovery) */
    wsUrl?: string;
    /** Hide when running inside frame. Default: true */
    hideInFrame?: boolean;
    /** Terminal theme overrides */
    theme?: Record<string, string>;
    /** Font size. Default: 12 */
    fontSize?: number;
    /** CSS class for the container */
    className?: string;
    /** Inline styles for the container */
    style?: CSSProperties;
    /** Callback when connection state changes */
    onConnectionChange?: (connected: boolean) => void;
    /** Callback when agent running state changes */
    onAgentRunningChange?: (running: boolean) => void;
}
export declare function formatWebSocketHostname(hostname: string): string;
export declare function AgentTerminal({ command, flags, wsUrl: wsUrlProp, hideInFrame, theme, fontSize, className, style, onConnectionChange, onAgentRunningChange, }: AgentTerminalProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AgentTerminal.d.ts.map