"use client";

import { ReactNode } from "react";

interface MetricSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function MetricSelector({ value, onChange, options }: MetricSelectorProps) {
  return (
    <div className="metric-selector">
      {options.map((opt) => (
        <label key={opt.value} className="metric-option">
          <input
            type="radio"
            className="metric-checkbox"
            name="metric"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={{ width: 14, height: 14, accentColor: "#3b82f6" }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}