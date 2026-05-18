import type { IncomingMessage, PlatformAdapter } from "@agent-native/core/server";
export declare function identityKeyForIncoming(incoming: IncomingMessage): string | null;
export declare function resolveDispatchOwner(incoming: IncomingMessage): Promise<string>;
export declare function beforeDispatchProcess(incoming: IncomingMessage, _adapter: PlatformAdapter): Promise<{
    handled: true;
    responseText?: string;
} | {
    handled: false;
}>;
//# sourceMappingURL=dispatch-integrations.d.ts.map