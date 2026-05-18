export interface BuilderTranscribeOptions {
    audioBytes: Uint8Array;
    mimeType: string;
    model?: string;
    diarize?: boolean;
    minSpeakers?: number;
    maxSpeakers?: number;
    language?: string;
    instructions?: string;
}
export interface BuilderTranscribeResult {
    text: string;
    language: string;
    durationSeconds: number;
    segments: Array<{
        startMs: number;
        endMs: number;
        text: string;
        speakerLabel?: string;
        words?: Array<{
            startMs: number;
            endMs: number;
            text: string;
            confidence?: number;
        }>;
    }>;
}
export declare function transcribeWithBuilder(opts: BuilderTranscribeOptions): Promise<BuilderTranscribeResult>;
//# sourceMappingURL=builder-transcription.d.ts.map