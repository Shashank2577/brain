import { describe, expect, it } from "vitest";
import { pickSource } from "./start-transcript";

describe("pickSource — transcript source priority", () => {
  it("picks native when desktop bridge is present", () => {
    expect(
      pickSource({ hasDesktopBridge: true, hasWhisperKey: true }),
    ).toBe("native");
  });

  it("falls back to whisper when no bridge but a key is configured", () => {
    expect(
      pickSource({ hasDesktopBridge: false, hasWhisperKey: true }),
    ).toBe("whisper");
  });

  it("falls back to manual when neither bridge nor key", () => {
    expect(
      pickSource({ hasDesktopBridge: false, hasWhisperKey: false }),
    ).toBe("manual");
  });

  it("preferredSource overrides everything", () => {
    expect(
      pickSource({
        preferred: "manual",
        hasDesktopBridge: true,
        hasWhisperKey: true,
      }),
    ).toBe("manual");
    expect(
      pickSource({
        preferred: "whisper",
        hasDesktopBridge: true,
        hasWhisperKey: false,
      }),
    ).toBe("whisper");
  });
});
