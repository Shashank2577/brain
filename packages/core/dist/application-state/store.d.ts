import type { StoreWriteOptions } from "../settings/store.js";
export declare function appStateGet(sessionId: string, key: string): Promise<Record<string, unknown> | null>;
export declare function appStatePut(sessionId: string, key: string, value: Record<string, unknown>, options?: StoreWriteOptions): Promise<void>;
export declare function appStateDelete(sessionId: string, key: string, options?: StoreWriteOptions): Promise<boolean>;
export declare function appStateList(sessionId: string, keyPrefix: string): Promise<Array<{
    key: string;
    value: Record<string, unknown>;
}>>;
export declare function appStateDeleteByPrefix(sessionId: string, keyPrefix: string, options?: StoreWriteOptions): Promise<number>;
//# sourceMappingURL=store.d.ts.map