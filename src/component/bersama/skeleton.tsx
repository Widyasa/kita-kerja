/**
 * Skeleton UI components for loading states
 */

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 h-4 w-3/4 rounded bg-gray-200" />
      <div className="mb-2 h-3 w-full rounded bg-gray-200" />
      <div className="mb-2 h-3 w-5/6 rounded bg-gray-200" />
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-20 rounded bg-gray-200" />
        <div className="h-8 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-100 bg-white p-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="mb-2 h-3 w-1/3 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse h-3 rounded bg-gray-200"
          style={{ width: `${85 + Math.random() * 15}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="animate-pulse">
      <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gray-200" />
      <div className="mx-auto mb-2 h-4 w-32 rounded bg-gray-200" />
      <div className="mx-auto h-3 w-24 rounded bg-gray-200" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="mb-3 flex gap-4 border-b border-gray-200 pb-3">
        <div className="h-4 w-1/4 rounded bg-gray-200" />
        <div className="h-4 w-1/4 rounded bg-gray-200" />
        <div className="h-4 w-1/4 rounded bg-gray-200" />
        <div className="h-4 w-1/4 rounded bg-gray-200" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="mb-2 flex gap-4 py-2">
          <div className="h-3 w-1/4 rounded bg-gray-200" />
          <div className="h-3 w-1/4 rounded bg-gray-200" />
          <div className="h-3 w-1/4 rounded bg-gray-200" />
          <div className="h-3 w-1/4 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
