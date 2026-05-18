/**
 * Append a Builder CTA markdown link to gateway errors that users can fix
 * outside the app. Used by both
 * chat SSE consumers (`sse-event-processor.ts` and `useProductionAgent.ts`)
 * to keep the copy in lockstep.
 *
 * `upgradeUrl` comes from the gateway response body and ends up interpolated
 * into markdown, so we validate it's a plain https URL with no characters
 * that would escape the `[...](url)` link target. Only `)` and whitespace
 * terminate the link target — `(`, `<`, `>` are fine inside it — so the
 * regex stays narrow; the gateway may emit URLs containing `(`
 * (e.g. `?ref=Acme%20(staging)`) and we don't want to reject them.
 */
export declare const BUILDER_SPACE_SETTINGS_URL = "https://builder.io/account/space";
export declare const NEW_CHAT_ACTION_HREF = "agent-native:new-chat";
export declare function formatChatErrorText(errorMessage: string, upgradeUrl?: string, errorCode?: string): string;
export interface NormalizedChatError {
    message: string;
    details?: string;
}
export declare function normalizeChatError(errorMessage: string): NormalizedChatError;
//# sourceMappingURL=error-format.d.ts.map