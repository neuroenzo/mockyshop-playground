"use client";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  testId?: string;
}

export function Select({ label, options, placeholder, id, testId, className = "", ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-txt">
          {label}
        </label>
      )}
      <select
        id={selectId}
        data-testid={testId ?? (props.name ? `select-${props.name}` : undefined)}
        className={`block w-full rounded-md border border-gray-line px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
