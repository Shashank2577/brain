import { createAuthPlugin } from "@agent-native/core/server";

export default createAuthPlugin({
  marketing: {
    appName: "Agent-Native Tasks",
    tagline: "A lightweight todo app the agent can fill, complete, and link.",
    features: [
      "Capture tasks in one line and promote them into notes with one toggle",
      "Filter by active / completed / all and group by due date",
      "Agent surfaces action items from meetings, CRM, and email automatically",
    ],
  },
});
