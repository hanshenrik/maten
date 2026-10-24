import React, { useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Icon } from "./Icon";
import { cn } from "../../utils/cn";
import { ui } from "../../utils/icons";

export interface SearchableSelectProps<T> {
  items: T[];
  /** Key of the selected item, or "" when nothing is selected */
  value: string;
  onChange: (value: string) => void;
  getKey: (item: T) => string;
  /** Text shown in the input and used for filtering */
  getLabel: (item: T) => string;
  /** Rich rendering of an option row. Defaults to the label. */
  renderItem?: (item: T) => React.ReactNode;
  /** Rendered inside the input, left of the text, for the selected item */
  renderLeading?: (item: T) => React.ReactNode;
  /** First option, which clears the selection. Omit to make the field required */
  emptyLabel?: string;
  placeholder?: string;
  noResultsLabel?: string;
  /** Offer the search query as a new value when it matches nothing */
  creatable?: boolean;
  /** Visual size: "default" matches the other form fields, "simple" is a more
   *  compact variant with smaller text and padding */
  look?: "default" | "simple";
  ariaLabel?: string;
  /** The id of the input, so a label can point at it */
  id?: string;
  /** Classes for the wrapper, e.g. its width */
  className?: string;
  /** Classes for the input itself, e.g. its background */
  inputClassName?: string;
}

/** Every word in the query must appear somewhere in the label */
export function matches(label: string, query: string) {
  const haystack = label.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function SearchableSelect<T>({
  items,
  value,
  onChange,
  getKey,
  getLabel,
  renderItem,
  renderLeading,
  emptyLabel,
  placeholder = "Søk …",
  noResultsLabel = "Ingen treff",
  creatable,
  look = "default",
  ariaLabel,
  id,
  className,
  inputClassName,
}: SearchableSelectProps<T>) {
  const [query, setQuery] = useState("");

  const compact = look === "simple";
  const optionClassName = compact
    ? "data-focus:bg-primary/5 data-selected:text-primary cursor-pointer px-2.5 py-1.5 text-sm outline-none"
    : "data-focus:bg-primary/5 data-selected:text-primary cursor-pointer px-3 py-2 outline-none";
  const emptyOptionClassName = compact
    ? "text-text-muted data-focus:bg-primary/5 cursor-pointer px-2.5 py-1.5 text-sm outline-none"
    : "text-text-muted data-focus:bg-primary/5 cursor-pointer px-3 py-2 text-sm outline-none";
  const noResultsClassName = compact
    ? "text-text-muted px-2.5 py-1.5 text-sm"
    : "text-text-muted px-3 py-2 text-sm";

  const selected = items.find((item) => getKey(item) === value) ?? null;
  const leading = selected && renderLeading ? renderLeading(selected) : null;
  const newOption = query.trim();
  const filtered = query
    ? items.filter((item) => matches(getLabel(item), query))
    : items;
  const isNewOption =
    !!creatable &&
    newOption !== "" &&
    !items.some(
      (item) => getLabel(item).toLowerCase() === newOption.toLowerCase(),
    );

  return (
    <Combobox
      value={value}
      onChange={(next) => onChange(next ?? "")}
      onClose={() => setQuery("")}
      immediate
    >
      <div className={cn("relative", className)}>
        {leading && (
          <div className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2">
            {leading}
          </div>
        )}
        <ComboboxInput
          id={id}
          aria-label={ariaLabel}
          placeholder={placeholder}
          displayValue={() => (selected ? getLabel(selected) : "")}
          onChange={(event) => setQuery(event.target.value)}
          // Select the current title so typing starts a fresh search
          onFocus={(event) => event.target.select()}
          className={cn(
            "border-border bg-surface text-text focus:ring-primary w-full border transition-all outline-none focus:border-transparent focus:ring-2",
            compact
              ? "h-9 rounded-lg py-1 pr-8 text-sm"
              : "h-11 rounded-xl py-2 pr-10",
            leading
              ? compact
                ? "pl-10"
                : "pl-12"
              : compact
                ? "pl-2.5"
                : "pl-3",
            inputClassName,
          )}
        />
        <ComboboxButton
          aria-label="Vis alternativer"
          className={cn(
            "text-text-muted hover:text-text group absolute inset-y-0 right-0 flex cursor-pointer items-center justify-center outline-none",
            compact ? "w-8" : "w-10",
          )}
        >
          <Icon
            icon={ui.chevronDown}
            className={cn(
              "transition-transform group-data-open:rotate-180",
              compact ? "h-3.5 w-3.5" : "h-4 w-4",
            )}
          />
        </ComboboxButton>

        <ComboboxOptions
          anchor={{ to: "bottom start", gap: 4, padding: 8 }}
          // Kept in the DOM (hidden) when closed, so the combobox input always
          // has the `aria-controls` its role requires
          unmount={false}
          className="border-border bg-surface z-50 max-h-72 w-(--input-width) overflow-auto rounded-xl border shadow-lg outline-none"
        >
          {emptyLabel && !query && (
            <ComboboxOption value="" className={emptyOptionClassName}>
              {emptyLabel}
            </ComboboxOption>
          )}
          {filtered.map((item) => (
            <ComboboxOption
              key={getKey(item)}
              value={getKey(item)}
              className={optionClassName}
            >
              {renderItem ? renderItem(item) : getLabel(item)}
            </ComboboxOption>
          ))}
          {isNewOption && (
            <ComboboxOption value={newOption} className={optionClassName}>
              Bruk «{newOption}»
            </ComboboxOption>
          )}
          {filtered.length === 0 && !isNewOption && (
            <div className={noResultsClassName}>{noResultsLabel}</div>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
