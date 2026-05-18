/**
 * Voice dictation hook for the agent composer.
 *
 * Wires voice providers behind a single state machine:
 *   - "auto" / "openai" / "builder" / "builder-gemini" / "gemini" / "groq"
 *     — MediaRecorder → POST /_agent-native/transcribe-voice
 *   - "google-realtime"
 *     — MediaRecorder chunks → POST /_agent-native/transcribe-stream/session
 *       → managed WebSocket → Google Speech-to-Text streaming
 *   - "browser" — Web Speech API (low quality, offline capable)
 *
 * Provider preference lives in application_state under
 * `voice-transcription-prefs` (`{ transcriptionMode, provider, instructions }`).
 * The composer reads it on every start so settings changes take effect
 * immediately without unmounting the composer.
 *
 * The hook exposes amplitude (0..1) and duration (ms) so the composer can
 * render the Lovable-style live waveform + MM:SS timer.
 */
export type VoiceProvider = "auto" | "openai" | "browser" | "google-realtime" | "builder-gemini" | "builder" | "gemini" | "groq";
export type TranscriptionMode = "mac-native" | "google-realtime" | "batch";
export interface VoicePrefs {
    provider: VoiceProvider;
    transcriptionMode?: TranscriptionMode;
    instructions?: string;
}
export type VoiceState = "idle" | "starting" | "recording" | "transcribing" | "error";
export interface UseVoiceDictationOptions {
    onTranscript: (text: string) => void;
    onError?: (message: string) => void;
    /** Called with (accumulatedFinalText, currentInterimText) as speech is recognized in real time. */
    onLiveUpdate?: (finalText: string, interimText: string) => void;
}
export interface VoiceDictationApi {
    state: VoiceState;
    amplitude: number;
    durationMs: number;
    errorMessage: string | null;
    provider: VoiceProvider;
    supported: boolean;
    start: () => Promise<void>;
    stop: () => void;
    cancel: () => void;
    dismissError: () => void;
}
export declare function voiceDictationStartErrorMessage(error: unknown): string;
export declare function useVoiceDictation(options: UseVoiceDictationOptions): VoiceDictationApi;
//# sourceMappingURL=useVoiceDictation.d.ts.map