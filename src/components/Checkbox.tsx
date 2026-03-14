import React from "react";
import { Icon } from "@iconify/react";

interface CheckboxProps {
  checked: boolean;
  onChange?: () => void;
  label?: string;
  subLabel?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  subLabel,
}) => {
  return (
    <div
      onClick={onChange}
      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
        checked
          ? "border-green-100 bg-green-50 opacity-60"
          : "border-gray-100 bg-gray-50 hover:border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            checked
              ? "border-green-500 bg-green-500 text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          {checked && <Icon icon="hugeicons:tick-01" className="h-4 w-4" />}
        </div>
        <div>
          {label && (
            <span
              className={`font-medium ${checked ? "text-gray-400 line-through" : "text-gray-900"}`}
            >
              {label}
            </span>
          )}
          {subLabel && (
            <span className="ml-2 text-sm text-gray-500">{subLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
};
