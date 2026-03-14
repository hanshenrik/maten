import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Checkbox } from "./Checkbox";
import { UnitSelect } from "./UnitSelect";

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  notes?: string;
  completed: boolean;
}

export interface ShoppingList {
  id: string;
  items: ShoppingListItem[];
  createdAt: Date;
  updatedAt: Date;
  completed: boolean;
}

interface ShoppingListProps {
  shoppingList: ShoppingList;
  onUpdate: (updatedList: ShoppingList) => void;
}

export const ShoppingListComponent: React.FC<ShoppingListProps> = ({
  shoppingList,
  onUpdate,
}) => {
  const [newItem, setNewItem] = useState<
    Omit<ShoppingListItem, "id" | "completed">
  >({
    name: "",
    amount: 1,
    unit: "pcs",
    category: "general",
    notes: "",
  });

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;

    const updatedItems = [
      ...shoppingList.items,
      {
        id: Date.now().toString(),
        ...newItem,
        completed: false,
      },
    ];

    const updatedList = {
      ...shoppingList,
      items: updatedItems,
      updatedAt: new Date(),
    };

    onUpdate(updatedList);
    setNewItem({
      name: "",
      amount: 1,
      unit: "pcs",
      category: "general",
      notes: "",
    });
  };

  const handleToggleComplete = (itemId: string) => {
    const updatedItems = shoppingList.items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    );

    const updatedList = {
      ...shoppingList,
      items: updatedItems,
      updatedAt: new Date(),
    };

    onUpdate(updatedList);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = shoppingList.items.filter(
      (item) => item.id !== itemId,
    );

    const updatedList = {
      ...shoppingList,
      items: updatedItems,
      updatedAt: new Date(),
    };

    onUpdate(updatedList);
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-primary mb-4 text-xl font-semibold">Handleliste</h2>

      {/* Add new item form */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <h3 className="text-primary mb-3 font-medium">Legg til ny vare</h3>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
          <div>
            <label className="text-secondary mb-1 block text-sm">Navn</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="focus:ring-accent w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:outline-none"
              placeholder="f.eks., Epler"
            />
          </div>
          <div>
            <label className="text-secondary mb-1 block text-sm">Antall</label>
            <input
              type="number"
              value={newItem.amount}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  amount: parseFloat(e.target.value) || 1,
                })
              }
              className="focus:ring-accent w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:outline-none"
              min="1"
            />
          </div>
          <div>
            <label className="text-secondary mb-1 block text-sm">Enhet</label>
            <UnitSelect
              value={newItem.unit}
              onChange={(value) => setNewItem({ ...newItem, unit: value })}
              className="w-full"
            />
          </div>
        </div>
        <button
          onClick={handleAddItem}
          className="bg-accent hover:bg-opacity-90 mt-3 flex items-center gap-2 rounded-md px-4 py-2 text-white transition-colors"
        >
          <Icon icon="hugeicons:plus-sign" className="h-5 w-5" />
          Legg til
        </button>
      </div>

      <ul className="space-y-2">
        {shoppingList.items.map((item) => (
          <li key={item.id} className="group relative">
            <Checkbox
              checked={item.completed}
              onChange={() => handleToggleComplete(item.id)}
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
