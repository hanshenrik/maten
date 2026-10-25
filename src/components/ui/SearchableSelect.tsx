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
  ariaLabel?: string;
  /** The id of the input, so a label can point at it */
  id?: string;
  /** Classes for the wrapper, e.g. its width */
  className?: string;
  /** Classes for the input itself, e.g. its background */
  inputClassName?: string;
}

/** Shared look of the option rows in the dropdown */
const optionClassName =
  "data-focus:bg-primary/5 data-selected:text-primary cursor-pointer px-2.5 py-1.5 text-sm outline-none";
const noResultsClassName = "text-text-muted px-2.5 py-1.5 text-sm";

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
  ariaLabel,
  id,
  className,
  inputClassName,
}: SearchableSelectProps<T>) {
  const [query, setQuery] = useState("");

  const emptyOptionClassName =
    "text-text-muted data-focus:bg-primary/5 cursor-pointer px-2.5 py-1.5 text-sm outline-none";

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
            // 16px font: smaller text makes iOS Safari auto-zoom on focus
            "border-border bg-surface text-text focus:ring-primary h-9 w-full rounded-lg border py-1 pr-8 text-base transition-all outline-none focus:border-transparent focus:ring-2",
            leading ? "pl-10" : "pl-2.5",
            inputClassName,
          )}
        />
        <ComboboxButton
          aria-label="Vis alternativer"
          className="text-text-muted hover:text-text group absolute inset-y-0 right-0 flex w-8 cursor-pointer items-center justify-center outline-none"
        >
          <Icon
            icon={ui.chevronDown}
            className="h-3.5 w-3.5 transition-transform group-data-open:rotate-180"
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

export interface SearchableMultiSelectProps<T> {
  items: T[];
  /** Keys of the selected items */
  value: string[];
  onChange: (value: string[]) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  /** Rich rendering of an option row; `selected` says if it is picked */
  renderItem?: (item: T, selected: boolean) => React.ReactNode;
  placeholder?: string;
  noResultsLabel?: string;
  ariaLabel?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
}

/** SearchableSelect's multi-pick sibling: every option toggles a selection. */
export function SearchableMultiSelect<T>({
  items,
  value,
  onChange,
  getKey,
  getLabel,
  renderItem,
  placeholder = "Søk …",
  noResultsLabel = "Ingen treff",
  ariaLabel,
  id,
  className,
  inputClassName,
}: SearchableMultiSelectProps<T>) {
  const [query, setQuery] = useState("");

  const selectedKeys = new Set(value);
  const filtered = query
    ? items.filter((item) => matches(getLabel(item), query))
    : items;

  return (
    <Combobox
      multiple
      value={value}
      onChange={(next) => onChange(next ?? [])}
      onClose={() => setQuery("")}
      immediate
    >
      <div className={cn("relative", className)}>
        <ComboboxInput
          id={id}
          aria-label={ariaLabel}
          placeholder={placeholder}
          // Selection is shown outside the input, so the field stays a
          // clean search box
          displayValue={() => ""}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={(event) => event.target.select()}
          className={cn(
            // 16px font: smaller text makes iOS Safari auto-zoom on focus
            "border-border bg-surface text-text focus:ring-primary h-9 w-full rounded-lg border py-1 pr-8 pl-2.5 text-base transition-all outline-none focus:border-transparent focus:ring-2",
            inputClassName,
          )}
        />
        <ComboboxButton
          aria-label="Vis alternativer"
          className="text-text-muted hover:text-text group absolute inset-y-0 right-0 flex w-8 cursor-pointer items-center justify-center outline-none"
        >
          <Icon
            icon={ui.chevronDown}
            className="h-3.5 w-3.5 transition-transform group-data-open:rotate-180"
          />
        </ComboboxButton>

        <ComboboxOptions
          anchor={{ to: "bottom start", gap: 4, padding: 8 }}
          // Kept in the DOM (hidden) when closed, so the combobox input always
          // has the `aria-controls` its role requires
          unmount={false}
          className="border-border bg-surface z-50 max-h-72 w-(--input-width) overflow-auto rounded-xl border shadow-lg outline-none"
        >
          {filtered.map((item) => {
            const key = getKey(item);
            return (
              <ComboboxOption key={key} value={key} className={optionClassName}>
                {renderItem
                  ? renderItem(item, selectedKeys.has(key))
                  : getLabel(item)}
              </ComboboxOption>
            );
          })}
          {filtered.length === 0 && (
            <div className={noResultsClassName}>{noResultsLabel}</div>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
