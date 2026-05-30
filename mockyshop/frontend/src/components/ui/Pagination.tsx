"use client";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  size: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pages, total, size, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  return (
    <div data-testid="pagination" className="flex items-center justify-between border-t border-gray-line px-4 py-3 sm:px-6">
      <div className="text-sm text-gray-txt">
        Showing <span className="font-medium">{from}</span> to <span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </div>
      <div className="flex gap-2">
        <button
          data-testid="pagination-prev"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-gray-line px-3 py-1 text-sm font-medium text-gray-txt hover:bg-gray-lighter disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
          .map((p, idx, arr) => (
            <span key={p}>
              {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-line">...</span>}
              <button
                data-testid={`pagination-page-${p}`}
                onClick={() => onPageChange(p)}
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  p === page
                    ? "bg-primary text-white"
                    : "border border-gray-line text-gray-txt hover:bg-gray-lighter"
                }`}
              >
                {p}
              </button>
            </span>
          ))}
        <button
          data-testid="pagination-next"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="rounded-md border border-gray-line px-3 py-1 text-sm font-medium text-gray-txt hover:bg-gray-lighter disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
