import { SkeletonList } from "@/component/bersama/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-gray-200" />
      <SkeletonList count={8} />
    </div>
  );
}
