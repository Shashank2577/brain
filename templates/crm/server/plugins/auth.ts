import { createAuthPlugin } from "@agent-native/core/server";

export default createAuthPlugin({
  marketing: {
    appName: "Agent-Native CRM",
    tagline:
      "Track contacts, deals, and every interaction — your AI agent does the legwork while you stay close to the customer.",
    features: [
      "Cross-app orchestrator: emails go through Mail, meetings through Calendar",
      "Activity timeline with refs to the original email / event / note",
      "Drag-and-drop deal pipeline kanban",
    ],
  },
  publicPaths: [
    // React Router's lazy route-discovery endpoint must be public
    "/__manifest",
  ],
});
