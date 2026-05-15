import { useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { Deal, DEAL_STAGES } from "@shared/schemas";

export function DealKanban({
  deals,
  stages,
  onMove,
}: {
  deals: Deal[];
  stages: Array<{ id: typeof DEAL_STAGES[number]; label: string }>;
  onMove: (dealId: string, stage: typeof DEAL_STAGES[number]) => void;
}) {
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.id);
        const total = stageDeals.reduce((s, d) => s + d.amount, 0);
        return (
          <div
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage.id);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => {
              e.preventDefault();
              const dealId = e.dataTransfer.getData("text/plain");
              if (dealId) onMove(dealId, stage.id);
              setDragOverStage(null);
            }}
            className={cn(
              "flex flex-col rounded-md border border-border bg-muted/20 p-2 transition-colors",
              dragOverStage === stage.id && "bg-primary/10",
            )}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stage.label}
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {stageDeals.length}
              </Badge>
            </div>
            <div className="mb-2 px-1 text-xs text-muted-foreground">
              {formatCurrency(total)}
            </div>
            <div className="space-y-2">
              {stageDeals.map((deal) => (
                <Link
                  key={deal.id}
                  to={`/deals/${deal.id}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", deal.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="block"
                >
                  <Card className="cursor-grab p-3 transition-shadow hover:shadow-md active:cursor-grabbing">
                    <div className="text-sm font-medium">{deal.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(deal.amount)}
                    </div>
                  </Card>
                </Link>
              ))}
              {stageDeals.length === 0 && (
                <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                  Drop a deal here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
