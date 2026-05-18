export interface RemoteCodeAgentDeviceConfig {
    token: string;
    relayUrl?: string;
    deviceId?: string;
    deviceName?: string;
    pollIntervalMs?: number;
}
export interface RunCodeAgentConnectorOptions {
    relayUrl?: string;
    output?: NodeJS.WritableStream;
    signal?: AbortSignal;
    once?: boolean;
}
export declare function remoteDeviceConfigPath(): string;
export declare function loadRemoteCodeAgentDeviceConfig(configPath?: string): RemoteCodeAgentDeviceConfig | null;
export declare function runCodeAgentConnector(options?: RunCodeAgentConnectorOptions): Promise<number>;
//# sourceMappingURL=code-agent-connector.d.ts.map