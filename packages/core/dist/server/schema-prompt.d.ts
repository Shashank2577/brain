/** Manually drop the cache — useful from tests or after running a migration. */
export declare function invalidateSchemaPromptCache(): void;
/**
 * Build the `<sql-database>` block appended to the system prompt on every turn.
 *
 * `owner` and `orgId` come from the per-request context (AGENT_USER_EMAIL /
 * AGENT_ORG_ID) and are surfaced so the agent knows who it is acting on behalf
 * of — and understands that rows are already filtered for that identity.
 */
export declare function loadSchemaPromptBlock(opts: {
    owner?: string | null;
    orgId?: string | null;
    /** If true, mention db-query/db-exec/db-patch/db-schema as available tools. */
    hasRawDbTools?: boolean;
}): Promise<string>;
//# sourceMappingURL=schema-prompt.d.ts.map