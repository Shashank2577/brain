export declare function ensureSlotTables(): Promise<void>;
export interface ExtensionSlotRow {
    id: string;
    extensionId: string;
    slotId: string;
    config: string | null;
    createdAt: string;
}
export interface ExtensionSlotInstallRow {
    id: string;
    extensionId: string;
    slotId: string;
    ownerEmail: string;
    orgId: string | null;
    position: number;
    config: string | null;
    createdAt: string;
    updatedAt: string;
}
/**
 * Declare that a extension can render in a slot. Caller must have editor access on
 * the extension (only people who can edit a extension can change its slot targets).
 */
export declare function addExtensionSlotTarget(extensionId: string, slotId: string, config?: string): Promise<ExtensionSlotRow>;
export declare function removeExtensionSlotTarget(extensionId: string, slotId: string): Promise<boolean>;
export declare function listSlotsForExtension(extensionId: string): Promise<ExtensionSlotRow[]>;
/**
 * List extensions that declare a slot — but only extensions the current user has access
 * to. Joins through the extensions access filter.
 */
export declare function listExtensionsForSlot(slotId: string): Promise<Array<{
    extensionId: string;
    name: string;
    description: string;
    icon: string | null;
    config: string | null;
}>>;
/**
 * Install a extension into a slot for the current user. Verifies the user has at
 * least viewer access to the extension. Idempotent — re-installing returns the
 * existing row.
 */
export declare function installExtensionSlot(extensionId: string, slotId: string, opts?: {
    position?: number;
    config?: string;
}): Promise<ExtensionSlotInstallRow>;
export declare function uninstallExtensionSlot(extensionId: string, slotId: string): Promise<boolean>;
/**
 * List the current user's installs for a slot. Joins with `extensions` so the
 * caller gets extension name/description/icon/updatedAt without a second query.
 * Extensions the user has lost access to are silently skipped (lazy garbage
 * collection).
 */
export declare function listSlotInstallsForUser(slotId: string): Promise<Array<{
    installId: string;
    extensionId: string;
    name: string;
    description: string;
    icon: string | null;
    updatedAt: string;
    position: number;
    config: string | null;
}>>;
/** Delete every slot/install row referencing a extension. Called from deleteExtension. */
export declare function cascadeDeleteExtensionSlots(extensionId: string): Promise<void>;
//# sourceMappingURL=store.d.ts.map