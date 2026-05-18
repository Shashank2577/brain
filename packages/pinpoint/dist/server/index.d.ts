import { Router, Application } from 'express';
import { PinStorage, Pin, PinStatus } from '../types/index.js';

interface PinRoutesOptions {
    /** Directory for pin data files. Default: data/pins */
    dataDir?: string;
}
/**
 * Create Express router with pin CRUD endpoints.
 *
 * Usage:
 * ```ts
 * import { pagePinRoutes } from '@agent-native/pinpoint/server';
 * app.use('/api/pins', pagePinRoutes());
 * ```
 */
declare function pagePinRoutes(options?: PinRoutesOptions): Router;

/**
 * Register Pinpoint as an A2A agent.
 * Call this after creating your express app.
 *
 * ```ts
 * import { registerPinpointA2A } from '@agent-native/pinpoint/server';
 * registerPinpointA2A(app);
 * ```
 */
declare function registerPinpointA2A(app: Application, options?: {
    dataDir?: string;
}): void;

/**
 * Create MCP tool handlers for Pinpoint.
 * These can be registered with an MCP server instance.
 *
 * ```ts
 * import { Server } from '@modelcontextprotocol/sdk/server/index.js';
 * import { createPinpointMCPTools } from '@agent-native/pinpoint/server';
 *
 * const server = new Server({ name: 'pinpoint', version: '1.0.0' }, { capabilities: { tools: {} } });
 * const tools = createPinpointMCPTools();
 * // Register tools with server...
 * ```
 */
declare function createPinpointMCPTools(options?: {
    dataDir?: string;
}): {
    tools: ({
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                pageUrl: {
                    type: string;
                    description: string;
                };
                status: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                id?: undefined;
                message?: undefined;
                selector?: undefined;
                comment?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                id: {
                    type: string;
                    description: string;
                };
                message: {
                    type: string;
                    description: string;
                };
                pageUrl?: undefined;
                status?: undefined;
                selector?: undefined;
                comment?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                pageUrl: {
                    type: string;
                    description: string;
                };
                selector: {
                    type: string;
                    description: string;
                };
                comment: {
                    type: string;
                    description: string;
                };
                status?: undefined;
                id?: undefined;
                message?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                id: {
                    type: string;
                    description: string;
                };
                pageUrl?: undefined;
                status?: undefined;
                message?: undefined;
                selector?: undefined;
                comment?: undefined;
            };
            required: string[];
        };
    })[];
    handleTool(name: string, args: Record<string, any>): Promise<{
        content: Array<{
            type: string;
            text: string;
        }>;
    }>;
};

declare class FileStore implements PinStorage {
    private dir;
    constructor(dataDir?: string);
    private validateId;
    private pinPath;
    private ensureDir;
    private readPin;
    private atomicWrite;
    load(pageUrl: string): Promise<Pin[]>;
    save(pin: Pin): Promise<void>;
    update(id: string, patch: Partial<Pin>): Promise<void>;
    delete(id: string): Promise<void>;
    list(filter?: {
        pageUrl?: string;
        status?: PinStatus;
    }): Promise<Pin[]>;
    clear(pageUrl?: string): Promise<void>;
}

export { FileStore, type PinRoutesOptions, createPinpointMCPTools, pagePinRoutes, registerPinpointA2A };
