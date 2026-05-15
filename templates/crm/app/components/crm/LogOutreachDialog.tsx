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
import { Textarea } from "@/components/ui/textarea";
import { useLogOutreach } from "@/lib/api";

export function LogOutreachDialog({
  open,
  onOpenChange,
  contactId,
  contactEmail,
  contactName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactEmail: string;
  contactName: string;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const logOutreach = useLogOutreach();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await logOutreach.mutateAsync({
        contactId,
        subject,
        body,
      });
      toast.success(
        `Email sent and logged · message ${result.messageId.slice(0, 12)}…`,
      );
      setSubject("");
      setBody("");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to log outreach",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log outreach</DialogTitle>
            <DialogDescription>
              Sends an email to {contactName} via Mail, then writes an
              activity row so the timeline shows it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label htmlFor="to">To</Label>
              <Input id="to" value={contactEmail} disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="Hi …"
              />
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
            <Button type="submit" disabled={logOutreach.isPending || !subject}>
              {logOutreach.isPending ? "Sending…" : "Send & log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
