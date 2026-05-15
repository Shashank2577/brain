import { useActionQuery, useActionMutation } from "@agent-native/core/client";

export interface NoteListEntry {
  id: string;
  title: string;
  snippet: string;
  sourceApp: string | null;
  sourceType: string | null;
  sourceId: string | null;
  pinned: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ownerEmail: string;
}

export interface NoteDetail extends NoteListEntry {
  body: string;
  visibility: string;
  accessRole: string;
  canEdit: boolean;
  canManage: boolean;
}

interface ListResponse {
  notes: NoteListEntry[];
}

export function useNotes(args: { archived?: boolean } = {}) {
  return useActionQuery<ListResponse>(
    "list-notes",
    { archived: args.archived ?? false },
    { staleTime: 2000 },
  );
}

export function useNote(id: string | undefined) {
  return useActionQuery<NoteDetail>(
    "get-note",
    id ? { id } : undefined,
    { enabled: Boolean(id) },
  );
}

export function useCreateNote() {
  return useActionMutation<NoteDetail>("create-note");
}

export function useUpdateNote() {
  return useActionMutation<NoteDetail>("update-note");
}

export function useDeleteNote() {
  return useActionMutation<{ id: string; deleted: true; purged: boolean }>(
    "delete-note",
  );
}
