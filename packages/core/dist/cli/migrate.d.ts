type MigrateSubcommand = "resume" | "status" | "stop" | "ui";
type SourceKind = "path" | "url" | "description";
export interface MigrateCliOptions {
    subcommand?: MigrateSubcommand;
    source?: string;
    sourcePath?: string;
    sourceUrl?: string;
    sourceDescription?: string;
    workbench?: string;
    output?: string;
    appName?: string;
    target?: string;
    planOnly?: boolean;
    emit?: boolean;
    emitDir?: string;
    appSurface?: boolean;
    last?: boolean;
    help?: boolean;
}
export interface SourceSpec {
    kind: SourceKind;
    value: string;
    sourceRoot?: string;
    description?: string;
}
export interface EmitDossierResult {
    dossierRoot: string;
    files: string[];
    source: SourceSpec;
    usedMigrateHelpers: boolean;
}
export declare function parseMigrateArgs(argv: string[]): MigrateCliOptions;
export declare function runMigrate(argv: string[]): Promise<void>;
export declare function emitOwnAgentDossier(opts: MigrateCliOptions, cwd?: string): Promise<EmitDossierResult>;
export declare function isExpectedMigrationCliError(error: unknown): boolean;
export {};
//# sourceMappingURL=migrate.d.ts.map