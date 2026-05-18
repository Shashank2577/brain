/**
 * For *.builder.io / *.builder.my the parent origin alone is sufficient — those
 * are Builder-owned hosts and any iframe they load is by definition a Builder
 * editor session. For localhost we still require the legacy `?builder.*` query
 * params, because "parent is localhost" can mean anything in dev. The params
 * check existed historically as a belt-and-suspenders signal, but Builder's
 * Interact mode tunnels straight to the iframe URL without appending them, so
 * requiring them everywhere caused `isInBuilderFrame()` to return false for
 * real Builder editor sessions and `HomeChatPanel` submissions silently fell
 * through to `agentNative.submitChat` (which Builder ignores).
 */
export declare function getBuilderParentOrigin(): string | null;
export declare function isInBuilderFrame(): boolean;
export declare function shouldParentFrameOwnAgentPanel(): boolean;
export declare function isTrustedBuilderMessage(event: MessageEvent): boolean;
export interface BuilderChatMessage {
    message: string;
    context?: string;
    submit?: boolean;
}
export declare function sendToBuilderChat(opts: BuilderChatMessage): boolean;
/**
 * Returns true if `text` looks like a "build me an app/agent" request that
 * should hand off to the code-writing agent (Builder, local code agent, etc.)
 * rather than be answered by the embedded app's domain agent.
 *
 * Conservative: requires both an imperative build verb AND an explicit
 * "app" / "agent" target word in the same sentence. "Build me a tool",
 * "build a recurring job", "create a destination" do not match — they
 * don't end in "app"/"agent" so they stay on the local agent. "Build me
 * an email app" / "create me an email agent" do match — the target
 * word is "app" / "agent", not "email".
 */
export declare function isBuildAppOrAgentRequest(text: string | undefined): boolean;
/**
 * If the user typed a "build me an app/agent" prompt while running inside
 * the Builder.io webview/iframe, hand the prompt up to the parent Builder
 * chat via `builder.submitChat`. Returns true when delegated.
 *
 * Why: Builder is the code-writing agent. When a workspace app (Dispatch,
 * Mail, etc.) is mounted inside Builder's webview and the user asks the
 * embedded chat to "build an app", the user almost certainly means the
 * already-open Builder chat session — not a separate Builder agent run
 * spawned through `start-workspace-app-creation`.
 */
export declare function tryDelegateBuildRequestToBuilder(text: string | undefined): boolean;
//# sourceMappingURL=builder-frame.d.ts.map