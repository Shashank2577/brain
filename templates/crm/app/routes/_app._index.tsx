import { Link } from "react-router";
import { IconPlus } from "@tabler/icons-react";
import { useContacts, useDeals, useActivities } from "@/lib/api";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityRow } from "@/components/crm/ActivityRow";
import { useState } from "react";
import { NewContactDialog } from "@/components/crm/NewContactDialog";

export function meta() {
  return [{ title: "CRM" }];
}

export default function DashboardRoute() {
  const { data: contacts = [] } = useContacts();
  const { data: deals = [] } = useDeals();
  const { data: activities = [] } = useActivities();
  const [newContactOpen, setNewContactOpen] = useState(false);

  const openDeals = deals.filter(
    (d) => d.stage !== "won" && d.stage !== "lost",
  );
  const totalOpenValue = openDeals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Contacts, deals, and the activity that ties them together.
          </p>
        </div>
        <Button onClick={() => setNewContactOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add contact
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Contacts
          </div>
          <div className="mt-1 text-2xl font-semibold">{contacts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Open deals
          </div>
          <div className="mt-1 text-2xl font-semibold">{openDeals.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Open value
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {formatCurrency(totalOpenValue)}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent contacts</h2>
            <Link
              to="/contacts"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <Card>
            {contacts.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/contacts/${c.id}`}
                className="block border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40"
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  {c.email}
                  {c.company ? ` · ${c.company}` : ""}
                </div>
              </Link>
            ))}
            {contacts.length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No contacts yet — add your first one.
              </div>
            )}
          </Card>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">This week</h2>
            <Link to="/deals" className="text-xs text-primary hover:underline">
              View pipeline
            </Link>
          </div>
          <Card>
            {activities.slice(0, 5).map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                className="border-b border-border last:border-b-0"
              />
            ))}
            {activities.length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No activity yet. Log an outreach or schedule a meeting.
              </div>
            )}
          </Card>
        </section>
      </div>

      <NewContactDialog
        open={newContactOpen}
        onOpenChange={setNewContactOpen}
      />
    </div>
  );
}
