import { registerRequiredSecret } from "@agent-native/core/secrets";

// Transcription secrets are optional — meetings work without them.
// When configured, `meetings.start-transcript` will prefer `whisper` over
// `manual` if no desktop bridge is detected.

registerRequiredSecret({
  key: "OPENAI_API_KEY",
  label: "OpenAI API Key (for Whisper transcription)",
  description:
    "Used for live transcription via Whisper when the desktop bridge is not available. Optional — meetings work without it (falls back to manual entry).",
  docsUrl: "https://platform.openai.com/api-keys",
  scope: "user",
  kind: "api-key",
  required: false,
});
