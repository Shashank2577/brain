import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { useDeals, useUpdateDealStage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DealKanban } from "@/components/crm/DealKanban";
import { NewDealDialog } from "@/components/crm/NewDealDialog";
import { formatCurrency } from "@/lib/utils";
import type { DEAL_STAGES } from "@shared/schemas";

export function meta() {
  return [{ title: "Pipeline · CRM" }];
}

const STAGES: Array<{
  id: typeof DEAL_STAGES[number];
  label: string;
}> = [
  { id: "lead", label: "Lead" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export default function DealsRoute() {
  const [open, setOpen] = useState(false);
  const { data: deals = [] } = useDeals();
  const updateStage = useUpdateDealStage();

  const totalOpen = deals
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-4 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {deals.length} {deals.length === 1 ? "deal" : "deals"} ·{" "}
            {formatCurrency(totalOpen)} open
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          New deal
        </Button>
      </header>

      <DealKanban
        deals={deals}
        stages={STAGES}
        onMove={(dealId, stage) =>
          updateStage.mutate({ dealId, stage })
        }
      />

      <NewDealDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
