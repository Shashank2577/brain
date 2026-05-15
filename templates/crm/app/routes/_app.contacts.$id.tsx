import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  IconArrowLeft,
  IconCalendar,
  IconMail,
  IconTrash,
} from "@tabler/icons-react";
import { useContact, useDeals, useDeleteContact } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { ActivityRow } from "@/components/crm/ActivityRow";
import { LogOutreachDialog } from "@/components/crm/LogOutreachDialog";
import { ScheduleMeetingDialog } from "@/components/crm/ScheduleMeetingDialog";
import { NewDealDialog } from "@/components/crm/NewDealDialog";

export default function ContactDetailRoute() {
  const params = useParams();
  const id = params.id ?? "";
  const navigate = useNavigate();
  const { data, isLoading } = useContact(id);
  const { data: deals = [] } = useDeals({ contactId: id });
  const deleteContact = useDeleteContact();

  const [outreachOpen, setOutreachOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);

  if (isLoading) {
    return <div className="px-6 py-8 text-sm">Loading…</div>;
  }
  if (!data) {
    return (
      <div className="px-6 py-8 text-sm text-muted-foreground">
        Contact not found.{" "}
        <Link to="/contacts" className="text-primary hover:underline">
          Back to contacts
        </Link>
      </div>
    );
  }

  const { contact, recentActivity } = data;

  async function handleDelete() {
    await deleteContact.mutateAsync(id);
    navigate("/contacts");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <Link
        to="/contacts"
        className="inline-flex items-center text-xs text-muted-foreground hover:underline"
      >
        <IconArrowLeft className="mr-1 h-3 w-3" />
        All contacts
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {contact.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <a
                href={`mailto:${contact.email}`}
                className="hover:underline"
              >
                {contact.email}
              </a>
              {contact.company && (
                <>
                  <span>·</span>
                  <span>{contact.company}</span>
                </>
              )}
              {contact.phone && (
                <>
                  <span>·</span>
                  <span>{contact.phone}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOutreachOpen(true)}>
              <IconMail className="mr-2 h-4 w-4" />
              Log outreach
            </Button>
            <Button variant="outline" onClick={() => setMeetingOpen(true)}>
              <IconCalendar className="mr-2 h-4 w-4" />
              Schedule meeting
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              aria-label="Delete contact"
            >
              <IconTrash className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        {contact.notes && (
          <p className="mt-4 rounded-md bg-muted/40 p-3 text-sm">
            {contact.notes}
          </p>
        )}
      </Card>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">
            Activity ({recentActivity.length})
          </TabsTrigger>
          <TabsTrigger value="deals">Deals ({deals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <Card>
            {recentActivity.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No activity yet. Log an outreach or schedule a meeting to start
                the timeline.
              </div>
            ) : (
              recentActivity.map((a) => (
                <ActivityRow
                  key={a.id}
                  activity={a}
                  className="border-b border-border last:border-b-0"
                />
              ))
            )}
          </Card>
        </TabsContent>

        <TabsContent value="deals" className="mt-4 space-y-2">
          <div className="flex items-center justify-end">
            <Button size="sm" onClick={() => setNewDealOpen(true)}>
              New deal
            </Button>
          </div>
          <Card>
            {deals.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No deals on this contact yet.
              </div>
            ) : (
              deals.map((d) => (
                <Link
                  key={d.id}
                  to={`/deals/${d.id}`}
                  className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40"
                >
                  <div>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(d.amount)}
                    </div>
                  </div>
                  <Badge>{d.stage}</Badge>
                </Link>
              ))
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <LogOutreachDialog
        open={outreachOpen}
        onOpenChange={setOutreachOpen}
        contactId={contact.id}
        contactEmail={contact.email}
        contactName={contact.name}
      />
      <ScheduleMeetingDialog
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
        contactId={contact.id}
        contactName={contact.name}
      />
      <NewDealDialog
        open={newDealOpen}
        onOpenChange={setNewDealOpen}
        defaultContactId={contact.id}
      />
    </div>
  );
}
