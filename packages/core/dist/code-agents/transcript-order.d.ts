export interface CodeAgentTranscriptOrderEvent {
    id: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
}
export interface CodeAgentRunStateLike {
    status?: string;
    phase?: string;
    needsApproval?: boolean;
    metadata?: Record<string, unknown>;
}
export declare function getCodeAgentTranscriptSeq(event: CodeAgentTranscriptOrderEvent): number | null;
export declare function compareCodeAgentTranscriptEvents<TEvent extends CodeAgentTranscriptOrderEvent>(a: TEvent, b: TEvent): number;
export declare function mergeCodeAgentTranscriptEvents<TEvent extends CodeAgentTranscriptOrderEvent>(current: readonly TEvent[], incoming: readonly TEvent[]): TEvent[];
export declare function isCodeAgentRunActive(run: CodeAgentRunStateLike): boolean;
//# sourceMappingURL=transcript-order.d.ts.map