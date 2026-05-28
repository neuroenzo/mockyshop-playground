"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-gray-txt" data-testid="breadcrumbs">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-2">
          {idx > 0 && <span className="text-gray-line">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-dark font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
