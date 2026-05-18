import type { PlatformAdapter } from "../types.js";
/**
 * Create a Slack platform adapter.
 *
 * Required env vars:
 * - SLACK_BOT_TOKEN — Bot user OAuth token (xoxb-...)
 * - SLACK_SIGNING_SECRET — Used to verify webhook signatures
 *
 * Optional env vars:
 * - SLACK_ALLOWED_TEAM_IDS — Comma-separated list of Slack workspace
 *   `team_id` values (e.g. "T012ABCDEF,T034GHIJKL") that this deployment
 *   accepts events from. Required in production and strongly recommended
 *   to prevent cross-workspace event injection (H1 in the webhook audit):
 *   the global `SLACK_SIGNING_SECRET` is the same key for every workspace
 *   the app is installed to, so without an allowlist any installed
 *   workspace can drive the agent. When unset the adapter accepts events
 *   from any workspace in development, but rejects events in production.
 * - SLACK_ALLOWED_API_APP_IDS — Comma-separated list of Slack app IDs
 *   (`api_app_id`) to additionally pin events to. Useful when the same
 *   signing secret rotation surfaces multiple app installs.
 */
export declare function slackAdapter(): PlatformAdapter;
//# sourceMappingURL=slack.d.ts.map