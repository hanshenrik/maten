import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Hr } from "./ui/Hr";
import { supabase } from "../lib/supabase";
import { Checkbox } from "./Checkbox";
import { UnitSelect } from "./UnitSelect";
import { EmojiSelect } from "./EmojiSelect";
import { combineEmojiAndName } from "../utils/emoji";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Details } from "./ui/Details";

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
  completed: boolean;
  notes?: string;
}

interface ShoppingListProps {
  initialItems: ShoppingListItem[];
  userId: string;
  householdId: string;
}

export const ShoppingListComponent: React.FC<ShoppingListProps> = ({
  initialItems,
  userId,
  householdId,
}) => {
  const [items, setItems] = useState<ShoppingListItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [addItemCardOpen, setAddItemCardOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    emoji: "",
    name: "",
    amount: "",
    unit: "",
  });

  // Get unique names of previously completed items for autosuggestion
  const suggestions = Array.from(
    new Set(items.filter((item) => item.completed).map((item) => item.name)),
  ).sort();

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .insert({
          user_id: userId,
          household_id: householdId,
          name: combineEmojiAndName(newItem.emoji, newItem.name),
          amount: newItem.amount || null,
          unit: newItem.unit,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setItems([...items, data]);
      setNewItem({ emoji: "", name: "", amount: "", unit: "" });
    } catch (err: any) {
      alert("Error adding item: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (
    itemId: string,
    currentStatus: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update({ completed: !currentStatus })
        .eq("id", itemId);

      if (error) throw error;

      setItems(
        items.map((item) =>
          item.id === itemId ? { ...item, completed: !currentStatus } : item,
        ),
      );
    } catch (err: any) {
      alert("Error updating item: " + err.message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems(items.filter((item) => item.id !== itemId));
    } catch (err: any) {
      alert("Error deleting item: " + err.message);
    }
  };

  const activeItems = items.filter((i) => !i.completed);
  const completedItems = items.filter((i) => i.completed);

  return (
    <div className="flex flex-col gap-4">
      <datalist id="shopping-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {addItemCardOpen ? (
        <Card className="overflow-visible">
          <h3 className="text-text mb-3 font-medium">Noe mer du mangler?</h3>
          <div className="grid grid-cols-1 items-end gap-2 md:grid-cols-3">
            <div className="flex flex-row items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-text-muted block text-sm">Ikon</label>
                <EmojiSelect
                  value={newItem.emoji}
                  onChange={(emoji) => setNewItem({ ...newItem, emoji })}
                />
              </div>

              <div className="flex w-full flex-col gap-1 md:col-span-2">
                <label className="text-text-muted block text-sm">Navn</label>
                <Input
                  list="shopping-suggestions"
                  value={newItem.name}
                  autoFocus
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  placeholder="f.eks. Epler"
                />
              </div>
            </div>
            <div>
              <Input
                type="number"
                label="Antall"
                value={newItem.amount}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    amount: e.target.value,
                  })
                }
                min="1"
              />
            </div>

            <UnitSelect
              label="Enhet"
              value={newItem.unit}
              onChange={(value) => setNewItem({ ...newItem, unit: value })}
            />
          </div>
          <div className="mt-4 flex w-full gap-2">
            <Button
              onClick={handleAddItem}
              disabled={loading}
              className="w-full gap-2 md:w-fit"
            >
              <Icon icon="hugeicons:plus-sign" className="h-5 w-5" />
              {loading ? "Legger til..." : "Legg i listen"}
            </Button>
            <Button
              onClick={() => setAddItemCardOpen(false)}
              variant="secondary"
            >
              Avbryt
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-1">
          <label className="text-text-muted block text-sm">Legg til noe</label>
          <button
            className={`bg-surface text-text-muted border-border h-10 rounded-xl border px-3 py-2 text-left leading-1 transition-all outline-none`}
            onClick={() => setAddItemCardOpen(true)}
          >
            f.eks. Epler
          </button>
        </div>
      )}

      <Hr />

      <div className="space-y-4">
        {activeItems.length > 0 ? (
          <ul className="space-y-2">
            {activeItems.map((item) => (
              <li key={item.id} className="group relative bg-white">
                <Checkbox
                  checked={item.completed}
                  onChange={() => handleToggleComplete(item.id, item.completed)}
                  label={item.name}
                  subLabel={`${item.amount} ${item.unit}${item.notes ? ` • ${item.notes}` : ""}`}
                />
                <Button
                  onClick={() => handleDeleteItem(item.id)}
                  variant="danger"
                  size="sm"
                  className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100"
                  title="Fjern vare"
                >
                  <Icon icon="hugeicons:delete-03" className="h-5 w-5" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          !completedItems.length && (
            <p className="text-text-muted py-8 text-center">
              Handlelisten er tom. Kanskje dere har alt dere trenger?
            </p>
          )
        )}

        {completedItems.length > 0 && (
          <div className="flex flex-col gap-4">
            <Hr />
            <Details
              open
              summaryClassName="text-sm font-medium"
              title={`Dette har dere lagt i kurven (${completedItems.length})`}
            >
              <ul className="mt-4 space-y-2">
                {completedItems.map((item) => (
                  <li key={item.id} className="group relative">
                    <Checkbox
                      checked={item.completed}
                      onChange={() =>
                        handleToggleComplete(item.id, item.completed)
                      }
                      label={item.name}
                      subLabel={`${item.amount} ${item.unit}${item.notes ? ` • ${item.notes}` : ""}`}
                    />
                    <Button
                      onClick={() => handleDeleteItem(item.id)}
                      variant="danger"
                      size="sm"
                      className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                      title="Fjern vare"
                    >
                      <Icon icon="hugeicons:delete-03" className="h-5 w-5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </Details>
          </div>
        )}
      </div>
    </div>
  );
};
