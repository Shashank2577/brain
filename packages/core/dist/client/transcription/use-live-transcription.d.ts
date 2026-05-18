/**
 * Live transcription hook — runs the browser's Web Speech API alongside
 * any recording to produce an instant transcript with no API key required.
 *
 * Designed to pair with a MediaRecorder: start when recording begins,
 * stop when the user hits stop. The accumulated transcript is available
 * immediately — no round-trip to Whisper needed.
 *
 * Higher-quality backends (Groq Whisper, OpenAI Whisper, Deepgram) can
 * refine the result afterward, but this gives users something useful
 * from second zero even without an API key.
 */
export interface UseLiveTranscriptionOptions {
    lang?: string;
}
export interface LiveTranscriptionApi {
    supported: boolean;
    isActive: boolean;
    /** Accumulated final transcript text so far. */
    transcript: string;
    /** Current interim (unconfirmed) text being spoken. */
    interimText: string;
    start: () => void;
    stop: () => string;
    stopAndWait: (timeoutMs?: number) => Promise<string>;
    pause: () => void;
    resume: () => void;
}
export declare function useLiveTranscription(options?: UseLiveTranscriptionOptions): LiveTranscriptionApi;
//# sourceMappingURL=use-live-transcription.d.ts.map