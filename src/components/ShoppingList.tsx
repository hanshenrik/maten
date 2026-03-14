import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../lib/supabase";
import { Checkbox } from "./Checkbox";
import { UnitSelect } from "./UnitSelect";

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
}

export const ShoppingListComponent: React.FC<ShoppingListProps> = ({
  initialItems,
  userId,
}) => {
  const [localItems, setLocalItems] =
    useState<ShoppingListItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    amount: 1,
    unit: "stk",
  });

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .insert({
          user_id: userId,
          name: newItem.name,
          amount: newItem.amount || null,
          unit: newItem.unit,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setLocalItems([...localItems, data]);
      setNewItem({ name: "", amount: 1, unit: "stk" });
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

      setLocalItems(
        localItems.map((item) =>
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

      setLocalItems(localItems.filter((item) => item.id !== itemId));
    } catch (err: any) {
      alert("Error deleting item: " + err.message);
    }
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Handleliste</h2>

      {/* Add new item form */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <h3 className="mb-3 font-medium text-gray-900">Legg til ny vare</h3>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-gray-600">Navn</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="f.eks., Epler"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Antall</label>
            <input
              type="number"
              value={newItem.amount}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  amount: parseFloat(e.target.value) || 1,
                })
              }
              className="w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              min="1"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Enhet</label>
            <UnitSelect
              value={newItem.unit}
              onChange={(value) => setNewItem({ ...newItem, unit: value })}
              className="w-full"
            />
          </div>
        </div>
        <button
          onClick={handleAddItem}
          className="mt-4 flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-6 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
        >
          <Icon icon="hugeicons:plus-sign" className="h-5 w-5" />
          Legg til
        </button>
      </div>

      <ul className="space-y-2">
        {localItems.map((item) => (
          <li key={item.id} className="group relative">
            <Checkbox
              checked={item.completed}
              onChange={() => handleToggleComplete(item.id, item.completed)}
              label={item.name}
              subLabel={`${item.amount} ${item.unit}${item.notes ? ` • ${item.notes}` : ""}`}
            />
            <button
              onClick={() => handleDeleteItem(item.id)}
              className="absolute top-1/2 right-4 -translate-y-1/2 p-2 text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
              title="Remove item"
            >
              <Icon icon="hugeicons:delete-03" className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
