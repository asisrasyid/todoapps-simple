"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: string; // YYYY-MM-DD, empty = no limit
  to: string;
}

interface ActivityFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type Mode = "preset" | "date" | "month";

const PRESETS = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "3months", label: "3 months" },
  { key: "year", label: "This year" },
] as const;

type PresetKey = (typeof PRESETS)[number]["key"];

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetRange(key: PresetKey): DateRange {
  const today = new Date();
  if (key === "week") {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);
    return { from: fmt(from), to: fmt(today) };
  }
  if (key === "month") {
    return {
      from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: fmt(today),
    };
  }
  if (key === "lastMonth") {
    return {
      from: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      to: fmt(new Date(today.getFullYear(), today.getMonth(), 0)),
    };
  }
  if (key === "3months") {
    const from = new Date(today);
    from.setMonth(today.getMonth() - 3);
    return { from: fmt(from), to: fmt(today) };
  }
  // year
  return {
    from: fmt(new Date(today.getFullYear(), 0, 1)),
    to: fmt(today),
  };
}

function monthToDateRange(fromMonth: string, toMonth: string): DateRange {
  const from = fromMonth ? `${fromMonth}-01` : "";
  let to = "";
  if (toMonth) {
    const [y, m] = toMonth.split("-").map(Number);
    to = fmt(new Date(y, m, 0)); // last day of that month
  }
  return { from, to };
}

export function ActivityFilter({ value, onChange }: ActivityFilterProps) {
  const [mode, setMode] = useState<Mode>("preset");
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");

  const hasFilter = Boolean(value.from || value.to);

  const handlePreset = (key: PresetKey) => {
    setMode("preset");
    onChange(presetRange(key));
  };

  const handleMonthChange = (nf: string, nt: string) => {
    setFromMonth(nf);
    setToMonth(nt);
    onChange(monthToDateRange(nf, nt));
  };

  const clear = () => {
    setFromMonth("");
    setToMonth("");
    onChange({ from: "", to: "" });
  };

  const inputCls =
    "text-xs bg-card border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 dark:[color-scheme:dark]";

  return (
    <div className="space-y-2">
      {/* Mode tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mr-0.5 shrink-0" />
        {(["preset", "date", "month"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "text-xs px-2 py-1 rounded-md transition-colors",
              mode === m
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            {m === "preset" ? "Quick" : m === "date" ? "Custom Date" : "Month Range"}
          </button>
        ))}
        {hasFilter && (
          <button
            onClick={clear}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Preset buttons */}
      {mode === "preset" && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={clear}
            className={cn(
              "text-xs px-2.5 py-1 rounded-md border transition-colors",
              !hasFilter
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            All time
          </button>
          {PRESETS.map(({ key, label }) => {
            const r = presetRange(key);
            const isActive = value.from === r.from && value.to === r.to;
            return (
              <button
                key={key}
                onClick={() => handlePreset(key)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-md border transition-colors",
                  isActive
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Custom date range */}
      {mode === "date" && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={value.from}
            max={value.to || undefined}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className={inputCls}
          />
          <span className="text-xs text-muted-foreground">—</span>
          <input
            type="date"
            value={value.to}
            min={value.from || undefined}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className={inputCls}
          />
        </div>
      )}

      {/* Month range */}
      {mode === "month" && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="month"
            value={fromMonth}
            max={toMonth || undefined}
            onChange={(e) => handleMonthChange(e.target.value, toMonth)}
            className={inputCls}
          />
          <span className="text-xs text-muted-foreground">—</span>
          <input
            type="month"
            value={toMonth}
            min={fromMonth || undefined}
            onChange={(e) => handleMonthChange(fromMonth, e.target.value)}
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}
