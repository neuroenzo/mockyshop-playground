import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  children,
  "data-testid": testId,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  "data-testid"?: string;
}) {
  return (
    <div data-testid={testId ?? "empty-state"} className="text-center py-12">
      <svg className="mx-auto h-12 w-12 text-gray-line" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 className="mt-2 text-sm font-semibold text-gray-dark">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-txt">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
