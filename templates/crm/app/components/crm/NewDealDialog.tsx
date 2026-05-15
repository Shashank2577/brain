import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContacts, useCreateDeal } from "@/lib/api";
import type { DEAL_STAGES } from "@shared/schemas";

const STAGES: Array<typeof DEAL_STAGES[number]> = [
  "lead",
  "qualified",
  "proposal",
  "won",
  "lost",
];

export function NewDealDialog({
  open,
  onOpenChange,
  defaultContactId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContactId?: string;
}) {
  const { data: contacts = [] } = useContacts();
  const [contactId, setContactId] = useState(defaultContactId ?? "");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<typeof DEAL_STAGES[number]>("lead");
  const createDeal = useCreateDeal();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(amount || "0") * 100);
    try {
      await createDeal.mutateAsync({
        contactId,
        title,
        amount: cents,
        stage,
      });
      toast.success(`Added deal "${title}"`);
      setTitle("");
      setAmount("");
      setStage("lead");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create deal",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New deal</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label htmlFor="contact">Contact</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger id="contact">
                  <SelectValue placeholder="Pick a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` · ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Acme — Pro plan"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="100"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={stage}
                  onValueChange={(v) =>
                    setStage(v as typeof DEAL_STAGES[number])
                  }
                >
                  <SelectTrigger id="stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createDeal.isPending || !contactId || !title}
            >
              {createDeal.isPending ? "Adding…" : "Add deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
