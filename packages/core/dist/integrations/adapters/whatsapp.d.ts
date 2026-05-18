import type { PlatformAdapter } from "../types.js";
/**
 * Create a WhatsApp Cloud API platform adapter.
 *
 * Required env vars:
 * - WHATSAPP_ACCESS_TOKEN — Permanent access token from Meta
 * - WHATSAPP_VERIFY_TOKEN — Custom token for webhook verification
 * - WHATSAPP_PHONE_NUMBER_ID — Phone number ID from Meta dashboard
 *
 * Optional env vars:
 * - WHATSAPP_APP_SECRET — App secret for signature verification
 */
export declare function whatsappAdapter(): PlatformAdapter;
//# sourceMappingURL=whatsapp.d.ts.map