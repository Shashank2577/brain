export interface VoiceProvidersStatus {
    builder: boolean;
    gemini: boolean;
    openai: boolean;
    groq: boolean;
    /**
     * Google Speech-to-Text realtime streaming is BYOK-only for v1. This reports
     * whether a service-account credential is configured; the actual stream runs
     * through the dedicated WebSocket -> StreamingRecognize path, not the batch
     * transcribe route.
     */
    googleRealtime: boolean;
    /** Always true — the Web Speech API is available in WebKit-based clients. */
    browser: true;
    /**
     * Apple's SFSpeechRecognizer + AVAudioEngine, exposed by the Tauri
     * desktop client. Always reported as `true` from the server — the
     * desktop client gates this on macOS at the Tauri-command boundary, so
     * non-macOS hosts return a clear error instead of attempting to use it.
     */
    native: true;
}
export declare function createVoiceProvidersStatusHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<VoiceProvidersStatus | {
    error: string;
}>>;
//# sourceMappingURL=voice-providers-status.d.ts.map