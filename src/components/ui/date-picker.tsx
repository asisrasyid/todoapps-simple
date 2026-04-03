"use client";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
} from "lucide-react";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  isToday,
  isSameDay,
  parseISO,
  isValid,
} from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTH_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

// ─── DatePicker ────────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: string;           // YYYY-MM-DD or ""
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled,
  clearable,
  className,
  triggerClassName,
}: DatePickerProps) {
  const selected = value && isValid(parseISO(value)) ? parseISO(value) : null;

  const [open, setOpen]         = useState(false);
  const [viewYear, setViewYear] = useState(() => selected?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? new Date().getMonth());
  const [dir, setDir]           = useState(1);

  const daysInMonth    = getDaysInMonth(new Date(viewYear, viewMonth));
  const firstDayOfWeek = getDay(startOfMonth(new Date(viewYear, viewMonth)));

  function prevMonth() {
    setDir(-1);
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    setDir(1);
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function pick(day: number) {
    onChange(format(new Date(viewYear, viewMonth, day), "yyyy-MM-dd"));
    setOpen(false);
  }

  const display = selected ? format(selected, "d MMM yyyy") : "";

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2 text-sm font-medium",
            "hover:border-primary/60 hover:bg-primary/5 shadow-toon-sm transition-[border-color,background-color]",
            open && "border-primary/70 bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            !display && "text-muted-foreground",
            triggerClassName
          )}
        >
          <Calendar className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 text-left">{display || placeholder}</span>
          {clearable && selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={e => { e.stopPropagation(); onChange(""); }}
              onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); onChange(""); } }}
              className="rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Clear date"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className={cn("w-72 p-0 rounded-2xl border-2 border-border overflow-hidden shadow-toon", className)}
        align="start"
        sideOffset={6}
      >
        {/* Header — month + year nav */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-card">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>

          <span className="text-sm font-bold select-none">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 px-3 pt-3 pb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-bold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid — animated slide per month change */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${viewYear}-${viewMonth}`}
            className="grid grid-cols-7 px-3 pb-4 gap-1"
            initial={{ opacity: 0, x: dir * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={  { opacity: 0, x: dir * -28 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Empty offset cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day  = i + 1;
              const date = new Date(viewYear, viewMonth, day);
              const isSel = selected ? isSameDay(date, selected) : false;
              const isCur = isToday(date);

              return (
                <motion.button
                  key={day}
                  type="button"
                  whileHover={!isSel ? { scale: 1.1 } : {}}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => pick(day)}
                  className={cn(
                    "h-9 w-full rounded-xl text-sm transition-colors font-medium",
                    isSel
                      ? "bg-primary text-primary-foreground shadow-toon-primary font-bold"
                      : isCur
                      ? "ring-2 ring-primary/50 text-primary bg-primary/10 font-bold"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  {day}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}

// ─── MonthPicker ───────────────────────────────────────────────────────────────

interface MonthPickerProps {
  value: string;           // YYYY-MM or ""
  onChange: (v: string) => void;
  placeholder?: string;
  min?: string;            // YYYY-MM
  max?: string;            // YYYY-MM
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function MonthPicker({
  value,
  onChange,
  placeholder = "Pilih bulan",
  min,
  max,
  disabled,
  className,
  triggerClassName,
}: MonthPickerProps) {
  const [open, setOpen]         = useState(false);
  const [viewYear, setViewYear] = useState(() =>
    value ? parseInt(value.split("-")[0]) : new Date().getFullYear()
  );

  function pick(monthIdx: number) {
    const m = String(monthIdx + 1).padStart(2, "0");
    onChange(`${viewYear}-${m}`);
    setOpen(false);
  }

  const display = value
    ? (() => {
        const [y, m] = value.split("-");
        return `${MONTH_SHORT[parseInt(m) - 1]} ${y}`;
      })()
    : "";

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2 text-sm font-medium",
            "hover:border-primary/60 hover:bg-primary/5 shadow-toon-sm transition-[border-color,background-color]",
            open && "border-primary/70 bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            !display && "text-muted-foreground",
            triggerClassName
          )}
        >
          <Calendar className="h-4 w-4 shrink-0 text-primary" />
          <span>{display || placeholder}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className={cn("w-60 p-0 rounded-2xl border-2 border-border overflow-hidden shadow-toon", className)}
        align="start"
        sideOffset={6}
      >
        {/* Year nav */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-card">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setViewYear(y => y - 1)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
          <span className="text-sm font-bold select-none">{viewYear}</span>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setViewYear(y => y + 1)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1.5 p-3">
          {MONTH_SHORT.map((name, i) => {
            const key       = `${viewYear}-${String(i + 1).padStart(2, "0")}`;
            const isSel     = value === key;
            const isDisabled = (min && key < min) || (max && key > max);
            return (
              <motion.button
                key={name}
                type="button"
                disabled={!!isDisabled}
                whileHover={!isSel && !isDisabled ? { scale: 1.05 } : {}}
                whileTap={{ scale: 0.95 }}
                onClick={() => pick(i)}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-medium transition-colors",
                  isSel
                    ? "bg-primary text-primary-foreground shadow-toon-primary font-bold"
                    : "text-foreground hover:bg-accent",
                  isDisabled && "opacity-35 cursor-not-allowed pointer-events-none"
                )}
              >
                {name}
              </motion.button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
