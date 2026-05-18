export interface A2AToolResultSummary {
    tool: string;
    result: string;
}
export interface A2AArtifactResponseOptions {
    baseUrl?: string;
    includeReferencedArtifacts?: boolean;
}
export declare function appendA2AArtifactLinks(responseText: string, toolResults: A2AToolResultSummary[], options?: A2AArtifactResponseOptions): string;
export declare function buildA2ARecoverableArtifactMessage(toolResults: A2AToolResultSummary[], options?: A2AArtifactResponseOptions): string | null;
//# sourceMappingURL=artifact-response.d.ts.map