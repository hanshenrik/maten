import React, { useId } from "react";
import { Icon } from "../ui/Icon";
import { SearchableSelect } from "../ui/SearchableSelect";
import { ui } from "../../utils/icons";
import { Field } from "./Field";

interface TagSelectProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  /** Tags the household already uses, offered while searching */
  suggestions: string[];
  className?: string;
}

/** Picks any number of tags for a recipe, one SearchableSelect pick at a time. */
export const TagSelect = ({
  label = "Tags",
  value,
  onChange,
  suggestions,
  className,
}: TagSelectProps) => {
  const id = useId();

  // Tags already on the recipe are removed as chips, not re-picked
  const items = suggestions.filter((tag) => !value.includes(tag));

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (value.some((tag2) => tag2.toLowerCase() === trimmed.toLowerCase()))
      return;
    onChange([...value, trimmed]);
  };

  const removeTag = (tag: string) =>
    onChange(value.filter((tag2) => tag2 !== tag));

  return (
    <Field htmlFor={id} label={label} className={className}>
      <SearchableSelect
        items={items}
        // Stays empty: picking a tag adds it as a chip below
        value=""
        onChange={(tag) => tag && addTag(tag)}
        getKey={(tag) => tag}
        getLabel={(tag) => tag}
        id={id}
        ariaLabel={label}
        placeholder="Legg til en tag …"
        creatable
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((tag) => (
            <span
              key={tag}
              className="bg-primary/10 text-primary flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                aria-label={`Fjern ${tag}`}
                onClick={() => removeTag(tag)}
                className="hover:text-text cursor-pointer outline-none"
              >
                <Icon icon={ui.x} className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </Field>
  );
};
