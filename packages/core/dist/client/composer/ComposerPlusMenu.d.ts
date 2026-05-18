import type { ComposerMode } from "./types.js";
interface ComposerPlusMenuProps {
    onSelectMode?: (mode: ComposerMode) => void;
    /**
     * "full" (default): full + menu with Upload File, Create Skill, Schedule Task,
     * Automation, Extension, MCP Server. "upload-only": clicking + opens the file
     * picker directly — no popover, no other modes. Use for prompt popovers
     * (create extension, create deck, create dashboard, etc.) where the only thing
     * to attach is a file.
     */
    mode?: "full" | "upload-only";
}
export declare function ComposerPlusMenu({ onSelectMode, mode, }: ComposerPlusMenuProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ComposerPlusMenu.d.ts.map