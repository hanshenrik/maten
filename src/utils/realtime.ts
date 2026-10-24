import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

/** The metadata a client tracks for itself so others can show it as present. */
export interface PresenceUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** A peer that the presence tracker reports as currently online. */
export interface ActiveUser extends PresenceUser {
  /** Stable per connection, lets React keys dedupe rejoins. */
  presenceRef: string;
}

const PRESENCE_KEY = "user";

/** What the channel name for a household's shopping list is built from. */
export const shoppingChannelName = (householdId: string) =>
  `shopping:${householdId}`;

/** What the channel name for a household's presence is built from. */
export const presenceChannelName = (householdId: string) =>
  `presence:${householdId}`;

/** What the channel name for a household's shopping item log is built from. */
export const shoppingLogChannelName = (householdId: string) =>
  `shopping-log:${householdId}`;

/**
 * Tracks this user on a household presence channel and reports everyone
 * currently online. Cleans the channel up on unmount.
 *
 * Presence is best-effort: if the channel never connects, the caller simply
 * sees only themselves, which is a fine degradation.
 */
export function trackPresence(
  householdId: string,
  user: PresenceUser,
  onChange: (users: ActiveUser[]) => void,
): () => void {
  let cancelled = false;
  let channel: RealtimeChannel | undefined;

  const toActiveUsers = (): ActiveUser[] => {
    const state = channel?.presenceState<PresenceUser>() ?? {};
    const users: ActiveUser[] = [];
    for (const [key, presences] of Object.entries(state)) {
      for (const presence of presences) {
        users.push({ ...presence, presenceRef: key });
      }
    }
    return users;
  };

  channel = supabase
    .channel(presenceChannelName(householdId), {
      config: { presence: { key: PRESENCE_KEY } },
    })
    .on("presence", { event: "sync" }, () => {
      if (!cancelled) onChange(toActiveUsers());
    })
    .subscribe(async (status) => {
      if (cancelled) return;
      if (status === "SUBSCRIBED") {
        await channel?.track(user);
      }
    });

  return () => {
    cancelled = true;
    const toRemove = channel;
    if (toRemove) {
      void toRemove.untrack();
      void supabase.removeChannel(toRemove);
    }
  };
}

/** The DB rows `subscribeShoppingChanges` reconciles into the list. */
interface Row {
  id: string;
  household_id: string;
  user_id: string;
  name: string;
  amount: number | null;
  unit: string;
  completed: boolean;
  notes?: string | null;
  created_at: string;
}

/** What `subscribeShoppingChanges` reports for each change. */
export type ShoppingChange =
  { type: "INSERT" | "UPDATE"; row: Row } | { type: "DELETE"; id: string };

/**
 * Listens to inserts, updates and deletes on `shopping_items` for one
 * household and patches `apply` into the caller's list. Returns a teardown
 * that leaves the channel. The caller owns the list, so updates it made
 * itself are applied optimistically and reconciled by these events too.
 */
export function subscribeShoppingChanges(
  householdId: string,
  apply: (change: ShoppingChange) => void,
): () => void {
  const channel = supabase
    .channel(shoppingChannelName(householdId))
    .on<Row>(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "shopping_items",
        filter: `household_id=eq.${householdId}`,
      },
      (payload) => apply({ type: "INSERT", row: payload.new }),
    )
    .on<Row>(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "shopping_items",
        filter: `household_id=eq.${householdId}`,
      },
      (payload) => apply({ type: "UPDATE", row: payload.new }),
    )
    .on<Row>(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "shopping_items",
        filter: `household_id=eq.${householdId}`,
      },
      (payload) => {
        // Deletes only carry the old row's primary key.
        const id = payload.old.id;
        if (id) apply({ type: "DELETE", id });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** The pieces of a `shopping_item_log` row the suggestions need. */
export interface ShoppingLogRow {
  id: string;
  name: string;
}

/** What `subscribeShoppingLogChanges` reports for each change. */
export type ShoppingLogChange =
  { type: "INSERT"; row: ShoppingLogRow } | { type: "DELETE"; id: string };

/**
 * Listens to inserts and deletes on `shopping_item_log` for one household,
 * so the name suggestions stay in sync when another member buys or bans a
 * name. Deletes only carry the primary key, so callers track rows by id.
 * Returns a teardown that leaves the channel.
 */
export function subscribeShoppingLogChanges(
  householdId: string,
  apply: (change: ShoppingLogChange) => void,
): () => void {
  const channel = supabase
    .channel(shoppingLogChannelName(householdId))
    .on<ShoppingLogRow>(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "shopping_item_log",
        filter: `household_id=eq.${householdId}`,
      },
      (payload) => apply({ type: "INSERT", row: payload.new }),
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "shopping_item_log",
        filter: `household_id=eq.${householdId}`,
      },
      (payload) => {
        const id = payload.old.id;
        if (id) apply({ type: "DELETE", id });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
