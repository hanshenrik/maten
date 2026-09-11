import React, { useId } from "react";
import { Field } from "./Field";
import { SearchableSelect } from "../ui/SearchableSelect";

/** The units you can pick for an ingredient or shopping list item. */
export const UNITS = ["stk", "kg", "g", "l", "ml", "ss", "ts"] as const;

interface UnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  label?: string;
  id?: string;
}

export const UnitSelect = ({
  value,
  onChange,
  className,
  inputClassName,
  label,
  id,
}: UnitSelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field htmlFor={selectId} label={label}>
      <SearchableSelect
        items={[...UNITS]}
        value={value}
        onChange={onChange}
        getKey={(unit) => unit}
        getLabel={(unit) => unit}
        id={selectId}
        ariaLabel={label ? undefined : "Enhet"}
        placeholder="Enhet"
        emptyLabel="Ingen"
        className={className}
        inputClassName={inputClassName}
      />
    </Field>
  );
};
