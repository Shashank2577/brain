import { createTemplateServer } from "@agent-native/core/server/template-server";

// Canonical SSR catch-all. Owned by the framework via createTemplateServer
// so per-template drift (the bug that left notes/tasks/crm/meetings without
// this route and produced "NitroViteError: No fetch handler exported from
// virtual:react-router/server-build") becomes structurally impossible.
export default createTemplateServer({
  templateId: "tasks",
  getBuild: () => import("virtual:react-router/server-build"),
});
