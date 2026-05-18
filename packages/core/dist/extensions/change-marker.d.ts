export declare const EXTENSION_CHANGE_MARKER_KEY = "__extensions_change__";
export declare const EXTENSION_CHANGE_MARKER_ORG_PREFIX = "__org__:";
export interface ExtensionChangeTarget {
    owner?: string;
    orgId?: string;
}
export declare function extensionChangeMarkerSession(target: ExtensionChangeTarget): string | null;
export declare function extensionChangeMarkerValue(target: ExtensionChangeTarget): Record<string, string>;
export declare function parseExtensionChangeMarker(sessionId: unknown, value: unknown): ExtensionChangeTarget | null;
//# sourceMappingURL=change-marker.d.ts.map