import { createAuthPlugin } from "@agent-native/core/server";
import { getDispatchConfig } from "../index.js";

const DEFAULT_MARKETING = {
  appName: "Agent-Native Dispatch",
  tagline:
    "Your AI agent manages secrets, orchestrates other agents, and routes messages across your workspace.",
  features: [
    "Centralized vault for secrets with granular per-app grants",
    "Cross-agent orchestration and delegation to specialist apps",
    "Slack and Telegram routing with approval workflows",
  ],
} as const;

/**
 * Defer config + plugin construction until the Nitro plugin actually fires.
 * This way `setupDispatch(config)` can run after plugin module-load order
 * (Nitro doesn't guarantee load order across plugin files) and still feed
 * `googleOnly` / `marketing` into `createAuthPlugin`.
 */
// Union of all Google scopes needed by every first-party app in the workspace.
// When a user signs in through Dispatch (the workspace entry point in desktop
// mode), one OAuth consent covers all apps — no per-app "Connect Google" needed.
// Web deployments can still override per-template, but in Electron this is the
// single sign-in that grants everything.
const WORKSPACE_GOOGLE_SCOPES = [
  // Identity — all apps
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  // Google Contacts / directory — Calendar, Mail
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/contacts.other.readonly",
  "https://www.googleapis.com/auth/directory.readonly",
  // Google Calendar — Calendar, Meetings, Mail (meeting invites)
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  // Gmail — Mail
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.settings.basic",
];

const dispatchAuthPlugin = async (nitroApp: any) => {
  const { auth: authConfig = {} } = getDispatchConfig();
  const googleOnly = authConfig.googleOnly ?? false;
  const marketing =
    (authConfig.marketing as Record<string, unknown> | undefined) ??
    DEFAULT_MARKETING;
  const plugin = createAuthPlugin({
    googleOnly,
    marketing: marketing as any,
    // In workspace / desktop mode, dispatch owns sign-in for all apps.
    // Request every scope upfront so other apps find their tokens already
    // granted without showing their own "Connect Google" prompts.
    googleScopes: WORKSPACE_GOOGLE_SCOPES,
  });
  return plugin(nitroApp);
};

export default dispatchAuthPlugin;
