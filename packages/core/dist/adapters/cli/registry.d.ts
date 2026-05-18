import type { CliAdapter } from "./types.js";
/**
 * Registry of CLI adapters available to the agent.
 *
 * Register adapters at app startup. The agent can then discover what
 * CLIs are available and execute commands through them.
 */
export declare class CliRegistry {
    private adapters;
    /** Register an adapter. Replaces any existing adapter with the same name. */
    register(adapter: CliAdapter): void;
    /** Unregister an adapter by name. */
    unregister(name: string): void;
    /** Get an adapter by name. Returns undefined if not registered. */
    get(name: string): CliAdapter | undefined;
    /** List all registered adapters. */
    list(): CliAdapter[];
    /**
     * List only adapters whose CLI is currently available (installed).
     * Checks each adapter in parallel.
     */
    listAvailable(): Promise<CliAdapter[]>;
    /**
     * Return a summary of all registered adapters for agent discovery.
     * Includes availability status.
     */
    describe(): Promise<{
        name: string;
        description: string;
        available: boolean;
    }[]>;
}
//# sourceMappingURL=registry.d.ts.map