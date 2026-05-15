import { useState } from "react";
import { Link } from "react-router";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useContacts } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NewContactDialog } from "@/components/crm/NewContactDialog";

export function meta() {
  return [{ title: "Contacts · CRM" }];
}

export default function ContactsListRoute() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data: contacts = [], isLoading } = useContacts(q || undefined);

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length} {contacts.length === 1 ? "person" : "people"}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          New contact
        </Button>
      </header>

      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, email, or company"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Phone</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/contacts/${c.id}`}
                    className="font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.company ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.phone ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contacts.length === 0 && !isLoading && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {q
              ? `No contacts match "${q}".`
              : "No contacts yet — add your first one."}
          </div>
        )}
      </Card>

      <NewContactDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
