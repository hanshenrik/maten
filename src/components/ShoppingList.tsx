import React, { useMemo, useRef, useState } from "react";
import { Icon } from "./ui/Icon";
import { supabase } from "../lib/supabase";
import type { ShoppingItem } from "../types";
import { combineEmojiAndName } from "../utils/emoji";
import { errorMessage } from "../utils/errors";
import { ui } from "../utils/icons";
import {
  formatItemAmount,
  planShoppingListAdditions,
} from "../utils/shoppingList";
import { CheckboxButton } from "./forms/CheckboxButton";
import { EmojiSelect } from "./forms/EmojiSelect";
import { Field } from "./forms/Field";
import { Input } from "./forms/Input";
import { UnitSelect } from "./forms/UnitSelect";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Details } from "./ui/Details";
import { Dialog } from "./ui/Dialog";
import { Hr } from "./ui/Hr";

interface ShoppingListProps {
  initialItems: ShoppingItem[];
  userId: string;
  householdId: string;
}

const emptyDraft = { emoji: "", name: "", amount: "", unit: "" };

const itemSubLabel = (item: ShoppingItem) =>
  [formatItemAmount(item.amount, item.unit), item.notes]
    .filter(Boolean)
    .join(" • ");

export const ShoppingList = ({
  initialItems,
  userId,
  householdId,
}: ShoppingListProps) => {
  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Things bought before are what you're most likely to buy again
  const suggestions = useMemo(
    () =>
      Array.from(
        new Set(items.filter((i) => i.completed).map((i) => i.name)),
      ).sort(),
    [items],
  );

  const activeItems = items.filter((i) => !i.completed);
  const completedItems = items.filter((i) => i.completed);

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
            name: combineEmojiAndName(draft.emoji, draft.name),
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
            completed: false,
          })
          .select()
          .single();
        if (error) throw error;

        setItems((current) => [data as ShoppingItem, ...current]);
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

  const renderItems = (list: ShoppingItem[]) => (
    <ul className="space-y-2">
      {list.map((item) => (
        <li key={item.id} className="relative">
          <CheckboxButton
            checked={item.completed}
            onChange={() => handleToggle(item)}
            label={item.name}
            subLabel={itemSubLabel(item)}
            className="pr-16"
          />
          <Button
            onClick={() => handleDelete(item)}
            variant="danger"
            size="sm"
            className="absolute top-1/2 right-4 -translate-y-1/2"
            title="Fjern vare"
            aria-label={`Fjern ${item.name}`}
          >
            <Icon icon={ui.x} className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-4">
      <datalist id="shopping-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {isAdding ? (
        <Card className="overflow-visible">
          <h3 className="text-text mb-3 font-medium">Noe mer du mangler?</h3>
          <form onSubmit={handleAddItem}>
            <div className="grid grid-cols-1 items-end gap-2 md:grid-cols-3">
              <div className="flex items-end gap-2">
                <Field label="Ikon" htmlFor="new-item-emoji">
                  <EmojiSelect
                    id="new-item-emoji"
                    value={draft.emoji}
                    onChange={(emoji) => setDraft({ ...draft, emoji })}
                  />
                </Field>
                <Input
                  label="Navn"
                  list="shopping-suggestions"
                  ref={nameInputRef}
                  value={draft.name}
                  autoFocus
                  enterKeyHint="done"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="f.eks. Epler"
                />
              </div>
              <Input
                type="number"
                label="Antall"
                enterKeyHint="done"
                min="1"
                step="any"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              />
              <UnitSelect
                label="Enhet"
                value={draft.unit}
                onChange={(unit) => setDraft({ ...draft, unit })}
              />
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
            className="bg-surface text-text-muted border-border h-11 cursor-text rounded-xl border px-3 text-left transition-all outline-none"
            onClick={() => setIsAdding(true)}
          >
            f.eks. Epler
          </button>
        </Field>
      )}

      <Hr />

      <div className="space-y-4">
        {activeItems.length > 0
          ? renderItems(activeItems)
          : completedItems.length === 0 && (
              <p className="text-text-muted py-8 text-center">
                Handlelisten er tom. Kanskje dere har alt dere trenger?
              </p>
            )}

        {completedItems.length > 0 && (
          <div className="flex flex-col gap-4">
            <Hr />
            <Details
              open
              summaryClassName="text-sm font-medium"
              title={`Dette har dere lagt i kurven (${completedItems.length})`}
            >
              {renderItems(completedItems)}
            </Details>
          </div>
        )}
      </div>

      <Dialog alert open={!!alertMessage} onClose={() => setAlertMessage(null)}>
        {alertMessage}
      </Dialog>
    </div>
  );
};
