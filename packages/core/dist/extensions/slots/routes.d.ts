/**
 * HTTP handler for extension extension-point slots.
 *
 * Mounted at `/_agent-native/slots`. Routes:
 *
 *   GET    /:slotId/installs    — current user's installed widgets for a slot
 *   GET    /:slotId/available   — extensions that declare this slot, scoped to user access
 *   POST   /:slotId/install     — install a extension into a slot (body: { extensionId, position?, config? })
 *   DELETE /:slotId/install/:extensionId — uninstall
 *   GET    /extension/:extensionId        — list slot declarations for a specific extension
 *   POST   /extension/:extensionId        — declare a slot target (body: { slotId, config? })
 *   DELETE /extension/:extensionId/:slotId — remove a slot declaration
 */
export declare function createSlotsHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<unknown>>;
//# sourceMappingURL=routes.d.ts.map