import { useActionQuery, useActionMutation } from "@agent-native/core/client";

export interface ItemListEntry {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  ownerEmail: string;
}

export interface ItemDetail extends ItemListEntry {
  visibility: string;
  accessRole: string;
  canEdit: boolean;
}

interface ListResponse {
  items: ItemListEntry[];
}

export function useItems() {
  return useActionQuery<ListResponse>(
    "list-items",
    { limit: 50 },
    { staleTime: 2000 },
  );
}

export function useItem(id: string | undefined) {
  return useActionQuery<ItemDetail>("get-item", id ? { id } : undefined, {
    enabled: Boolean(id),
  });
}

export function useCreateItem() {
  return useActionMutation<ItemDetail>("create-item");
}

export function useUpdateItem() {
  return useActionMutation<ItemDetail>("update-item");
}

export function useDeleteItem() {
  return useActionMutation<{ id: string; deleted: true }>("delete-item");
}
