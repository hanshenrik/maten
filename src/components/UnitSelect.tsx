import React from "react";

interface UnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}

export const UnitSelect: React.FC<UnitSelectProps> = ({
  value,
  onChange,
  className = "",
  label,
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
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-text-muted block text-sm">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`border-border bg-surface text-text focus:ring-primary h-10 rounded-xl border px-3 py-2 transition-all outline-none focus:border-transparent focus:ring-2 ${className}`}
      >
        {units.map((unit) => (
          <option key={unit.value} value={unit.value}>
            {unit.label}
          </option>
        ))}
      </select>
    </div>
  );
};
