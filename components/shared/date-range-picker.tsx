"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { CalendarRange, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export type DatePreset =
  | "all" | "today" | "yesterday" | "last_7_days" | "last_week" | "last_30_days" | "this_month"
  | "last_month" | "last_3_months" | "last_6_months" | "last_12_months" | "custom";

export type DateRange = { preset: DatePreset; from: string; to: string };

const FORMAT = "YYYY-MM-DD";

type RangePreset = Exclude<DatePreset, "custom" | "all">;

export const ALL_TIME: DateRange = { preset: "all", from: "", to: "" };

export const DATE_PRESETS: { value: RangePreset; label: string; range: () => [dayjs.Dayjs, dayjs.Dayjs] }[] = [
  { value: "today", label: "Today", range: () => [dayjs(), dayjs()] },
  { value: "yesterday", label: "Yesterday", range: () => [dayjs().subtract(1, "day"), dayjs().subtract(1, "day")] },
  { value: "last_7_days", label: "Last 7 days", range: () => [dayjs().subtract(6, "day"), dayjs()] },
  {
    value: "last_week",
    label: "Last week",
    // Previous Monday to Sunday.
    range: () => {
      const monday = dayjs().subtract((dayjs().day() + 6) % 7, "day").subtract(7, "day");
      return [monday, monday.add(6, "day")];
    },
  },
  { value: "last_30_days", label: "Last 30 days", range: () => [dayjs().subtract(29, "day"), dayjs()] },
  { value: "this_month", label: "This month", range: () => [dayjs().startOf("month"), dayjs()] },
  {
    value: "last_month",
    label: "Last month",
    range: () => [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")],
  },
  { value: "last_3_months", label: "Last 3 months", range: () => [dayjs().subtract(3, "month").add(1, "day"), dayjs()] },
  { value: "last_6_months", label: "Last 6 months", range: () => [dayjs().subtract(6, "month").add(1, "day"), dayjs()] },
  { value: "last_12_months", label: "Last 12 months", range: () => [dayjs().subtract(12, "month").add(1, "day"), dayjs()] },
];

export const presetRange = (preset: RangePreset): DateRange => {
  const [from, to] = DATE_PRESETS.find(item => item.value === preset)!.range();
  return { preset, from: from.format(FORMAT), to: to.format(FORMAT) };
};

/** ISO bounds covering whole days, ready for API `from` / `to` query parameters ({} for all time). */
export const rangeToParams = (range: DateRange): { from?: string; to?: string } =>
  range.preset === "all"
    ? {}
    : { from: dayjs(range.from).startOf("day").toISOString(), to: dayjs(range.to).endOf("day").toISOString() };

/** Calendar-day bounds (YYYY-MM-DD) for filtering DATE columns ({} for all time). */
export const rangeToDates = (range: DateRange): { from?: string; to?: string } =>
  range.preset === "all" ? {} : { from: range.from, to: range.to };

export const describeRange = (range: DateRange) => {
  if (range.preset === "all") return "All time";
  if (range.preset !== "custom") return DATE_PRESETS.find(item => item.value === range.preset)?.label ?? "";
  const from = dayjs(range.from);
  const to = dayjs(range.to);
  return from.isSame(to, "day") ? from.format("D MMM YYYY") : `${from.format("D MMM YYYY")} – ${to.format("D MMM YYYY")}`;
};

type Props = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: RangePreset[];
  /** Adds an "All time" choice (no date filter). */
  allowAll?: boolean;
  className?: string;
};

/** Preset ranges (yesterday, last week, last month, last 3 months, …) plus a custom start/end. */
export function DateRangePicker({ value, onChange, presets, allowAll, className }: Props) {
  const [open, setOpen] = useState(false);
  const today = dayjs().format(FORMAT);
  const [from, setFrom] = useState(value.from || today);
  const [to, setTo] = useState(value.to || today);
  const options = presets ? DATE_PRESETS.filter(item => presets.includes(item.value)) : DATE_PRESETS;
  const invalid = !from || !to || from > to;

  return (
    <Popover
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (next) {
          setFrom(value.from || today);
          setTo(value.to || today);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={`h-9 justify-between gap-2 font-normal ${className ?? ""}`}>
          <span className="flex items-center gap-2 truncate">
            <CalendarRange className="h-4 w-4 shrink-0 text-gray-500" />
            <span className="truncate">{describeRange(value)}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,30rem)] p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="grid grid-cols-2 gap-1 border-b p-2 sm:w-44 sm:grid-cols-1 sm:border-b-0 sm:border-r dark:border-gray-700">
            {allowAll && (
              <button
                type="button"
                onClick={() => {
                  onChange(ALL_TIME);
                  setOpen(false);
                }}
                className={`rounded-md px-2.5 py-1.5 text-left text-sm transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  value.preset === "all" ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : ""
                }`}
              >
                All time
              </button>
            )}
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(presetRange(option.value));
                  setOpen(false);
                }}
                className={`rounded-md px-2.5 py-1.5 text-left text-sm transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  value.preset === option.value ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-3 p-3">
            <p className="text-sm font-medium">Custom range</p>
            <label className="block space-y-1 text-xs text-gray-500">
              <span>Start date</span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={event => setFrom(event.target.value)}
                className="h-9 w-full rounded-md border bg-white px-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
            <label className="block space-y-1 text-xs text-gray-500">
              <span>End date</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={event => setTo(event.target.value)}
                className="h-9 w-full rounded-md border bg-white px-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
            {from && to && from > to && <p className="text-xs text-red-600">The start date must be before the end date.</p>}
            <Button
              size="sm"
              className="w-full"
              disabled={invalid}
              onClick={() => {
                onChange({ preset: "custom", from, to });
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
