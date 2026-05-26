"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  testId?: string;
}

export function Input({ label, error, id, testId, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-txt">
          {label}
        </label>
      )}
      <input
        id={inputId}
        data-testid={testId ?? (props.name ? `input-${props.name}` : undefined)}
        className={`
          block w-full rounded-md border px-3 py-2 text-sm shadow-sm
          placeholder:text-gray-line focus:outline-none focus:ring-2 focus:ring-primary
          ${error ? "border-red-500 focus:ring-red-500" : "border-gray-line"}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-600" data-testid={`error-${props.name}`}>{error}</p>}
    </div>
  );
}
