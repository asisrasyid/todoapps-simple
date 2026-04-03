import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Skeleton className="h-7 w-7 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:p-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Alert row */}
      <Skeleton className="h-12 w-full rounded-xl shrink-0" />

      {/* Activity + Recent Activity */}
      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {/* Contribution grid card */}
        <div className="flex flex-1 flex-col rounded-xl border border-border bg-card p-4 md:p-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="flex-1 w-full rounded-lg min-h-[120px]" />
        </div>
        {/* Recent activity card */}
        <div className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card p-4 md:p-5 space-y-2">
          <Skeleton className="h-4 w-32 mb-2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <ActivityItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
