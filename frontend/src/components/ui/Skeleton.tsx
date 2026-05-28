"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-lighter ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-line overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="rounded-lg border border-gray-line p-6 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <Skeleton className="h-72 w-72 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
