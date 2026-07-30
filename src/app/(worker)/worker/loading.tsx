import { SkeletonList, SkeletonProfile } from "@/component/bersama/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <SkeletonProfile />
      <div className="mt-8">
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200" />
        <SkeletonList count={5} />
      </div>
    </div>
  );
}
