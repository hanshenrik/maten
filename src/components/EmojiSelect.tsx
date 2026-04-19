import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { ui } from "../utils/icons";

interface EmojiItem {
  emoji: string;
  name: string;
}

const COMMON_FOOD_EMOJIS: EmojiItem[] = [
  // Fruits
  { emoji: "🍎", name: "Eple" },
  { emoji: "🍏", name: "Grønt eple" },
  { emoji: "🍐", name: "Pære" },
  { emoji: "🍊", name: "Appelsin" },
  { emoji: "🍋", name: "Sitron" },
  { emoji: "🍌", name: "Banan" },
  { emoji: "🍉", name: "Vannmelon" },
  { emoji: "🍇", name: "Druer" },
  { emoji: "🍓", name: "Jordbær" },
  { emoji: "🫐", name: "Blåbær" },
  { emoji: "🍈", name: "Melon" },
  { emoji: "🍒", name: "Kirsebær" },
  { emoji: "🍑", name: "Fersken" },
  { emoji: "🥭", name: "Mango" },
  { emoji: "🍍", name: "Ananas" },
  { emoji: "🥥", name: "Kokosnøtt" },
  { emoji: "🥝", name: "Kiwi" },
  { emoji: "🍅", name: "Tomat" },
  // Vegetables
  { emoji: "🍆", name: "Aubergine" },
  { emoji: "🥑", name: "Avokado" },
  { emoji: "🥦", name: "Brokkoli" },
  { emoji: "🥬", name: "Salat" },
  { emoji: "🥒", name: "Agurk" },
  { emoji: "🌶️", name: "Chili" },
  { emoji: "🫑", name: "Paprika" },
  { emoji: "🌽", name: "Mais" },
  { emoji: "🥕", name: "Gulrot" },
  { emoji: "🧅", name: "Løk" },
  { emoji: "🧄", name: "Hvitløk" },
  { emoji: "🥔", name: "Potet" },
  { emoji: "🍠", name: "Søtpotet" },
  // Grains & Bread
  { emoji: "🥐", name: "Croissant" },
  { emoji: "🍞", name: "Brød" },
  { emoji: "🥖", name: "Baguette" },
  { emoji: "🥨", name: "Pretzel" },
  { emoji: "🥯", name: "Bagel" },
  { emoji: "🥞", name: "Pannekake" },
  { emoji: "🧇", name: "Vaffel" },
  { emoji: "🍚", name: "Ris" },
  { emoji: "🍝", name: "Pasta" },
  { emoji: "🍜", name: "Nudler" },
  // Protein & Dairy
  { emoji: "🧀", name: "Ost" },
  { emoji: "🍖", name: "Kjøtt" },
  { emoji: "🍗", name: "Kylling" },
  { emoji: "🥩", name: "Biff" },
  { emoji: "🥓", name: "Bacon" },
  { emoji: "🍔", name: "Burger" },
  { emoji: "🍟", name: "Pommes frites" },
  { emoji: "🍕", name: "Pizza" },
  { emoji: "🌭", name: "Pølse" },
  { emoji: "🌮", name: "Taco" },
  { emoji: "🌯", name: "Burrito" },
  { emoji: "🥙", name: "Kebab" },
  { emoji: "🥚", name: "Egg" },
  { emoji: "🥘", name: "Gryte" },
  { emoji: "🍲", name: "Suppe" },
  { emoji: "🥣", name: "Bolle" },
  { emoji: "🥗", name: "Salat" },
  { emoji: "🍤", name: "Reker" },
  { emoji: "🦞", name: "Hummer" },
  { emoji: "🦀", name: "Krabbe" },
  { emoji: "🦑", name: "Blekksprut" },
  { emoji: "🍣", name: "Sushi" },
  // Sweets & Drinks
  { emoji: "💧", name: "Vann" },
  { emoji: "🍦", name: "Is" },
  { emoji: "🍩", name: "Donut" },
  { emoji: "🍪", name: "Kjeks" },
  { emoji: "🎂", name: "Kake" },
  { emoji: "🧁", name: "Cupcake" },
  { emoji: "🥧", name: "Pai" },
  { emoji: "🍫", name: "Sjokolade" },
  { emoji: "🍯", name: "Honning" },
  { emoji: "🥛", name: "Melk" },
  { emoji: "☕", name: "Kaffe" },
  { emoji: "🍵", name: "Te" },
  { emoji: "🧃", name: "Juice" },
  { emoji: "🥤", name: "Brus" },
  { emoji: "🥫", name: "Hermetikk" },
  { emoji: "🧈", name: "Smør" },
  // Spices
  { emoji: "🪴", name: "Urter" },
  { emoji: "🫚", name: "Ingefær" },
  { emoji: "🧂", name: "Salt" },
  { emoji: "⚫️", name: "Pepper" },
];

interface EmojiSelectProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export const EmojiSelect: React.FC<EmojiSelectProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmojis = COMMON_FOOD_EMOJIS.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.emoji.includes(searchTerm),
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border-border bg-surface text-text hover:border-primary focus:ring-primary flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition-all outline-none focus:border-transparent focus:ring-2"
        title="Velg emoji"
      >
        {value ? (
          <span className="text-xl">{value}</span>
        ) : (
          <Icon icon={ui.emojis} className="text-text-muted h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div className="animate-in fade-in zoom-in border-border bg-surface absolute left-0 z-50 mt-2 w-64 rounded-xl border p-2 duration-200">
          <div className="border-border focus-within:ring-primary mb-2 flex items-center gap-2 rounded-xl border px-2 py-1 focus-within:ring-2">
            <Icon
              icon="hugeicons:search-01"
              className="text-text-muted h-4 w-4"
            />
            <input
              type="text"
              autoFocus
              placeholder="Søk emoji..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-text w-full bg-transparent text-sm outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-text-muted hover:text-text"
              >
                <Icon icon={ui.cancel} className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="custom-scrollbar grid max-h-48 grid-cols-6 gap-1 overflow-y-auto p-1">
            <button
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearchTerm("");
              }}
              className="hover:bg-bg flex h-8 w-8 items-center justify-center rounded"
              title="Ingen emoji"
            >
              <Icon
                icon="hugeicons:cancel-01"
                className="text-text-muted h-4 w-4"
              />
            </button>
            {filteredEmojis.map((item) => (
              <button
                key={item.emoji}
                onClick={() => {
                  onChange(item.emoji);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className={`hover:bg-bg flex h-8 w-8 items-center justify-center rounded text-lg transition-colors ${
                  value === item.emoji ? "bg-bg ring-primary ring-1" : ""
                }`}
                title={item.name}
              >
                {item.emoji}
              </button>
            ))}
          </div>
          {filteredEmojis.length === 0 && (
            <div className="text-text-muted py-2 text-center text-xs">
              Ingen emojis funnet
            </div>
          )}
        </div>
      )}
    </div>
  );
};
