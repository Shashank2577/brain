import { type ActionEntry } from "../agent/production-agent.js";
export interface GoogleDocsPollerOptions {
    /** Polling interval in milliseconds (fallback mode). Default: 30000 (30s) */
    intervalMs?: number;
    /** Trigger keyword in comments. Default: "@agent" (case-insensitive) */
    triggerKeyword?: string;
    /** System prompt for the agent */
    systemPrompt: string;
    /** Action entries for the agent */
    actions: Record<string, ActionEntry>;
    /** Model to use */
    model: string;
    /** Anthropic API key */
    apiKey: string;
    /** Thread owner email */
    ownerEmail: string;
    /** Webhook URL for push mode (set by plugin from WEBHOOK_BASE_URL) */
    webhookUrl?: string;
}
/**
 * Register a Google Drive changes.watch channel so Google pushes
 * notifications to our webhook instead of us polling.
 *
 * Returns true if the watch was registered successfully.
 */
export declare function registerWatch(webhookUrl: string): Promise<boolean>;
/**
 * Process pending Drive changes — called by both push notifications and polling.
 * Fetches changes since the last page token, finds Google Docs that changed,
 * and checks their comments for agent mentions.
 */
export declare function processChanges(options: GoogleDocsPollerOptions): Promise<void>;
/**
 * Handle a push notification from Google Drive changes.watch.
 * Called from the integration webhook route.
 */
export declare function handlePushNotification(): Promise<void>;
/**
 * Start the Google Docs integration.
 *
 * Hybrid approach:
 * 1. Attempts to register a Google Drive changes.watch webhook for
 *    near-instant push notifications (~seconds latency)
 * 2. Falls back to polling if the watch registration fails
 *    (e.g. domain not verified, local dev)
 * 3. Even in push mode, polls at a slow interval (5min) as a safety net
 *    in case a push notification is missed
 */
export declare function startGoogleDocsPoller(options: GoogleDocsPollerOptions): Promise<void>;
/**
 * Stop the Google Docs integration.
 */
export declare function stopGoogleDocsPoller(): Promise<void>;
//# sourceMappingURL=google-docs-poller.d.ts.map