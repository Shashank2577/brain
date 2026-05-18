import React from "react";
import type { MentionItem, SkillResult, SlashCommand } from "./types.js";
export interface MentionPopoverRef {
    moveUp: () => void;
    moveDown: () => void;
    getSelectedIndex: () => number;
    getSelectedMention: () => MentionItem | null;
    getSelectedCommand: () => SlashCommand | null;
}
interface MentionPopoverProps {
    type: "@" | "/";
    position: {
        top: number;
        left: number;
    } | null;
    mentionItems: MentionItem[];
    skills: SkillResult[];
    commands?: SlashCommand[];
    hint?: string;
    isLoading: boolean;
    query: string;
    onSelectMention: (item: MentionItem) => void;
    onSelectSkill: (skill: SkillResult) => void;
    onSelectCommand?: (command: SlashCommand) => void;
    onClose: () => void;
}
export declare const MentionPopover: React.ForwardRefExoticComponent<MentionPopoverProps & React.RefAttributes<MentionPopoverRef>>;
export {};
//# sourceMappingURL=MentionPopover.d.ts.map