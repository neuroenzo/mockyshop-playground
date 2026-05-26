"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  testId?: string;
}

const variants: Record<string, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover focus:ring-primary",
  secondary: "bg-white text-gray-txt border border-gray-line hover:bg-gray-lighter focus:ring-primary",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  ghost: "bg-transparent text-gray-txt hover:bg-gray-lighter focus:ring-gray-500",
};

const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  testId,
  ...props
}: ButtonProps) {
  return (
    <button
      data-testid={testId ?? `btn-${variant}`}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
