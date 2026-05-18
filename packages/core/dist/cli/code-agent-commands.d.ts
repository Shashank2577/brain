export interface CodeAgentProjectCommand {
    kind: "command";
    name: string;
    path: string;
    relativePath: string;
    description?: string;
    argumentHint?: string;
    reserved: boolean;
    body: string;
}
export interface CodeAgentProjectSkill {
    kind: "skill";
    name: string;
    path: string;
    relativePath: string;
    description?: string;
    body: string;
}
export interface CodeAgentCodePack {
    schemaVersion: 1;
    root: string;
    commands: CodeAgentProjectCommand[];
    skills: CodeAgentProjectSkill[];
}
export interface ReadProjectCodePackOptions {
    includeReservedCommands?: boolean;
}
export declare function readProjectCodePack(cwd?: string, options?: ReadProjectCodePackOptions): CodeAgentCodePack;
export declare function listProjectSlashCommands(cwd?: string): CodeAgentProjectCommand[];
export declare function listVisibleProjectSlashCommands(cwd?: string): CodeAgentProjectCommand[];
export declare function findProjectSlashCommand(commandName: string, cwd?: string): CodeAgentProjectCommand | null;
export declare function listProjectSkills(cwd?: string): CodeAgentProjectSkill[];
export declare function isReservedProjectSlashCommandName(value: string): boolean;
export declare function renderProjectSlashCommandPrompt(command: CodeAgentProjectCommand, args: string[]): string;
export declare function normalizeProjectSlashCommandName(value: string): string;
//# sourceMappingURL=code-agent-commands.d.ts.map