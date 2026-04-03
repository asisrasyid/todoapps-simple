"use client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getDaysInMonth, getDay, startOfMonth, isToday as dateFnsIsToday } from "date-fns";

interface ContributionGridProps {
  activity: Record<string, number>;
  rangeLabel?: string;
}

const MONTH_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun",
                      "Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAY_ABBR = ["S","M","T","W","T","F","S"];

/** Returns intensity class based on activity count */
function dayStyle(count: number, isFuture: boolean, isCurrentDay: boolean) {
  if (isFuture)     return "opacity-20 text-muted-foreground cursor-default";
  if (isCurrentDay && count === 0)
                    return "ring-2 ring-primary/60 text-primary font-bold rounded-lg";
  if (count === 0)  return "text-foreground/50 hover:bg-accent rounded-lg transition-colors";
  if (count <= 2)   return "bg-primary/20 text-primary rounded-lg font-semibold";
  if (count <= 5)   return "bg-primary/50 text-primary-foreground rounded-lg font-bold";
  return               "bg-primary text-primary-foreground rounded-lg font-bold shadow-toon-sm";
}

// ── Mini Calendar for one month ────────────────────────────────────────────────
function MiniMonth({
  year,
  month,
  activity,
  animDelay,
}: {
  year: number;
  month: number;
  activity: Record<string, number>;
  animDelay: number;
}) {
  const today      = new Date();
  const daysInMo   = getDaysInMonth(new Date(year, month));
  const firstDow   = getDay(startOfMonth(new Date(year, month))); // 0=Sun

  // Monthly total
  let monthTotal = 0;
  for (let d = 1; d <= daysInMo; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    monthTotal += activity[key] ?? 0;
  }

  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const isPastMonth =
    new Date(year, month + 1, 0) < new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <motion.div
      className={cn(
        "rounded-xl border-2 p-2 space-y-1",
        isCurrentMonth ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: animDelay, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Month header */}
      <div className="flex items-center justify-between px-0.5">
        <span className={cn(
          "text-[11px] font-bold leading-none",
          isCurrentMonth ? "text-primary" : "text-foreground"
        )}>
          {MONTH_SHORT[month]}
          <span className="text-muted-foreground font-normal ml-0.5">
            {isPastMonth || isCurrentMonth ? "" : ` '${String(year).slice(2)}`}
          </span>
        </span>
        {monthTotal > 0 && (
          <span className="text-[9px] font-bold text-primary bg-primary/15 rounded-md px-1 py-0.5 leading-none">
            {monthTotal}
          </span>
        )}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7">
        {WEEKDAY_ABBR.map((d, i) => (
          <div key={i} className="text-center text-[8px] font-semibold text-muted-foreground py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px">
        {/* Empty offset cells */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMo }).map((_, i) => {
          const day  = i + 1;
          const key  = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count     = activity[key] ?? 0;
          const date      = new Date(year, month, day);
          const isFuture  = date > today;
          const isToday   = dateFnsIsToday(date);

          return (
            <div
              key={day}
              title={count > 0 ? `${key}: ${count} ${count === 1 ? "activity" : "activities"}` : key}
              aria-label={count > 0 ? `${key}: ${count} activities` : `${key}: no activity`}
              className={cn(
                "aspect-square flex items-center justify-center text-[9px] cursor-default",
                dayStyle(count, isFuture, isToday)
              )}
            >
              {day}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ContributionGrid({ activity, rangeLabel }: ContributionGridProps) {
  const { months, total, streak, peakMonth } = useMemo(() => {
    const today = new Date();

    // Last 6 months (oldest → newest)
    const months: { year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    const total = Object.values(activity).reduce((s, v) => s + v, 0);

    // Current streak
    let streak = 0;
    const check = new Date(today);
    while (true) {
      const k = check.toISOString().slice(0, 10);
      if ((activity[k] ?? 0) > 0) { streak++; check.setDate(check.getDate() - 1); }
      else break;
    }

    // Peak month
    const monthTotals: Record<string, number> = {};
    Object.entries(activity).forEach(([key, count]) => {
      const mk = key.slice(0, 7); // YYYY-MM
      monthTotals[mk] = (monthTotals[mk] ?? 0) + count;
    });
    const peakEntry = Object.entries(monthTotals).sort((a, b) => b[1] - a[1])[0];
    const peakMonth = peakEntry
      ? MONTH_SHORT[parseInt(peakEntry[0].split("-")[1]) - 1]
      : "";

    return { months, total, streak, peakMonth };
  }, [activity]);

  return (
    <div className="flex flex-col gap-2 md:h-full">
      {/* Stats row */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <span className="text-sm font-bold text-foreground">{total}</span>
        <span className="text-[11px] text-muted-foreground">
          {rangeLabel ?? "activities · 6 months"}
        </span>
        {streak > 1 && (
          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary leading-none">
            🔥 {streak}d streak
          </span>
        )}
        {peakMonth && (
          <span className="rounded-md bg-secondary/15 px-1.5 py-0.5 text-[10px] font-semibold text-secondary leading-none">
            ↑ {peakMonth}
          </span>
        )}
      </div>

      {/* Calendar grid — 2 cols mobile (page scroll), 3 cols md+ (card scroll) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:flex-1 md:content-start md:overflow-y-auto">
        {months.map(({ year, month }, i) => (
          <MiniMonth
            key={`${year}-${month}`}
            year={year}
            month={month}
            activity={activity}
            animDelay={i * 0.05}
          />
        ))}
      </div>
    </div>
  );
}
