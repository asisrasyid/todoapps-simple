import { Skeleton } from "@/components/ui/skeleton";

function TaskCardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card border-l-2 border-l-muted p-3 pl-5 space-y-2">
      <Skeleton className="h-3.5 w-full" />
      {lines > 1 && <Skeleton className="h-3.5 w-4/5" />}
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
}

function ColumnSkeleton({ taskCount = 3 }: { taskCount?: number }) {
  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl border border-border bg-card/50">
      <div className="h-0.5 rounded-t-xl bg-muted/60" />
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <Skeleton className="h-2.5 w-2.5 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-5 w-6 rounded-full" />
      </div>
      {/* Tasks */}
      <div className="flex-1 px-3 pb-3 space-y-2">
        {Array.from({ length: taskCount }).map((_, i) => (
          <TaskCardSkeleton key={i} lines={i % 3 === 1 ? 1 : 2} />
        ))}
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="flex h-full gap-3 overflow-x-hidden px-6 py-4">
      <ColumnSkeleton taskCount={4} />
      <ColumnSkeleton taskCount={3} />
      <ColumnSkeleton taskCount={5} />
      <ColumnSkeleton taskCount={2} />
    </div>
  );
}
