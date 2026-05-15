import { getRequestUserEmail } from "@agent-native/core/server/request-context";

export function getCurrentOwnerEmail(): string {
  const email = getRequestUserEmail();
  if (!email) throw new Error("no authenticated user");
  return email;
}

export function nanoid(size = 12): string {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (const byte of bytes) id += chars[byte % chars.length];
  return id;
}

/**
 * Standard pipeline ordering for sorting deals by stage. Used by list-deals
 * to default ordering from lead → won → lost so the kanban renders left to
 * right matching the user's mental model.
 */
export const STAGE_ORDER = {
  lead: 0,
  qualified: 1,
  proposal: 2,
  won: 3,
  lost: 4,
} as const;

export type DealStage = keyof typeof STAGE_ORDER;
export type ActivityKind = "email" | "meeting" | "note" | "call";
