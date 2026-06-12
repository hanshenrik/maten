import React from "react";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id: string;
};

export const Toggle = ({ checked, onChange, disabled, id }: ToggleProps) => (
  <label
    htmlFor={id}
    className="items-top relative inline-flex h-fit cursor-pointer"
  >
    <input
      id={id}
      type="checkbox"
      className="peer sr-only"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    <div className="peer bg-border peer-checked:bg-primary peer-focus:ring-primary/20 h-6 w-11 rounded-full peer-focus:ring-2 peer-focus:outline-none after:absolute after:inset-s-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white disabled:opacity-50 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700" />
  </label>
);
