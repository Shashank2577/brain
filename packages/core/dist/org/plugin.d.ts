type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
/**
 * Mounts the org REST routes under `/_agent-native/org/*` and runs the org
 * module's migrations.
 *
 * Routes:
 *   GET    /_agent-native/org/me                          — current user's active org + invites
 *   POST   /_agent-native/org                             — create organization
 *   PATCH  /_agent-native/org                             — rename organization (owner/admin)
 *   PUT    /_agent-native/org/switch                      — switch active org
 *   GET    /_agent-native/org/members                     — list members of active org
 *   DELETE /_agent-native/org/members/:email              — remove member (owner/admin only)
 *   GET    /_agent-native/org/invitations                 — list pending invites
 *   POST   /_agent-native/org/invitations                 — invite by email
 *   POST   /_agent-native/org/invitations/:id/accept      — accept an invitation
 *   POST   /_agent-native/org/join-by-domain              — join org via email domain match
 *   PUT    /_agent-native/org/domain                      — set/clear allowed email domain (owner/admin)
 *   PUT    /_agent-native/org/a2a-secret                  — regenerate or set A2A secret (owner/admin)
 *   POST   /_agent-native/org/a2a-secret/sync             — push secret to all connected apps (owner/admin)
 *   POST   /_agent-native/org/a2a-secret/receive          — accept a peer's secret push (JWT-auth, no session)
 */
export declare function createOrgPlugin(): NitroPluginDef;
/**
 * Default org plugin — mount with no configuration needed.
 *
 * Auto-mounted by the framework when a template doesn't ship `server/plugins/org.ts`.
 * To override, create your own plugin file using `createOrgPlugin()` or a
 * completely custom implementation.
 */
export declare const defaultOrgPlugin: NitroPluginDef;
export {};
//# sourceMappingURL=plugin.d.ts.map