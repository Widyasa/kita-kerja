import { SkeletonCard } from "@/component/bersama/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-8 h-10 w-96 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
