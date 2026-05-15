import { createAuthPlugin } from "@agent-native/core/server";

export default createAuthPlugin({
  marketing: {
    appName: "Agent-Native Meetings",
    tagline:
      "Granola-style meeting lifecycle — prep notes, live transcript, AI summary, and per-attendee follow-ups, all stitched together.",
    features: [
      "Two-pane meeting view: transcript on the left, AI summary on the right",
      "Calendar-aware: upcoming events show up as meetings ready to start",
      "Action items fan out into the Tasks app and Notes app automatically",
    ],
  },
  publicPaths: [
    // React Router's lazy route-discovery endpoint must be public
    "/__manifest",
  ],
});
