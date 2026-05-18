/**
 * Voice dictation button + recording overlay for the agent composer.
 *
 * UX mirrors Lovable: click-to-toggle record, a live amplitude bar and
 * MM:SS timer replace the editor area while recording, and a cancel X
 * discards without transcribing. The mic is always visible alongside the
 * send button (Cursor replaces send with mic; their users complain — we
 * don't copy that).
 */
import type { VoiceDictationApi } from "./useVoiceDictation.js";
export interface VoiceButtonProps {
    voice: VoiceDictationApi;
    isMac: boolean;
    disabled?: boolean;
}
export declare function VoiceButton({ voice, isMac, disabled }: VoiceButtonProps): import("react/jsx-runtime").JSX.Element;
export interface VoiceRecordingOverlayProps {
    voice: VoiceDictationApi;
}
export declare function VoiceRecordingOverlay({ voice }: VoiceRecordingOverlayProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VoiceButton.d.ts.map