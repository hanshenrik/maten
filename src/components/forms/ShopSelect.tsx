import React, { useId } from "react";
import { Field } from "./Field";
import { SearchableSelect } from "../ui/SearchableSelect";

/** Shops offered by default when picking where to buy something. */
export const DEFAULT_SHOPS = [
  "Extra",
  "Kiwi",
  "Rema",
  "Bunnpris",
  "Clas",
  "Apotek 1",
] as const;

interface ShopSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  id?: string;
}

export const ShopSelect = ({
  value,
  onChange,
  className,
  label = "Butikk",
  id,
}: ShopSelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  // A previously chosen shop isn't necessarily one of the defaults, but it
  // must still show up as selected and stay pickable
  const shops =
    value && !(DEFAULT_SHOPS as readonly string[]).includes(value)
      ? [...DEFAULT_SHOPS, value]
      : [...DEFAULT_SHOPS];

  return (
    <Field htmlFor={selectId} label={label} className={className}>
      <SearchableSelect
        items={shops}
        value={value}
        onChange={onChange}
        getKey={(shop) => shop}
        getLabel={(shop) => shop}
        id={selectId}
        ariaLabel={label ? undefined : "Butikk"}
        placeholder=""
        emptyLabel="Uten butikk"
        creatable
      />
    </Field>
  );
};
