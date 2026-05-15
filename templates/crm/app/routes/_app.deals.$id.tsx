import { Link, useParams } from "react-router";
import { IconArrowLeft } from "@tabler/icons-react";
import { useDeals, useActivities, useUpdateDealStage } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityRow } from "@/components/crm/ActivityRow";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DEAL_STAGES } from "@shared/schemas";

export default function DealDetailRoute() {
  const params = useParams();
  const id = params.id ?? "";
  const { data: deals = [] } = useDeals();
  const deal = deals.find((d) => d.id === id);
  const { data: activities = [] } = useActivities({ dealId: id });
  const updateStage = useUpdateDealStage();

  if (!deal) {
    return (
      <div className="px-6 py-8 text-sm text-muted-foreground">
        Deal not found.{" "}
        <Link to="/deals" className="text-primary hover:underline">
          Back to pipeline
        </Link>
      </div>
    );
  }

  const stages: Array<typeof DEAL_STAGES[number]> = [
    "lead",
    "qualified",
    "proposal",
    "won",
    "lost",
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <Link
        to="/deals"
        className="inline-flex items-center text-xs text-muted-foreground hover:underline"
      >
        <IconArrowLeft className="mr-1 h-3 w-3" />
        Pipeline
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {deal.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatCurrency(deal.amount)}
              {deal.closeDate ? ` · close ${formatDate(deal.closeDate)}` : ""}
            </p>
          </div>
          <Badge>{deal.stage}</Badge>
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Move to stage
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {stages.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === deal.stage ? "default" : "outline"}
                disabled={s === deal.stage || updateStage.isPending}
                onClick={() =>
                  updateStage.mutate({ dealId: deal.id, stage: s })
                }
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Link
            to={`/contacts/${deal.contactId}`}
            className="text-sm text-primary hover:underline"
          >
            View contact →
          </Link>
        </div>
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Activity on this deal</h2>
        <Card>
          {activities.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No activity on this deal yet.
            </div>
          ) : (
            activities.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                className="border-b border-border last:border-b-0"
              />
            ))
          )}
        </Card>
      </section>
    </div>
  );
}
