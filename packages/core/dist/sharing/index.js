/**
 * Framework-level sharing / privacy primitive.
 *
 * Templates make their resource tables ownable and register them here so the
 * shared share actions and UI work end-to-end. See
 * `.agents/skills/sharing/SKILL.md` for the full pattern.
 */
export { ownableColumns, createSharesTable, roleSatisfies, ROLE_RANK, } from "./schema.js";
export { registerShareableResource, getShareableResource, requireShareableResource, listShareableResources, } from "./registry.js";
export { accessFilter, resolveAccess, assertAccess, currentAccess, ForbiddenError, } from "./access.js";
//# sourceMappingURL=index.js.map