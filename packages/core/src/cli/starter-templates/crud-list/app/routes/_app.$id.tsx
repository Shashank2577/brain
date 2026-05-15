import { useParams } from "react-router";
import { useItem } from "@/hooks/use-items";

export default function ItemDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useItem(id);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Item not found.
      </div>
    );
  }

  return (
    <article className="flex flex-1 flex-col gap-3 px-8 py-6">
      <header>
        <h1 className="text-2xl font-semibold">{data.title}</h1>
        <p className="text-xs text-muted-foreground">
          Updated {new Date(data.updatedAt).toLocaleString()}
        </p>
      </header>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {data.body}
      </div>
    </article>
  );
}
