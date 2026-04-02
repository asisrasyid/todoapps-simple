"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { ContributionGrid } from "@/components/dashboard/ContributionGrid";
import { ActivityFilter, DateRange } from "@/components/dashboard/ActivityFilter";
import { Topbar } from "@/components/layout/Topbar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  NotificationBanner,
  triggerStaleNotification,
} from "@/components/NotificationManager";
import { isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-green-500",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
      <div className={cn("rounded-lg p-2.5", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useDashboard();
  const [filterRange, setFilterRange] = useState<DateRange>({ from: "", to: "" });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (data?.staleTasks && data.staleTasks.length > 0) {
      triggerStaleNotification(data.staleTasks);
    }
  }, [data?.staleTasks]);

  const hasFilter = Boolean(filterRange.from || filterRange.to);

  const filteredActivity = useMemo(() => {
    if (!data) return {};
    const { from, to } = filterRange;
    if (!from && !to) return data.activity;
    return Object.fromEntries(
      Object.entries(data.activity).filter(([date]) => {
        if (from && date < from) return false;
        if (to && date > to) return false;
        return true;
      })
    );
  }, [data, filterRange]);

  const filteredRecentActivity = useMemo(() => {
    if (!data) return [];
    const { from, to } = filterRange;
    if (!from && !to) return data.recentActivity;
    return data.recentActivity.filter((t) => {
      const date = t.updatedAt.slice(0, 10);
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    });
  }, [data, filterRange]);

  const activityRangeLabel = useMemo(() => {
    const { from, to } = filterRange;
    if (!from && !to) return undefined;
    const fmtDate = (d: string) =>
      new Date(d + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    if (from && to) return `activities from ${fmtDate(from)} to ${fmtDate(to)}`;
    if (from) return `activities from ${fmtDate(from)}`;
    return `activities up to ${fmtDate(to)}`;
  }, [filterRange]);

  const filterActions = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            hasFilter
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {hasFilter ? "Filtered" : "Filter"}
          {hasFilter && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="text-xs font-semibold text-foreground mb-3">Filter Activity</p>
        <ActivityFilter value={filterRange} onChange={setFilterRange} />
      </PopoverContent>
    </Popover>
  );

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Topbar title="Dashboard" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Topbar title="Dashboard" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm">Failed to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const { stats, staleTasks } = data;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Topbar title="Dashboard" actions={filterActions} />

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:p-5">
        {/* Notification banner */}
        <NotificationBanner onDismiss={() => {}} />

        {/* Stale tasks alert */}
        {staleTasks.length > 0 && (
          <div className="shrink-0 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {staleTasks.length} task{staleTasks.length > 1 ? "s" : ""} need attention
              </p>
              <ul className="mt-1 space-y-0.5">
                {staleTasks.slice(0, 3).map((t) => (
                  <li key={t.id} className="text-xs text-muted-foreground truncate">
                    <Link
                      href={`/boards/${t.boardId}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {t.title}
                    </Link>
                    <span className="ml-1 text-yellow-500/80">
                      · idle {t.daysSinceUpdate}d in {t.boardName}
                    </span>
                  </li>
                ))}
                {staleTasks.length > 3 && (
                  <li className="text-xs text-muted-foreground">
                    +{staleTasks.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="shrink-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total Tasks"
            value={stats.total}
            icon={TrendingUp}
            color="bg-primary/15 text-primary"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            color="bg-green-500/15 text-green-500"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={Clock}
            color="bg-blue-500/15 text-blue-500"
          />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            icon={AlertTriangle}
            color="bg-red-500/15 text-red-500"
          />
        </div>

        {/* Pending approvals badge */}
        {stats.pendingApprovals > 0 && (
          <Link
            href="/approvals"
            className="shrink-0 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 hover:bg-primary/15 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">{stats.pendingApprovals}</span> pending approval
                {stats.pendingApprovals > 1 ? "s" : ""} waiting for review
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
          </Link>
        )}

        {/* Activity + Recent Activity — side by side, each scrollable */}
        <div className="flex-1 min-h-0 grid grid-cols-1 gap-4 md:grid-cols-[1fr_300px]">
          {/* Contribution grid card */}
          <div className="flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-border bg-card p-4 md:min-h-0 md:p-5">
            <h2 className="mb-4 shrink-0 text-sm font-semibold text-foreground">Activity</h2>
            <div className="flex-1 overflow-auto">
              <ContributionGrid activity={filteredActivity} rangeLabel={activityRangeLabel} />
            </div>
          </div>

          {/* Recent activity card */}
          <div className="flex min-h-[200px] flex-col overflow-hidden rounded-xl border border-border bg-card p-4 md:min-h-0 md:p-5">
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
              {hasFilter && (
                <span className="text-xs text-muted-foreground">
                  {filteredRecentActivity.length} result{filteredRecentActivity.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {filteredRecentActivity.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-xs text-muted-foreground">No activity in this range</p>
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-border overflow-y-auto">
                {filteredRecentActivity.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        t.isDone ? "text-green-500" : "text-muted-foreground"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/boards/${t.boardId}`}
                        className="block truncate text-sm text-foreground hover:underline"
                      >
                        {t.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.boardName} · {t.columnName}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-medium",
                        PRIORITY_COLOR[t.priority] ?? "text-muted-foreground"
                      )}
                    >
                      {t.priority}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
