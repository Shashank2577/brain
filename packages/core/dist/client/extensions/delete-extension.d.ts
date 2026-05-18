import type { QueryClient } from "@tanstack/react-query";
export interface ExtensionDeleteTarget {
    id: string;
    canDelete?: boolean | null;
}
export type ExtensionDeleteResult = {
    mode: "deleted" | "hidden";
};
export declare function hideExtensionForCurrentUser(extensionId: string): Promise<ExtensionDeleteResult>;
export declare function deleteOrHideExtension(extension: ExtensionDeleteTarget): Promise<ExtensionDeleteResult>;
export declare function invalidateExtensionRemoval(queryClient: QueryClient, extensionId: string): void;
//# sourceMappingURL=delete-extension.d.ts.map