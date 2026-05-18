import type { PlatformAdapter } from "../types.js";
/**
 * Create an Email platform adapter for inbound/outbound email via
 * Resend or SendGrid webhooks.
 *
 * Required env vars:
 * - EMAIL_AGENT_ADDRESS — The email address the agent receives mail at
 *
 * One of these must also be set (checked via isEmailConfigured()):
 * - RESEND_API_KEY — For sending/receiving via Resend
 * - SENDGRID_API_KEY — For sending/receiving via SendGrid
 *
 * Optional:
 * - EMAIL_INBOUND_WEBHOOK_SECRET — Webhook signature verification secret
 */
export declare function emailAdapter(): PlatformAdapter;
//# sourceMappingURL=email.d.ts.map