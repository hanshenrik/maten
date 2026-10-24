import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./ui/Icon";
import { supabase } from "../lib/supabase";
import type { ShoppingItem, ShoppingItemLog } from "../types";
import { errorMessage } from "../utils/errors";
import { ui } from "../utils/icons";
import {
  subscribeShoppingChanges,
  subscribeShoppingLogChanges,
} from "../utils/realtime";
import {
  formatItemAmount,
  planShoppingListAdditions,
} from "../utils/shoppingList";
import { CheckboxButton } from "./forms/CheckboxButton";
import { Field } from "./forms/Field";
import { Input } from "./forms/Input";
import { ShopSelect } from "./forms/ShopSelect";
import { SuggestInput } from "./forms/SuggestInput";
import { UnitSelect } from "./forms/UnitSelect";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Details } from "./ui/Details";
import { Dialog } from "./ui/Dialog";
import { DotMenu, dotMenuSeparator } from "./ui/DotMenu";
import { Hr } from "./ui/Hr";
import { SearchableSelect } from "./ui/SearchableSelect";

interface ShoppingListProps {
  initialItems: ShoppingItem[];
  /** Every name the household has ever had on the list */
  initialLog: ShoppingItemLog[];
  userId: string;
  householdId: string;
}

const emptyDraft = { name: "", amount: "", unit: "", shop: "" };

/** How the log matches names: case- and padding-insensitive. */
const nameKey = (name: string) => (name || "").trim().toLowerCase();

/** How the list can be ordered. */
type SortMode = "alpha" | "shop" | "added";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "alpha", label: "Alfabetisk" },
  { value: "shop", label: "Butikk" },
  { value: "added", label: "Lagt til" },
];

const itemSubLabel = (item: ShoppingItem) =>
  [formatItemAmount(item.amount, item.unit), item.notes]
    .filter(Boolean)
    .join(" • ");

export const ShoppingList = ({
  initialItems,
  initialLog,
  userId,
  householdId,
}: ShoppingListProps) => {
  const [items, setItems] = useState(initialItems);
  // Only the id and name are needed to suggest; rows from other clients
  // arrive without the rest anyway.
  const [log, setLog] = useState(() =>
    initialLog.map(({ id, name }) => ({ id, name })),
  );
  const [saving, setSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    amount: string;
    unit: string;
    shop: string;
  } | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("added");
  // The item waiting for "Slett fra logg" to be confirmed in the dialog
  const [pendingLogDelete, setPendingLogDelete] = useState<ShoppingItem | null>(
    null,
  );
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Names to offer while typing: everything ever logged, plus whatever is on
  // the list now — an item added before the log existed, or while its row is
  // being written, should still suggest itself.
  const suggestions = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const name of [
      ...log.map((row) => row.name),
      ...items.map((i) => i.name),
    ]) {
      const key = nameKey(name);
      if (key && !byKey.has(key)) byKey.set(key, name);
    }
    return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, "nb"));
  }, [log, items]);

  const activeItems = items.filter((i) => !i.completed);
  const completedItems = items.filter((i) => i.completed);

  // Live updates from anyone else in the household. Each change is reconciled
  // by id; our own optimistic writes arrive here too and just reapply the
  // same values. Newest items stay on top to match the page's sort order.
  useEffect(() => {
    return subscribeShoppingChanges(householdId, (change) => {
      setItems((current) => {
        if (change.type === "DELETE") {
          setEditing((current) =>
            current && current.id === change.id ? null : current,
          );
          setPendingLogDelete((current) =>
            current && current.id === change.id ? null : current,
          );
          return current.filter((item) => item.id !== change.id);
        }
        const row = change.row;
        const existing = current.find((item) => item.id === row.id);
        if (existing) {
          // Reuse the current position unless the row moved between the
          // active and completed groups, which is the only re-sort a toggle
          // causes. The rest of the row is overwritten from the server.
          const next: ShoppingItem = { ...existing, ...row };
          return current.map((item) => (item.id === row.id ? next : item));
        }
        if (change.type === "INSERT") {
          return [row as ShoppingItem, ...current];
        }
        // An update for a row we don't have: ignore it rather than resurrect a
        // phantom item.
        return current;
      });
    });
  }, [householdId]);

  // The log is written by a database trigger, so it grows from every client.
  // Reconcile the same way the list does: by id, except inserts are keyed by
  // name, which is what the log is unique on per household.
  useEffect(() => {
    return subscribeShoppingLogChanges(householdId, (change) => {
      setLog((current) => {
        if (change.type === "DELETE")
          return current.filter((row) => row.id !== change.id);
        const row = change.row;
        const kept = current.filter(
          (existing) => nameKey(existing.name) !== nameKey(row.name),
        );
        return [...kept, row];
      });
    });
  }, [householdId]);

  const handleAddItem = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim() || saving) return;
    setSaving(true);

    try {
      const { updates, inserts } = planShoppingListAdditions(
        // Completed items are already bought, so we never merge into those.
        // No amount means one of the thing, so adding it again gives you 2.
        activeItems.map((item) => ({ ...item, amount: item.amount ?? 1 })),
        [
          {
            name: draft.name.trim(),
            amount: draft.amount ? Number(draft.amount) : 1,
            unit: draft.unit,
          },
        ],
      );

      const [update] = updates;
      if (update) {
        // Same name and unit is already on the list: bump the amount
        const { error } = await supabase
          .from("shopping_items")
          .update({ name: update.name, amount: update.amount })
          .eq("id", update.id);
        if (error) throw error;

        // Newest first, so the merged item shows up where you added it
        setItems((current) => {
          const merged = current.find((item) => item.id === update.id);
          if (!merged) return current;
          return [
            { ...merged, name: update.name, amount: update.amount },
            ...current.filter((item) => item.id !== update.id),
          ];
        });
      } else {
        const [insert] = inserts;
        const { data, error } = await supabase
          .from("shopping_items")
          .insert({
            user_id: userId,
            household_id: householdId,
            name: insert.name,
            amount: insert.amount,
            unit: insert.unit,
            shop: draft.shop.trim() || null,
            completed: false,
          })
          .select()
          .single();
        if (error) throw error;

        setItems((current) => [data as ShoppingItem, ...current]);

        // The trigger on the server logs the name; this keeps the suggestion
        // alive before that row arrives over realtime, which then replaces
        // this one by name.
        setLog((current) => {
          if (current.some((row) => nameKey(row.name) === nameKey(data.name)))
            return current;
          return [...current, { id: data.id, name: data.name }];
        });
      }

      setDraft(emptyDraft);
      // Ready for the next item without reaching for the mouse
      nameInputRef.current?.focus();
    } catch (err) {
      setAlertMessage(`Fikk ikke lagt til varen: ${errorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    const completed = !item.completed;
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update({ completed })
        .eq("id", item.id);
      if (error) throw error;

      setItems((current) =>
        current.map((i) => (i.id === item.id ? { ...i, completed } : i)),
      );
    } catch (err) {
      setAlertMessage(`Fikk ikke oppdatert varen: ${errorMessage(err)}`);
    }
  };

  const startEditing = (item: ShoppingItem) => {
    setEditing({
      id: item.id,
      name: item.name,
      amount: item.amount != null ? String(item.amount) : "",
      unit: item.unit,
      shop: item.shop ?? "",
    });
    setIsAdding(false);
  };

  const handleUpdateItem = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    if (!editing) return;
    event.preventDefault();
    if (!editing.name.trim() || saving) return;
    setSaving(true);

    const name = editing.name.trim();
    const amount = editing.amount ? Number(editing.amount) : null;
    const unit = editing.unit;
    const shop = editing.shop.trim() || null;

    try {
      const { error } = await supabase
        .from("shopping_items")
        .update({ name, amount, unit, shop })
        .eq("id", editing.id);
      if (error) throw error;

      setItems((current) =>
        current.map((i) =>
          i.id === editing.id ? { ...i, name, amount, unit, shop } : i,
        ),
      );
      setEditing(null);
    } catch (err) {
      setAlertMessage(`Fikk ikke oppdatert varen: ${errorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ShoppingItem) => {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", item.id);
      if (error) throw error;

      setItems((current) => current.filter((i) => i.id !== item.id));
    } catch (err) {
      setAlertMessage(`Fikk ikke fjernet varen: ${errorMessage(err)}`);
    }
  };

  /**
   * "Slett fra logg": the name stops suggesting itself ever again, and the
   * item goes with it — unlike a plain delete, which leaves the name logged
   * for next time. If the household buys the name again later, it is logged
   * again by the trigger.
   */
  const removeFromLog = async (item: ShoppingItem) => {
    try {
      // `%` and `_` are wildcards in SQL LIKE patterns, so they are escaped
      const pattern = item.name.trim().replace(/[\\%_]/g, "\\$&");
      const { error: logError } = await supabase
        .from("shopping_item_log")
        .delete()
        .eq("household_id", householdId)
        .ilike("name", pattern);
      if (logError) throw logError;

      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", item.id);
      if (error) throw error;

      setItems((current) => current.filter((i) => i.id !== item.id));
      setLog((current) =>
        current.filter((row) => nameKey(row.name) !== nameKey(item.name)),
      );
    } catch (err) {
      setAlertMessage(
        `Fikk ikke slettet varen fra loggen: ${errorMessage(err)}`,
      );
    }
  };

  // "Lagt til" keeps the newest-first order the page loads with; the others
  // re-sort whatever the list holds, live.
  const byName = (a: ShoppingItem, b: ShoppingItem) =>
    a.name.localeCompare(b.name, "nb");

  const shopOf = (item: ShoppingItem) => item.shop?.trim() ?? "";

  const sortItems = (list: ShoppingItem[]) => {
    const sorted = [...list];
    if (sortMode === "alpha") {
      sorted.sort(byName);
    } else if (sortMode === "added") {
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else {
      sorted.sort((a, b) => {
        const shopA = shopOf(a);
        const shopB = shopOf(b);
        // Items without a shop sink to the bottom of the list
        if (!shopA || !shopB) {
          if (shopA) return -1;
          if (shopB) return 1;
        } else if (shopA !== shopB) {
          return shopA.localeCompare(shopB, "nb");
        }
        return byName(a, b);
      });
    }
    return sorted;
  };

  const renderItems = (list: ShoppingItem[]) => (
    <ul className="space-y-2">
      {list.map((item) =>
        editing?.id === item.id ? (
          <li key={item.id}>
            <Card className="overflow-visible">
              <form onSubmit={handleUpdateItem}>
                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                  <SuggestInput
                    label="Navn"
                    value={editing.name}
                    onChange={(name) => setEditing({ ...editing, name })}
                    suggestions={suggestions}
                    autoFocus
                    className="min-w-0 flex-1"
                  />
                  <div className="flex w-full gap-2 md:w-fit md:items-end">
                    <ShopSelect
                      value={editing.shop}
                      onChange={(shop) => setEditing({ ...editing, shop })}
                      className="min-w-0 flex-1 md:w-56"
                    />
                    <Input
                      type="number"
                      label="Mengde"
                      enterKeyHint="done"
                      min="1"
                      step="any"
                      value={editing.amount}
                      onChange={(e) =>
                        setEditing({ ...editing, amount: e.target.value })
                      }
                      className="w-20 md:w-24"
                    />
                    <UnitSelect
                      label="Enhet"
                      value={editing.unit}
                      onChange={(unit) => setEditing({ ...editing, unit })}
                      className="w-20 md:w-24"
                    />
                  </div>
                </div>
                <div className="mt-4 flex w-full gap-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full gap-2 md:w-fit"
                  >
                    <Icon icon={ui.checked} className="h-5 w-5" />
                    {saving ? "Lagrer..." : "Lagre"}
                  </Button>
                  <Button onClick={() => setEditing(null)} variant="secondary">
                    Avbryt
                  </Button>
                </div>
              </form>
            </Card>
          </li>
        ) : (
          <li key={item.id} className="relative">
            <CheckboxButton
              checked={item.completed}
              onChange={() => handleToggle(item)}
              label={item.name}
              subLabel={itemSubLabel(item)}
              className="pr-12"
            />
            <DotMenu
              items={[
                {
                  label: "Rediger",
                  icon: ui.edit,
                  onClick: () => startEditing(item),
                },
                {
                  label: "Fjern",
                  icon: ui.x,
                  onClick: () => handleDelete(item),
                },
                dotMenuSeparator,
                {
                  label: "Slett fra logg",
                  icon: ui.delete,
                  variant: "danger",
                  title: "Fjernes også fra forslag",
                  onClick: () => setPendingLogDelete(item),
                },
              ]}
              label={`Flere valg for ${item.name}`}
              className="absolute top-1/2 right-4 -translate-y-1/2"
            />
          </li>
        ),
      )}
    </ul>
  );

  /** The list in the current sort order, split into shop groups if needed. */
  const renderSorted = (list: ShoppingItem[]) => {
    const sorted = sortItems(list);
    if (sortMode !== "shop") return renderItems(sorted);

    const groups: { label: string; items: ShoppingItem[] }[] = [];
    for (const item of sorted) {
      const label = shopOf(item) || "Uten butikk";
      const last = groups[groups.length - 1];
      if (last?.label === label) last.items.push(item);
      else groups.push({ label, items: [item] });
    }

    return groups.map((group) => (
      <div key={group.label} className="space-y-2">
        <h3 className="text-text-muted text-sm font-medium">{group.label}</h3>
        {renderItems(group.items)}
      </div>
    ));
  };

  return (
    <div className="flex flex-col gap-4">
      {isAdding ? (
        <Card className="overflow-visible">
          <form onSubmit={handleAddItem}>
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
              <SuggestInput
                label="Navn"
                value={draft.name}
                onChange={(name) => setDraft({ ...draft, name })}
                suggestions={suggestions}
                inputRef={nameInputRef}
                autoFocus
                placeholder="f.eks. Epler"
                className="min-w-0 flex-1"
              />
              <div className="flex w-full gap-2 md:w-fit md:items-end">
                <ShopSelect
                  value={draft.shop}
                  onChange={(shop) => setDraft({ ...draft, shop })}
                  className="min-w-0 flex-1 md:w-56"
                />
                <Input
                  type="number"
                  label="Mengde"
                  enterKeyHint="done"
                  min="1"
                  step="any"
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft({ ...draft, amount: e.target.value })
                  }
                  className="w-20 md:w-24"
                />
                <UnitSelect
                  label="Enhet"
                  value={draft.unit}
                  onChange={(unit) => setDraft({ ...draft, unit })}
                  className="w-20 md:w-24"
                />
              </div>
            </div>
            <div className="mt-4 flex w-full gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="w-full gap-2 md:w-fit"
              >
                <Icon icon={ui.add} className="h-5 w-5" />
                {saving ? "Legger til..." : "Legg til"}
              </Button>
              <Button onClick={() => setIsAdding(false)} variant="secondary">
                Avbryt
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Field label="Legg til noe" htmlFor="add-shopping-item">
          <button
            type="button"
            id="add-shopping-item"
            className="bg-surface text-text-muted border-border h-9 cursor-text rounded-lg border px-2.5 text-left text-base transition-all outline-none"
            onClick={() => setIsAdding(true)}
          >
            f.eks. Epler
          </button>
        </Field>
      )}

      <Hr />

      <Field label="Sorter" htmlFor="shopping-sort" className="w-fit self-end">
        <SearchableSelect
          items={SORT_OPTIONS}
          value={sortMode}
          onChange={(value) => setSortMode(value as SortMode)}
          getKey={(option) => option.value}
          getLabel={(option) => option.label}
          id="shopping-sort"
          placeholder="Sorter"
          className="w-32"
        />
      </Field>

      <div className="space-y-4">
        {activeItems.length > 0
          ? renderSorted(activeItems)
          : completedItems.length === 0 && (
              <p className="text-text-muted py-8 text-center">
                Handlelista er tom. Kanskje dere har alt dere trenger?
              </p>
            )}

        {completedItems.length > 0 && (
          <div className="flex flex-col gap-4">
            <Hr />
            <Details
              open
              summaryClassName="text-sm font-medium"
              title={`Dette har du lagt i kurven (${completedItems.length})`}
            >
              {renderSorted(completedItems)}
            </Details>
          </div>
        )}
      </div>

      <Dialog
        open={!!pendingLogDelete}
        onClose={() => setPendingLogDelete(null)}
        onConfirm={() => {
          const item = pendingLogDelete;
          setPendingLogDelete(null);
          if (item) void removeFromLog(item);
        }}
        confirmLabel="Slett"
        confirmVariant="danger"
      >
        {pendingLogDelete
          ? `«${pendingLogDelete.name}» fjernes fra handlelista, og navnet slettes fra loggen for godt — det slutter å dukke opp som forslag.`
          : null}
      </Dialog>

      <Dialog alert open={!!alertMessage} onClose={() => setAlertMessage(null)}>
        {alertMessage}
      </Dialog>
    </div>
  );
};
