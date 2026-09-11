import { combineEmojiAndName, splitEmojiFromName } from "./emoji";

/** The minimum an item needs to take part in merging. */
export interface MergeableItem {
  name: string;
  amount: number | null;
  unit: string;
}

/** A merge candidate that already lives in the database. */
export interface ExistingItem extends MergeableItem {
  id: string;
}

/**
 * The key two items have to share to be merged: the name without its emoji
 * (case- and whitespace-insensitive) plus the unit.
 *
 * Units are never converted, so "500 g" and "0.5 kg" stay apart — only an
 * exact unit match merges.
 */
export const shoppingItemKey = (name: string, unit?: string | null): string => {
  const { name: bareName } = splitEmojiFromName(name || "");
  return `${bareName.toLowerCase()}|${(unit || "").trim().toLowerCase()}`;
};

/**
 * The "2 kg" line under an item's name. Missing pieces are left out instead of
 * printing "null", and a lone "1" is dropped — one of something is what you
 * get when you don't say otherwise.
 */
export const formatItemAmount = (
  amount: number | null | undefined,
  unit?: string | null,
): string => {
  const cleanUnit = (unit || "").trim();
  if (!cleanUnit && (amount == null || amount === 1)) return "";

  const parts: string[] = [];
  if (amount != null) parts.push(String(amount));
  if (cleanUnit) parts.push(cleanUnit);

  return parts.join(" ");
};

/** Adds two amounts, staying null only when neither side has a number. */
const addAmounts = (
  a: number | null | undefined,
  b: number | null | undefined,
): number | null => {
  if (a == null && b == null) return null;
  return (Number(a) || 0) + (Number(b) || 0);
};

/**
 * Keeps the first name we saw, but adopts an emoji from a later duplicate if
 * the first one didn't have one — so "Agurk" + "🥒 Agurk" becomes "🥒 Agurk".
 */
const preferNameWithEmoji = (kept: string, incoming: string): string => {
  const keptParts = splitEmojiFromName(kept);
  if (keptParts.emoji) return kept;

  const { emoji } = splitEmojiFromName(incoming);
  return emoji ? combineEmojiAndName(emoji, keptParts.name) : kept;
};

/**
 * Collapses duplicates in a list of items, summing their amounts.
 * Order follows the first occurrence of each item.
 */
export const mergeShoppingItems = <T extends MergeableItem>(
  items: T[],
): T[] => {
  const merged: T[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of items) {
    const key = shoppingItemKey(item.name, item.unit);
    const index = indexByKey.get(key);

    if (index === undefined) {
      indexByKey.set(key, merged.length);
      merged.push({ ...item });
    } else {
      const existing = merged[index];
      merged[index] = {
        ...existing,
        name: preferNameWithEmoji(existing.name, item.name),
        amount: addAmounts(existing.amount, item.amount),
      } as T;
    }
  }

  return merged;
};

/**
 * Works out how to add `incoming` items to a shopping list that already has
 * `existing` items on it: anything matching an existing item bumps that item's
 * amount, the rest are new. Incoming items that match each other are merged
 * together too.
 *
 * Only pass in existing items that should be merged into — completed items are
 * already bought, so they belong to the caller's filter, not this function.
 */
export const planShoppingListAdditions = (
  existing: ExistingItem[],
  incoming: MergeableItem[],
): {
  updates: { id: string; name: string; amount: number | null }[];
  inserts: MergeableItem[];
} => {
  type Target = MergeableItem & { id?: string; touched: boolean };

  const byKey = new Map<string, Target>();
  for (const item of existing) {
    const key = shoppingItemKey(item.name, item.unit);
    if (byKey.has(key)) continue;
    byKey.set(key, { ...item, amount: item.amount ?? null, touched: false });
  }

  // `inserts` holds the same objects as the map, so later duplicates keep
  // accumulating into them.
  const inserts: Target[] = [];

  for (const item of incoming) {
    const key = shoppingItemKey(item.name, item.unit);
    const target = byKey.get(key);

    if (target) {
      target.name = preferNameWithEmoji(target.name, item.name);
      target.amount = addAmounts(target.amount, item.amount);
      target.touched = true;
    } else {
      const fresh: Target = {
        name: item.name,
        amount: item.amount ?? null,
        unit: item.unit,
        touched: false,
      };
      byKey.set(key, fresh);
      inserts.push(fresh);
    }
  }

  return {
    updates: Array.from(byKey.values())
      .filter((target) => target.touched && target.id)
      .map(({ id, name, amount }) => ({ id: id!, name, amount })),
    inserts: inserts.map(({ name, amount, unit }) => ({ name, amount, unit })),
  };
};
