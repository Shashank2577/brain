import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
} from "@agent-native/core/server";
import actionsRegistry from "../../.generated/actions-registry.js";
import { getOrgContext } from "@agent-native/core/org";

export default createAgentChatPlugin({
  appId: "tasks",
  actions: loadActionsFromStaticRegistry(actionsRegistry),
  resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
  mentionProviders: async () => {
    const { getDb } = await import("../db/index.js");
    const { tasks, taskShares } = await import("../db/schema.js");
    const { desc, and, like } = await import("drizzle-orm");
    const { accessFilter } = await import("@agent-native/core/sharing");
    return {
      tasks: {
        label: "Tasks",
        icon: "checkbox",
        search: async (query: string) => {
          const db = getDb();
          const access = accessFilter(tasks, taskShares);
          const rows = query
            ? await db
                .select()
                .from(tasks)
                .where(and(access, like(tasks.text, `%${query}%`)))
                .limit(15)
            : await db
                .select()
                .from(tasks)
                .where(access)
                .orderBy(desc(tasks.updatedAt))
                .limit(15);
          return rows.map((task) => ({
            id: task.id,
            label: task.text.slice(0, 80),
            description: task.completedAt ? "Completed" : "Active",
            icon: "checkbox" as const,
            refType: "task",
            refId: task.id,
          }));
        },
      },
    };
  },
});
