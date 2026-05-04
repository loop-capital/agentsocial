"use client";

import { useState } from "react";

interface MetricSelectorProps {
  selected: string[];
  options: { value: string; label: string }[];
  onChange: (selected: string[]) => void;
}

export function MetricSelector({ selected, options, onChange }: MetricSelectorProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="metric-selector">
      {options.map((opt) => (
        <label key={opt.value} className="metric-option">
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="metric-checkbox"
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  options?: { value: string; label: string }[];
}

export function DateRangePicker({ value, onChange, options }: DateRangePickerProps) {
  const defaults = options ?? [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
  ];

  return (
    <div className="date-range-picker">
      {defaults.map((opt) => (
        <button
          key={opt.value}
          className={`date-range-btn ${value === opt.value ? "active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
