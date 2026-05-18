import { type ExtensionChangeTarget } from "./change-marker.js";
export declare function ensureExtensionsTables(): Promise<void>;
export declare function registerExtensionsShareable(): void;
export interface ExtensionRow {
    id: string;
    name: string;
    description: string;
    content: string;
    icon: string | null;
    createdAt: string;
    updatedAt: string;
    ownerEmail: string;
    orgId: string | null;
    visibility: "private" | "org" | "public";
}
export declare function getExtensionChangeTargets(id: string): Promise<ExtensionChangeTarget[]>;
export declare function notifyExtensionChangeForResource(id: string, beforeTargets?: ExtensionChangeTarget[]): Promise<void>;
export interface ListExtensionsOptions {
    includeHidden?: boolean;
}
export declare function listExtensions(options?: ListExtensionsOptions): Promise<ExtensionRow[]>;
export declare function getExtension(id: string): Promise<ExtensionRow | null>;
export interface CreateExtensionData {
    name: string;
    description?: string;
    content?: string;
    icon?: string;
}
export declare function createExtension(data: CreateExtensionData): Promise<ExtensionRow>;
export interface UpdateExtensionData {
    name?: string;
    description?: string;
    icon?: string;
    /**
     * Extensions cannot be public — `set-resource-visibility` and this store
     * helper both reject `"public"`. The type lists it so the framework's
     * generic share UI compiles, not because it's allowed at runtime.
     */
    visibility?: "private" | "org" | "public";
}
export declare function updateExtension(id: string, data: UpdateExtensionData): Promise<ExtensionRow | null>;
export interface UpdateExtensionContentOpts {
    content?: string;
    patches?: Array<{
        find: string;
        replace: string;
    }>;
}
export declare function updateExtensionContent(id: string, opts: UpdateExtensionContentOpts): Promise<ExtensionRow | null>;
export declare function deleteExtension(id: string): Promise<boolean>;
export declare function getHiddenExtensionIdsForCurrentUser(): Promise<Set<string>>;
export declare function hideExtension(id: string): Promise<boolean>;
export declare function unhideExtension(id: string): Promise<boolean>;
//# sourceMappingURL=store.d.ts.map