import type { Config } from "tailwindcss";
/**
 * Glob pattern that matches all core client component files.
 * Templates MUST include this in their `content` array — Tailwind v3
 * does NOT merge `content` from presets, so the preset alone isn't enough.
 *
 * Usage:
 *   import preset, { coreContentGlob } from "@agent-native/core/tailwind";
 *   export default { presets: [preset], content: ["./app/**\/*.{ts,tsx}", coreContentGlob] };
 */
export declare const coreContentGlob: string;
declare const _default: Config;
export default _default;
//# sourceMappingURL=tailwind.preset.d.ts.map