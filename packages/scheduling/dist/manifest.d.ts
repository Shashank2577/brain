/**
 * Machine-readable manifest of what this package ships.
 *
 * Consumed by `agent-native add scheduling` (or the template scaffolder) to:
 *   - generate stub action files in the consumer's `actions/` folder
 *   - symlink/copy skill files into the consumer's `.agents/skills/`
 *   - append required secret declarations
 *   - print the list in `agent-native info @agent-native/scheduling`
 */
export interface SchedulingManifest {
    name: string;
    version: string;
    actions: string[];
    schemaEntryPoint: string;
    docs: {
        llms: string;
        llmsFull: string;
        skills: string[];
    };
    requiredSecrets: {
        key: string;
        label: string;
        optional?: boolean;
    }[];
    peerProviders: string[];
}
export declare const MANIFEST: SchedulingManifest;
//# sourceMappingURL=manifest.d.ts.map