const colors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function Badge({
  variant = "default",
  children,
  "data-testid": testId,
}: {
  variant?: string;
  children: React.ReactNode;
  "data-testid"?: string;
}) {
  const colorClass = colors[variant] ?? "bg-gray-lighter text-gray-txt";
  return (
    <span
      data-testid={testId ?? `badge-${variant}`}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {children}
    </span>
  );
}
