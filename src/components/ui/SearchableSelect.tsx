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
  ariaLabel?: string;
  /** The id of the input, so a label can point at it */
  id?: string;
  /** Classes for the wrapper, e.g. its width */
  className?: string;
  /** Classes for the input itself, e.g. its background */
  inputClassName?: string;
}

/** Every word in the query must appear somewhere in the label */
function matches(label: string, query: string) {
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
  ariaLabel,
  id,
  className,
  inputClassName,
}: SearchableSelectProps<T>) {
  const [query, setQuery] = useState("");

  const selected = items.find((item) => getKey(item) === value) ?? null;
  const filtered = query
    ? items.filter((item) => matches(getLabel(item), query))
    : items;
  const leading = selected && renderLeading ? renderLeading(selected) : null;

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
            "border-border bg-surface text-text focus:ring-primary h-11 w-full rounded-xl border py-2 pr-10 transition-all outline-none focus:border-transparent focus:ring-2",
            leading ? "pl-12" : "pl-3",
            inputClassName,
          )}
        />
        <ComboboxButton
          aria-label="Vis alternativer"
          className="text-text-muted hover:text-text group absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center outline-none"
        >
          <Icon
            icon={ui.chevronDown}
            className="h-4 w-4 transition-transform group-data-open:rotate-180"
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
            <ComboboxOption
              value=""
              className="text-text-muted data-focus:bg-primary/5 cursor-pointer px-3 py-2 text-sm outline-none"
            >
              {emptyLabel}
            </ComboboxOption>
          )}
          {filtered.map((item) => (
            <ComboboxOption
              key={getKey(item)}
              value={getKey(item)}
              className="data-focus:bg-primary/5 data-selected:text-primary cursor-pointer px-3 py-2 outline-none"
            >
              {renderItem ? renderItem(item) : getLabel(item)}
            </ComboboxOption>
          ))}
          {filtered.length === 0 && (
            <div className="text-text-muted px-3 py-2 text-sm">
              {noResultsLabel}
            </div>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
