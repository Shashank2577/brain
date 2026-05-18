/**
 * Settings helpers for use in scripts.
 *
 * Persistent key-value settings stored in the settings SQL table.
 */
export declare function readSetting(key: string): Promise<Record<string, unknown> | null>;
export declare function writeSetting(key: string, value: Record<string, unknown>): Promise<void>;
export declare function removeSetting(key: string): Promise<boolean>;
//# sourceMappingURL=script-helpers.d.ts.map