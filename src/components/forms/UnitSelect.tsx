import React, { useId } from "react";
import { cn } from "../../utils/cn";
import { Field, inputClassName } from "./Field";

/** The units you can pick for an ingredient or shopping list item. */
export const UNITS = ["", "stk", "kg", "g", "l", "ml", "ss", "ts"] as const;

interface UnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  id?: string;
}

export const UnitSelect = ({
  value,
  onChange,
  className,
  label,
  id,
}: UnitSelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field htmlFor={selectId} label={label}>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label ? undefined : "Enhet"}
        className={cn(inputClassName, className)}
      >
        {UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    </Field>
  );
};
