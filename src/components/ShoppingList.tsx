import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../lib/supabase";
import { Checkbox } from "./Checkbox";
import { UnitSelect } from "./UnitSelect";
import { EmojiSelect } from "./EmojiSelect";
import { combineEmojiAndName } from "../utils/emoji";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

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
  const [newItem, setNewItem] = useState({
    emoji: "",
    name: "",
    amount: 1,
    unit: "stk",
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
      setNewItem({ emoji: "", name: "", amount: 1, unit: "stk" });
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
    <Card>
      <h2 className="text-text mb-4 text-xl font-semibold">Handleliste</h2>

      <datalist id="shopping-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {/* Add new item form */}
      <div className="bg-bg border-border mb-8 rounded-lg border p-4">
        <h3 className="text-text mb-3 font-medium">Legg til ny vare</h3>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-text-muted mb-1 block text-sm">Navn</label>
            <div className="flex gap-2">
              <EmojiSelect
                value={newItem.emoji}
                onChange={(emoji) => setNewItem({ ...newItem, emoji })}
              />
              <input
                type="text"
                list="shopping-suggestions"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="border-border bg-surface text-text focus:ring-primary w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                placeholder="f.eks., Epler"
              />
            </div>
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-sm">Antall</label>
            <input
              type="number"
              value={newItem.amount}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  amount: parseFloat(e.target.value) || 1,
                })
              }
              className="border-border bg-surface text-text focus:ring-primary w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
              min="1"
            />
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-sm">Enhet</label>
            <UnitSelect
              value={newItem.unit}
              onChange={(value) => setNewItem({ ...newItem, unit: value })}
              className="w-full"
            />
          </div>
        </div>
        <Button
          onClick={handleAddItem}
          disabled={loading}
          className="mt-4 gap-2"
        >
          <Icon icon="hugeicons:plus-sign" className="h-5 w-5" />
          {loading ? "Legger til..." : "Legg til"}
        </Button>
      </div>

      <div className="space-y-6">
        {activeItems.length > 0 ? (
          <ul className="space-y-2">
            {activeItems.map((item) => (
              <li key={item.id} className="group relative">
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
                  className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
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
              Handlelista er tom
            </p>
          )
        )}

        {completedItems.length > 0 && (
          <details className="group border-border border-t pt-4" open>
            <summary className="text-text-muted hover:text-text cursor-pointer text-sm font-medium focus:outline-none">
              Fullførte varer ({completedItems.length})
            </summary>
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
          </details>
        )}
      </div>
    </Card>
  );
};
