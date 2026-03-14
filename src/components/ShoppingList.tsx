import React, { useState } from "react";
import { Icon } from "@iconify/react";

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

  // Group items by category
  const groupedItems = shoppingList.items.reduce(
    (groups, item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
      return groups;
    },
    {} as Record<string, ShoppingListItem[]>,
  );

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
            <select
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              className="focus:ring-accent w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:outline-none"
            >
              <option value="stk">Stk</option>
              <option value="kg">Kilo</option>
              <option value="g">Gram</option>
              <option value="L">Liter</option>
              <option value="ml">Milliliter</option>
            </select>
          </div>
          <div>
            <label className="text-secondary mb-1 block text-sm">
              Kategori
            </label>
            <select
              value={newItem.category}
              onChange={(e) =>
                setNewItem({ ...newItem, category: e.target.value })
              }
              className="focus:ring-accent w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:outline-none"
            >
              <option value="general">Generelt</option>
              <option value="produce">Frukt og Grønt</option>
              <option value="dairy">Meieri</option>
              <option value="meat">Kjøtt</option>
              <option value="bakery">Bakeri</option>
            </select>
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

      {/* Shopping list items by category */}
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h3 className="text-primary mb-3 flex items-center gap-2 text-lg font-medium capitalize">
            {category === "produce" && (
              <Icon
                icon="streamline-ultimate-color:apple-1"
                className="h-5 w-5"
              />
            )}
            {category === "dairy" && (
              <Icon
                icon="streamline-ultimate-color:cheese-1"
                className="h-5 w-5"
              />
            )}
            {category === "meat" && (
              <Icon
                icon="streamline-ultimate-color:meat-1"
                className="h-5 w-5"
              />
            )}
            {category === "bakery" && (
              <Icon
                icon="streamline-ultimate-color:bread-1"
                className="h-5 w-5"
              />
            )}
            {category === "general" && (
              <Icon
                icon="streamline-ultimate-color:shopping-basket-3"
                className="h-5 w-5"
              />
            )}
            {category}
          </h3>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between rounded border p-3 ${item.completed ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleComplete(item.id)}
                    className="text-accent focus:ring-accent h-4 w-4 rounded"
                  />
                  <div>
                    <span
                      className={`font-medium ${item.completed ? "text-gray-400 line-through" : "text-primary"}`}
                    >
                      {item.name}
                    </span>
                    <span className="text-secondary ml-2 text-sm">
                      {item.amount} {item.unit}
                    </span>
                    {item.notes && (
                      <span className="block text-xs text-gray-500">
                        {item.notes}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-danger hover:text-opacity-80 transition-colors"
                  title="Remove item"
                >
                  <Icon icon="hugeicons:delete-03" className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
