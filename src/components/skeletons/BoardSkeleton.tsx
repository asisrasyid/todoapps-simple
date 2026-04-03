import { Skeleton } from "@/components/ui/skeleton";

function BoardCardSkeleton() {
  return (
    <div className="relative flex h-36 flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4">
      {/* Top color accent */}
      <Skeleton className="absolute inset-x-0 top-0 h-1 rounded-t-xl rounded-b-none" />
      <div className="pt-2 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <BoardCardSkeleton key={i} />
      ))}
    </div>
  );
}
