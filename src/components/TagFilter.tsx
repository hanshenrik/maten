import React from "react";
import { navigate } from "astro:transitions/client";
import { Icon } from "./ui/Icon";
import { SearchableMultiSelect } from "./ui/SearchableSelect";
import { ui } from "../utils/icons";

interface TagFilterProps {
  /** Every tag that exists on at least one recipe in the list */
  allTags: string[];
  /** Tags currently filtering the list, read from the URL by the page */
  selected: string[];
}

/**
 * Filters a recipe list by multiple tags. The selection lives in the URL
 * (?tags=a&tags=b), so the page can render the filtered list on the server
 * and the filtered view stays shareable and survives a reload.
 */
export const TagFilter = ({ allTags, selected }: TagFilterProps) => {
  if (allTags.length === 0) return null;

  const setSelected = (tags: string[]) => {
    const url = new URL(window.location.href);
    url.searchParams.delete("tags");
    tags.forEach((tag) => url.searchParams.append("tags", tag));
    navigate(url.href);
  };

  const removeTag = (tag: string) =>
    setSelected(selected.filter((tag2) => tag2 !== tag));

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <SearchableMultiSelect
        className="w-full max-w-64"
        items={allTags}
        value={selected}
        onChange={setSelected}
        getKey={(tag) => tag}
        getLabel={(tag) => tag}
        ariaLabel="Filtrer på tags"
        placeholder="Filtrer på tags …"
        noResultsLabel="Ingen tags treff"
        renderItem={(tag, isSelected) => (
          <span className="flex items-center gap-2">
            <span className="w-4">
              {isSelected && (
                <Icon icon={ui.checked} className="text-primary h-4 w-4" />
              )}
            </span>
            {tag}
          </span>
        )}
      />
      {selected.map((tag) => (
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
  );
};
