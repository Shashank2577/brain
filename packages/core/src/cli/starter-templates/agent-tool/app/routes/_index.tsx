import { IconRobot, IconArrowRight } from "@tabler/icons-react";

export function meta() {
  return [
    { title: "<Name>" },
    {
      name: "description",
      content:
        "<Name> — an agentic service mini-app. Backend-first; minimal UI by design.",
    },
  ];
}

// ADR-001 exception case — "agentic service" mini-apps. The value lives
// in the capability surface; the UI is intentionally lightweight.
const CAPABILITIES = [
  {
    id: "<name>.run-task",
    description: "Run an agent-tool task and record its result.",
  },
  {
    id: "<name>.list-tasks",
    description: "List previously-run tasks for the current user.",
  },
];

export default function AgentToolIndex() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="flex items-start gap-3">
        <IconRobot size={32} className="text-primary" />
        <div>
          <h1 className="text-2xl font-semibold"><Name></h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Agent-tool services. Invoke these capabilities from any sibling
            app or the agent chat.
          </p>
        </div>
      </header>

      <section className="rounded-md border border-border bg-card">
        <header className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Agent-tool services: {CAPABILITIES.map((c) => c.id).join(", ")}
        </header>
        <ul className="divide-y divide-border">
          {CAPABILITIES.map((cap) => (
            <li key={cap.id} className="flex items-center gap-3 px-4 py-3">
              <IconArrowRight size={14} className="text-muted-foreground" />
              <div>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                  {cap.id}
                </code>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cap.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
