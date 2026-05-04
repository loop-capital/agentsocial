"use client";

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function DateRangePicker({ value, onChange, options }: DateRangePickerProps) {
  return (
    <div className="date-range-picker">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`date-range-btn${value === opt.value ? " active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}