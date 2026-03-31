"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { ContributionGrid } from "@/components/dashboard/ContributionGrid";
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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  // Trigger stale notification when we have data with stale tasks
  useEffect(() => {
    if (data?.staleTasks && data.staleTasks.length > 0) {
      triggerStaleNotification(data.staleTasks);
    }
  }, [data?.staleTasks]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertTriangle className="h-8 w-8" />
        <p className="text-sm">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { stats, activity, staleTasks, recentActivity } = data;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full">
      {/* Notification banner */}
      <NotificationBanner onDismiss={() => {}} />

      {/* Stale tasks alert */}
      {staleTasks.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex items-start gap-3">
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 hover:bg-primary/15 transition-colors"
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

      {/* Contribution grid */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Activity</h2>
        <ContributionGrid activity={activity} />
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h2>
          <ul className="divide-y divide-border">
            {recentActivity.map((t) => (
              <li key={t.id} className="py-2.5 flex items-center gap-3">
                <CheckCircle2
                  className={cn(
                    "h-4 w-4 shrink-0",
                    t.isDone ? "text-green-500" : "text-muted-foreground"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/boards/${t.boardId}`}
                    className="text-sm text-foreground hover:underline truncate block"
                  >
                    {t.title}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.boardName} · {t.columnName}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium shrink-0",
                    PRIORITY_COLOR[t.priority] ?? "text-muted-foreground"
                  )}
                >
                  {t.priority}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
