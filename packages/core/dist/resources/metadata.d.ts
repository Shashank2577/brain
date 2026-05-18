export type ResourceKind = "file" | "skill" | "job" | "agent" | "remote-agent";
export interface ParsedFrontmatter {
    raw: string;
    body: string;
    fields: Array<{
        key: string;
        value: string;
    }>;
}
export interface SkillMetadata {
    name: string;
    description?: string;
}
export interface CustomAgentProfile {
    id: string;
    path: string;
    name: string;
    description?: string;
    model?: string;
    tools?: string;
    color?: string;
    delegateDefault?: boolean;
    instructions: string;
}
export interface RemoteAgentManifest {
    id: string;
    path: string;
    name: string;
    description?: string;
    url: string;
    color?: string;
}
export declare const REMOTE_AGENT_RESOURCE_PREFIX = "remote-agents/";
export declare const LEGACY_REMOTE_AGENT_RESOURCE_PREFIX = "agents/";
export declare const REMOTE_AGENT_RESOURCE_PREFIXES: readonly ["remote-agents/", "agents/"];
export declare function parseFrontmatter(content: string): ParsedFrontmatter | null;
export declare function serializeFrontmatter(fields: Array<{
    key: string;
    value: string;
}>): string;
export declare function getFrontmatterValue(frontmatter: ParsedFrontmatter | null, key: string): string | undefined;
export declare function frontmatterFieldsToObject(frontmatter: ParsedFrontmatter | null): Record<string, string>;
export declare function isSkillPath(path: string): boolean;
export declare function getSkillNameFromPath(path: string): string;
export declare function isJobPath(path: string): boolean;
export declare function isCustomAgentPath(path: string): boolean;
export declare function isRemoteAgentPath(path: string): boolean;
export declare function getRemoteAgentIdFromPath(path: string): string;
export declare function remoteAgentResourcePath(id: string): string;
export declare function getResourceKind(path: string): ResourceKind;
export declare function parseSkillMetadata(content: string, path: string): SkillMetadata | null;
export declare function parseCustomAgentProfile(content: string, path: string): CustomAgentProfile | null;
export declare function parseRemoteAgentManifest(content: string, path: string): RemoteAgentManifest | null;
//# sourceMappingURL=metadata.d.ts.map