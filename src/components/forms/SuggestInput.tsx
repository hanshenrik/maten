import React, { useId, useState } from "react";
import { Field, inputClassName } from "./Field";
import { matches } from "../ui/SearchableSelect";

interface SuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Values offered while typing, e.g. what's been bought before */
  suggestions: string[];
  className?: string;
  label?: string;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

/** A plain text input that suggests matching values from a list once you've
 *  typed a few characters. Enter submits the form like any other text field;
 *  suggestions are picked with the mouse or by typing the full value. */
export const SuggestInput = ({
  value,
  onChange,
  suggestions,
  className,
  label,
  id,
  placeholder,
  autoFocus,
  inputRef,
}: SuggestInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const query = value.trim();
  // The value itself isn't a suggestion: once you've picked or typed a full
  // value, only alternatives that complete it differently remain
  const matching = suggestions.filter(
    (suggestion) =>
      matches(suggestion, query) &&
      suggestion.toLowerCase() !== query.toLowerCase(),
  );
  const showSuggestions =
    focused && query.length >= 3 && matching.length > 0 && value !== dismissed;

  return (
    <Field htmlFor={inputId} label={label} className={className}>
      <div className="relative">
        <input
          id={inputId}
          ref={inputRef}
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="done"
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setDismissed(value);
          }}
          className={inputClassName}
        />
        {showSuggestions && (
          <ul
            role="listbox"
            className="border-border bg-surface absolute top-full left-0 z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border py-1 shadow-lg outline-none"
          >
            {matching.map((suggestion) => (
              <li key={suggestion} role="option" aria-selected={false}>
                <button
                  type="button"
                  tabIndex={-1}
                  // Must pick before the input blurs, or the popup is gone
                  // before the click lands
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onChange(suggestion);
                  }}
                  className="hover:bg-primary/5 w-full cursor-pointer px-3 py-1.5 text-left text-sm outline-none"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
};
