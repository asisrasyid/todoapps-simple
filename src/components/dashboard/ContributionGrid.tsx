"use client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ContributionGridProps {
  activity: Record<string, number>;
}

const LEVELS = [
  "bg-accent/40",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/65",
  "bg-primary",
] as const;

function level(count: number) {
  if (count === 0) return LEVELS[0];
  if (count <= 2) return LEVELS[1];
  if (count <= 4) return LEVELS[2];
  if (count <= 7) return LEVELS[3];
  return LEVELS[4];
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export function ContributionGrid({ activity }: ContributionGridProps) {
  const { weeks, monthLabels, total } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from Sunday 52 weeks ago
    const start = new Date(today);
    start.setDate(start.getDate() - 52 * 7 - start.getDay());

    const weeks: { date: Date; count: number; key: string }[][] = [];
    const monthLabels: { label: string; col: number }[] = [];
    const cursor = new Date(start);
    let lastMonth = -1;

    for (let w = 0; w < 53; w++) {
      const week: { date: Date; count: number; key: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(cursor);
        const key = date.toISOString().slice(0, 10);
        week.push({ date, count: activity[key] ?? 0, key });
        if (d === 0 && date.getMonth() !== lastMonth) {
          monthLabels.push({
            label: date.toLocaleDateString("en-US", { month: "short" }),
            col: w,
          });
          lastMonth = date.getMonth();
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    const total = Object.values(activity).reduce((s, v) => s + v, 0);
    return { weeks, monthLabels, total };
  }, [activity]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> activities in the last year
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          {LEVELS.map((l, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-sm", l)} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1 min-w-max select-none">
          {/* Month labels */}
          <div className="flex gap-[3px] ml-7 h-4 relative text-[10px] text-muted-foreground">
            {monthLabels.map((m) => (
              <div
                key={m.label + m.col}
                className="absolute"
                style={{ left: `${m.col * 15}px` }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1 text-[10px] text-muted-foreground w-6">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="h-3 flex items-center justify-end pr-1">
                  {label}
                </div>
              ))}
            </div>

            {/* Columns (weeks) */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.key}
                    className={cn(
                      "h-3 w-3 rounded-sm transition-opacity cursor-default",
                      level(day.count),
                      day.date > new Date() && "opacity-0"
                    )}
                    title={
                      day.count > 0
                        ? `${day.key}: ${day.count} ${day.count === 1 ? "activity" : "activities"}`
                        : day.key
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
