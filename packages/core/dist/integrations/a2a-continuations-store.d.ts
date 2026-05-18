import type { IncomingMessage } from "./types.js";
export type A2AContinuationStatus = "pending" | "processing" | "delivering" | "completed" | "failed";
export interface A2AContinuation {
    id: string;
    integrationTaskId: string;
    platform: string;
    externalThreadId: string;
    incoming: IncomingMessage;
    placeholderRef: string | null;
    ownerEmail: string;
    orgId: string | null;
    agentName: string;
    agentUrl: string;
    dedupeKey: string | null;
    a2aTaskId: string;
    a2aAuthToken: string | null;
    status: A2AContinuationStatus;
    attempts: number;
    nextCheckAt: number;
    errorMessage: string | null;
    createdAt: number;
    updatedAt: number;
    completedAt: number | null;
}
export declare function insertA2AContinuation(input: {
    integrationTaskId: string;
    platform: string;
    externalThreadId: string;
    incoming: IncomingMessage;
    placeholderRef?: string | null;
    ownerEmail: string;
    orgId?: string | null;
    agentName: string;
    agentUrl: string;
    dedupeKey?: string | null;
    a2aTaskId: string;
    a2aAuthToken?: string | null;
}): Promise<A2AContinuation>;
export declare function getA2AContinuationForIntegrationTask(integrationTaskId: string): Promise<A2AContinuation | null>;
export declare function getA2AContinuationsForIntegrationTaskAgent(integrationTaskId: string, agentUrl: string, dedupeKey?: string | null): Promise<A2AContinuation[]>;
export declare function getA2AContinuation(id: string): Promise<A2AContinuation | null>;
export declare function claimA2AContinuation(id: string): Promise<A2AContinuation | null>;
export declare function claimDueA2AContinuations(limit?: number): Promise<A2AContinuation[]>;
export declare function claimA2AContinuationDelivery(id: string): Promise<A2AContinuation | null>;
export declare function rescheduleA2AContinuation(id: string, delayMs: number): Promise<void>;
export declare function completeA2AContinuation(id: string): Promise<void>;
export declare function failA2AContinuation(id: string, errorMessage: string): Promise<void>;
//# sourceMappingURL=a2a-continuations-store.d.ts.map