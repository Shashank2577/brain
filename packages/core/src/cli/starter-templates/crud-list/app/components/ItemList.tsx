import { Link, useParams } from "react-router";
import { useItems } from "@/hooks/use-items";

export function ItemList() {
  const { id: activeId } = useParams<{ id?: string }>();
  const { data, isLoading } = useItems();
  const items = data?.items ?? [];

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-background">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Name>
        </h2>
      </header>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            Loading items…
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No items yet. Ask the agent to create one.
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              to={`/${item.id}`}
              className={`block border-b border-border/60 px-4 py-3 transition hover:bg-accent/50 ${
                item.id === activeId ? "bg-accent" : ""
              }`}
            >
              <div className="truncate text-sm font-medium">{item.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {item.body || "—"}
              </div>
            </Link>
          ))
        )}
      </div>
    </aside>
  );
}
