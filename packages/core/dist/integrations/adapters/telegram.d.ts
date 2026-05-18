import type { PlatformAdapter } from "../types.js";
/**
 * Create a Telegram platform adapter.
 *
 * Required env vars:
 * - TELEGRAM_BOT_TOKEN — Bot token from @BotFather
 *
 * Optional env vars:
 * - TELEGRAM_WEBHOOK_SECRET — Secret token for webhook verification
 */
export declare function telegramAdapter(): PlatformAdapter;
//# sourceMappingURL=telegram.d.ts.map