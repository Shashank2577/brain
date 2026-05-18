import { EventEmitter } from "events";
export declare function getSettingsEmitter(): EventEmitter;
export declare function getSetting(key: string): Promise<Record<string, unknown> | null>;
export interface StoreWriteOptions {
    /** Tag identifying who initiated this write (e.g. a tab ID). */
    requestSource?: string;
}
export declare function putSetting(key: string, value: Record<string, unknown>, options?: StoreWriteOptions): Promise<void>;
export declare function deleteSetting(key: string, options?: StoreWriteOptions): Promise<boolean>;
export declare function getAllSettings(): Promise<Record<string, Record<string, unknown>>>;
//# sourceMappingURL=store.d.ts.map