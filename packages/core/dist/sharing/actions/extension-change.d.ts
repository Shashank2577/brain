import type { ExtensionChangeTarget } from "../../extensions/change-marker.js";
export declare function getExtensionShareChangeTargets(resourceType: string, resourceId: string): Promise<ExtensionChangeTarget[]>;
export declare function notifyExtensionShareChanged(resourceType: string, resourceId: string, beforeTargets: ExtensionChangeTarget[]): Promise<void>;
//# sourceMappingURL=extension-change.d.ts.map