/**
 * <VoiceTranscriptionSection /> — source + cleanup settings for voice input.
 *
 * Writes the selection to application_state under `voice-transcription-prefs`
 * so the composer's `useVoiceDictation` hook picks it up on next record. The
 * legacy `provider` field is still written alongside `transcriptionMode` so
 * older clients continue to normalize safely.
 *
 * Provider status comes from `/_agent-native/voice-providers/status`, which
 * mirrors the server transcription route's key/env resolution.
 */
export declare function VoiceTranscriptionSection(): import("react/jsx-runtime").JSX.Element;
export declare function VoiceTranscriptionIcon(): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VoiceTranscriptionSection.d.ts.map