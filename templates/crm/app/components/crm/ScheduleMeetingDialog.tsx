import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useScheduleMeeting } from "@/lib/api";

function defaultStart() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}
function defaultEnd() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 30, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  contactId,
  contactName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
}) {
  const [title, setTitle] = useState(`Meeting with ${contactName}`);
  const [startsAt, setStartsAt] = useState(defaultStart());
  const [endsAt, setEndsAt] = useState(defaultEnd());
  const scheduleMeeting = useScheduleMeeting();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await scheduleMeeting.mutateAsync({
        contactId,
        title,
        startsAt: new Date(startsAt).getTime(),
        endsAt: new Date(endsAt).getTime(),
      });
      toast.success(
        `Meeting booked · event ${result.eventId.slice(0, 12)}…`,
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to schedule meeting",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Schedule meeting</DialogTitle>
            <DialogDescription>
              Books a calendar event with {contactName} and logs it on the
              contact's timeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label htmlFor="m-title">Title</Label>
              <Input
                id="m-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="m-start">Starts</Label>
                <Input
                  id="m-start"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-end">Ends</Label>
                <Input
                  id="m-end"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  required
                />
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
            <Button type="submit" disabled={scheduleMeeting.isPending}>
              {scheduleMeeting.isPending ? "Booking…" : "Book meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
