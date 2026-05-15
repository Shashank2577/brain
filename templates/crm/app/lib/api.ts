import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appPath } from "@agent-native/core/client";
import type {
  Contact,
  Deal,
  Activity,
  DEAL_STAGES,
} from "@shared/schemas";

async function postAction<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(appPath(`/_agent-native/actions/${name}`), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Action ${name} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

async function getAction<T>(name: string, params?: Record<string, string>): Promise<T> {
  const qs = params
    ? "?" + new URLSearchParams(params).toString()
    : "";
  const res = await fetch(appPath(`/_agent-native/actions/${name}${qs}`), {
    method: "GET",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Action ${name} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

// -----------------------------------------------------------------------------
// Contacts
// -----------------------------------------------------------------------------

export function useContacts(q?: string) {
  return useQuery({
    queryKey: ["contacts", { q }],
    queryFn: () =>
      getAction<{ contacts: Contact[] }>("list-contacts", q ? { q } : undefined),
    select: (data) => data.contacts,
  });
}

export function useContact(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contacts", contactId],
    queryFn: () =>
      getAction<{ contact: Contact; recentActivity: Activity[] }>(
        "get-contact",
        { contactId: contactId! },
      ),
    enabled: !!contactId,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      company?: string;
      phone?: string;
      notes?: string;
    }) => postAction<Contact>("create-contact", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) =>
      postAction<{ ok: true }>("delete-contact", { contactId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// -----------------------------------------------------------------------------
// Deals
// -----------------------------------------------------------------------------

export function useDeals(filter?: { contactId?: string; stage?: typeof DEAL_STAGES[number] }) {
  return useQuery({
    queryKey: ["deals", filter],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (filter?.contactId) params.contactId = filter.contactId;
      if (filter?.stage) params.stage = filter.stage;
      return getAction<{ deals: Deal[] }>("list-deals", params);
    },
    select: (data) => data.deals,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      contactId: string;
      title: string;
      amount: number;
      stage?: typeof DEAL_STAGES[number];
      closeDate?: string;
    }) => postAction<Deal>("create-deal", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      dealId: string;
      stage: typeof DEAL_STAGES[number];
      note?: string;
    }) =>
      postAction<{ deal: Deal; activityId: string }>(
        "update-deal-stage",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// -----------------------------------------------------------------------------
// Activities + Cross-app
// -----------------------------------------------------------------------------

export function useActivities(filter?: {
  contactId?: string;
  dealId?: string;
}) {
  return useQuery({
    queryKey: ["activities", filter],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (filter?.contactId) params.contactId = filter.contactId;
      if (filter?.dealId) params.dealId = filter.dealId;
      return getAction<{ activities: Activity[] }>("list-activities", params);
    },
    select: (data) => data.activities,
  });
}

export function useLogOutreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      contactId: string;
      subject: string;
      body: string;
    }) =>
      postAction<{ activityId: string; messageId: string }>(
        "log-outreach",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useScheduleMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      contactId: string;
      title: string;
      startsAt: number;
      endsAt: number;
      extraAttendees?: string[];
    }) =>
      postAction<{ activityId: string; eventId: string }>(
        "schedule-meeting",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
