export declare function isGitRepo(cwd: string): boolean;
export declare function hasUncommittedChanges(cwd: string): boolean;
export declare function getUncommittedStatus(cwd: string): string | null;
export declare function createCheckpoint(cwd: string, message: string): string | null;
export declare function restoreToCheckpoint(cwd: string, sha: string): boolean;
export declare function getChangedFileNames(cwd: string): string[];
export declare function getCurrentHead(cwd: string): string | null;
//# sourceMappingURL=service.d.ts.map