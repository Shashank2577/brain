import { IconChartBar } from "@tabler/icons-react";
import { useMetrics } from "@/hooks/use-metrics";

export function meta() {
  return [
    { title: "<Name>" },
    {
      name: "description",
      content: "<Name> — analytics dashboard scaffolded with agent-native.",
    },
  ];
}

export default function DashboardIndex() {
  const { data, isLoading } = useMetrics();
  const metrics = data?.metrics ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center gap-3">
        <IconChartBar size={28} className="text-primary" />
        <div>
          <h1 className="text-2xl font-semibold"><Name></h1>
          <p className="text-sm text-muted-foreground">
            Dashboard starter — read-only metric cards. Add your own
            actions and queries to wire real data.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading metrics…
        </div>
      ) : metrics.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No metrics yet. Insert rows into <code className="rounded bg-muted px-1"><name>_items</code> or ask the agent.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="rounded-md border border-border bg-card p-4"
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {metric.label}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {metric.value || "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
