import { createAuthPlugin } from "@agent-native/core/server";

export default createAuthPlugin({
  marketing: {
    appName: "Agent-Native Notes",
    tagline:
      "The canonical text-snippet store — capture thoughts, jot meeting notes, share with your team. Other apps in the workspace write here whenever they need to persist text owned by you.",
    features: [
      "Notes the agent can create, search, pin, and archive on your behalf",
      "Source-tagged so notes from meetings, tasks, mail, and CRM stay linked",
      "Identity-propagating writes — sibling apps create notes as the user, not as themselves",
    ],
  },
  publicPaths: [
    // React Router's lazy route-discovery endpoint must be public
    "/__manifest",
  ],
});
