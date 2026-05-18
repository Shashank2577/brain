import { type Resource, type ResourceMeta } from "./store.js";
import { type CustomAgentProfile, type RemoteAgentManifest, type SkillMetadata } from "./metadata.js";
interface JobMetadata {
    schedule?: string;
    scheduleDescription?: string;
    enabled?: boolean;
    lastStatus?: string;
    lastRun?: string;
    nextRun?: string;
}
interface TreeNode {
    name: string;
    path: string;
    type: "file" | "folder";
    kind?: "file" | "skill" | "job" | "agent" | "remote-agent";
    children?: TreeNode[];
    resource?: ResourceMeta;
    jobMeta?: JobMetadata;
    skillMeta?: SkillMetadata;
    agentMeta?: CustomAgentProfile;
    remoteAgentMeta?: RemoteAgentManifest;
}
/** GET /_agent-native/resources — list resources */
export declare function handleListResources(event: any): Promise<{
    resources: ResourceMeta[];
}>;
/** GET /_agent-native/resources/tree — build nested tree */
export declare function handleGetResourceTree(event: any): Promise<{
    tree: TreeNode[];
}>;
/** GET /_agent-native/resources/effective?path=... — show inheritance stack */
export declare function handleGetEffectiveResourceContext(event: any): Promise<import("./store.js").EffectiveResourceContext | {
    error: string;
}>;
/** GET /_agent-native/resources/:id — get single resource with content.
 *  If the request comes from an <img>/<video>/etc tag (Accept includes the
 *  resource's mime type, or query param `?raw` is set), return the raw binary
 *  with the correct Content-Type so the browser can render it inline. */
export declare function handleGetResource(event: any): Promise<Response | Resource | {
    error: string;
}>;
/** POST /_agent-native/resources — create a resource */
export declare function handleCreateResource(event: any): Promise<Resource | {
    error: string;
}>;
/** PUT /_agent-native/resources/:id — update an existing resource */
export declare function handleUpdateResource(event: any): Promise<Resource | {
    error: string;
}>;
/** DELETE /_agent-native/resources/:id — delete a resource */
export declare function handleDeleteResource(event: any): Promise<{
    error: string;
    ok?: undefined;
} | {
    ok: boolean;
    error?: undefined;
}>;
/** POST /_agent-native/resources/upload — upload a file as a resource */
export declare function handleUploadResource(event: any): Promise<Resource | {
    error: string;
} | {
    url: string;
    provider: string;
    id: string;
    path: string;
    owner: string;
    content: string;
    mimeType: string;
    size: number;
    createdAt: number;
    updatedAt: number;
    createdBy: import("./store.js").ResourceCreatedBy;
    visibility: import("./store.js").ResourceVisibility;
    threadId: string | null;
    runId: string | null;
    expiresAt: number | null;
    metadata: string | null;
    error?: undefined;
}>;
export {};
//# sourceMappingURL=handlers.d.ts.map