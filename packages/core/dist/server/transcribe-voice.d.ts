/**
 * POST /_agent-native/transcribe-voice
 *
 * Receives an audio blob from the agent sidebar composer and forwards it to
 * the configured transcription provider. Returns `{ text }` on success,
 * `{ error }` on failure.
 *
 * Key resolution order for BYOK providers:
 *   1. Request-scoped encrypted secret (`app_secrets`: user, org, workspace).
 *   2. Env var fallback only outside authenticated request contexts.
 *
 * If no server provider is configured, returns 400 with an error the
 * composer UI can surface (the client falls back to Web Speech when possible).
 *
 * This is a framework route rather than a `defineAction` because multipart
 * audio bodies aren't a clean fit for the action contract (actions are
 * typed JSON-in / JSON-out).
 */
export declare function createTranscribeVoiceHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    text: string;
} | {
    error: string;
}>>;
//# sourceMappingURL=transcribe-voice.d.ts.map