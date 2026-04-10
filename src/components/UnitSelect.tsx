import React from "react";

interface UnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const UnitSelect: React.FC<UnitSelectProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const units = [
    { value: "", label: "" },
    { value: "stk", label: "stk" },
    { value: "kg", label: "kg" },
    { value: "g", label: "g" },
    { value: "l", label: "l" },
    { value: "ml", label: "ml" },
    { value: "ss", label: "ss" },
    { value: "ts", label: "ts" },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${className}`}
    >
      {units.map((unit) => (
        <option key={unit.value} value={unit.value}>
          {unit.label}
        </option>
      ))}
    </select>
  );
};
