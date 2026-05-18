import type { CustomAgentProfile, RemoteAgentManifest, ResourceKind as StoredResourceKind, SkillMetadata } from "../../resources/metadata.js";
import type { McpServer } from "./use-mcp-servers.js";
/**
 * Extended resource kind that includes virtual entries injected into the
 * Workspace tree — MCP servers live in the settings store, not the
 * resources table, but they render as a folder inside each scope.
 */
export type ResourceKind = StoredResourceKind | "mcp-server";
export interface Resource {
    id: string;
    path: string;
    owner: string;
    content: string;
    mimeType: string;
    size: number;
    createdAt: number;
    updatedAt: number;
}
export interface ResourceMeta {
    id: string;
    path: string;
    owner: string;
    mimeType: string;
    size: number;
    createdAt: number;
    updatedAt: number;
}
export interface JobMetadata {
    schedule?: string;
    scheduleDescription?: string;
    enabled?: boolean;
    lastStatus?: "success" | "error" | "running" | "skipped";
    lastRun?: string;
    nextRun?: string;
}
export interface TreeNode {
    name: string;
    path: string;
    type: "file" | "folder";
    kind?: ResourceKind;
    children?: TreeNode[];
    resource?: ResourceMeta;
    /** Parsed metadata for job files (under jobs/) */
    jobMeta?: JobMetadata;
    skillMeta?: SkillMetadata;
    agentMeta?: CustomAgentProfile;
    remoteAgentMeta?: RemoteAgentManifest;
    /** Attached when `kind === "mcp-server"` — virtual tree entry. */
    mcpServerMeta?: McpServer;
}
export type ResourceScope = "personal" | "shared" | "all";
/**
 * Inject a virtual `mcp-servers/` folder into a scope's resource tree.
 *
 * MCP servers aren't stored as resource rows — they live in the settings
 * store — but we surface them in the Workspace tree alongside `memory/`,
 * `skills/`, etc. Each server becomes a synthetic `TreeNode` whose
 * `resource.id` is an `mcp:<scope>:<id>` virtual id the panel recognizes
 * on click/delete and routes to the MCP endpoints instead of the
 * resource endpoints.
 *
 * Returns a new tree; the input is not mutated. If `servers` is empty
 * and `alwaysShow` is false, the folder is not added — same behavior as
 * any other optional folder.
 */
export declare function withMcpServersFolder(tree: TreeNode[], servers: McpServer[], opts?: {
    alwaysShow?: boolean;
}): TreeNode[];
/**
 * Group top-level `scripts/` and `tasks/` folders into a virtual
 * `agent-scratch/` folder.
 *
 * The agent occasionally writes scratch scripts and task notes to the
 * resources store while working through a request. These aren't user
 * content — they're agent machinery — and they clutter the top of the
 * personal tree. Grouping them under a single clearly-labeled folder
 * keeps them visible (so the user can inspect or delete) without making
 * them look like first-class personal files.
 */
export declare function withAgentScratchFolder(tree: TreeNode[]): TreeNode[];
export declare function useResources(scope?: ResourceScope): import("@tanstack/react-query").UseQueryResult<ResourceMeta[], Error>;
export declare function useResourceTree(scope?: ResourceScope): import("@tanstack/react-query").UseQueryResult<TreeNode[], Error>;
export declare function useResource(id: string | null): import("@tanstack/react-query").UseQueryResult<Resource, Error>;
export declare function useCreateResource(): import("@tanstack/react-query").UseMutationResult<Resource, Error, {
    path: string;
    content?: string;
    mimeType?: string;
    shared?: boolean;
}, unknown>;
export declare function useUpdateResource(): import("@tanstack/react-query").UseMutationResult<Resource, Error, {
    id: string;
    content?: string;
    path?: string;
    mimeType?: string;
}, unknown>;
export declare function useDeleteResource(): import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
export declare function useUploadResource(): import("@tanstack/react-query").UseMutationResult<Resource, Error, FormData, unknown>;
//# sourceMappingURL=use-resources.d.ts.map