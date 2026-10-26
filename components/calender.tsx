"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api/client";

type Category = "health" | "breeding" | "farrowing" | "weaning" | "alert";

export interface FarmEvent {
  id: string;
  date: string;
  title: string;
  details: string | null;
  category: Category;
  severity: "low" | "medium" | "high";
  status: "due" | "overdue" | "done" | string;
  pig_id: string | null;
}

const CATEGORIES: Record<Category, { label: string; dot: string; chip: string }> = {
  health: { label: "Health", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  breeding: { label: "Breeding", dot: "bg-pink-500", chip: "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  farrowing: { label: "Farrowing", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  weaning: { label: "Weaning", dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  alert: { label: "Alerts", dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_PER_DAY = 3;

/**
 * Farm calendar: health work due (vaccinations, boosters, treatments), matings, heat checks,
 * expected farrowings and weanings, plus other alerts. Loads one visible month at a time.
 */
export default function Calendar() {
  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [events, setEvents] = useState<FarmEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(dayjs().format("YYYY-MM-DD"));
  const [hidden, setHidden] = useState<Set<Category>>(new Set());

  useEffect(() => {
    const from = month.startOf("week").format("YYYY-MM-DD");
    const to = month.endOf("month").endOf("week").add(30, "day").format("YYYY-MM-DD");
    setLoading(true);
    setError(null);
    apiRequest
      .get("/alerts/calendar", { params: { from, to } })
      .then(response => setEvents(response.data.data.events))
      .catch(err => setError(err?.response?.data?.message ?? "Could not load the calendar"))
      .finally(() => setLoading(false));
  }, [month]);

  const visible = useMemo(() => events.filter(event => !hidden.has(event.category)), [events, hidden]);
  const byDate = useMemo(() => {
    const map = new Map<string, FarmEvent[]>();
    for (const event of visible) map.set(event.date.slice(0, 10), [...(map.get(event.date.slice(0, 10)) ?? []), event]);
    return map;
  }, [visible]);

  const today = dayjs().format("YYYY-MM-DD");
  const start = month.startOf("week");
  const days = Array.from({ length: month.endOf("month").endOf("week").diff(start, "day") + 1 }, (_, i) => start.add(i, "day"));
  const upcoming = visible.filter(event => event.date.slice(0, 10) >= today && event.status !== "done").slice(0, 8);
  const overdue = visible.filter(event => event.status === "overdue");
  const selectedEvents = byDate.get(selected) ?? [];

  const toggle = (category: Category) =>
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category); else next.add(category);
      return next;
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="bg-white/70 dark:bg-gray-800/70">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              {month.format("MMMM YYYY")}
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setMonth(m => m.subtract(1, "month"))} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => { setMonth(dayjs().startOf("month")); setSelected(today); }}>Today</Button>
              <Button variant="outline" size="sm" onClick={() => setMonth(m => m.add(1, "month"))} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CATEGORIES) as Category[]).map(category => (
              <button
                key={category}
                onClick={() => toggle(category)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${hidden.has(category) ? "bg-gray-100 text-gray-400 line-through dark:bg-gray-700" : CATEGORIES[category].chip}`}
              >
                <span className={`h-2 w-2 rounded-full ${CATEGORIES[category].dot}`} />
                {CATEGORIES[category].label}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-gray-200 dark:border-gray-700 dark:bg-gray-700">
            {WEEK_DAYS.map(day => (
              <div key={day} className="bg-gray-50 py-2 text-center text-[11px] font-semibold uppercase text-gray-500 dark:bg-gray-800">{day}</div>
            ))}
            {days.map(day => {
              const key = day.format("YYYY-MM-DD");
              const dayEvents = byDate.get(key) ?? [];
              const inMonth = day.month() === month.month();
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`min-h-20 bg-white p-1.5 text-left align-top transition hover:bg-blue-50 dark:bg-gray-900 dark:hover:bg-gray-800 sm:min-h-24 ${inMonth ? "" : "opacity-40"} ${selected === key ? "ring-2 ring-inset ring-blue-500" : ""}`}
                >
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${key === today ? "bg-blue-600 font-bold text-white" : "text-gray-700 dark:text-gray-300"}`}>
                    {day.date()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, MAX_PER_DAY).map(event => (
                      <div key={event.id} className={`hidden truncate rounded px-1 py-0.5 text-[10px] font-medium sm:block ${CATEGORIES[event.category].chip} ${event.status === "overdue" ? "ring-1 ring-red-400" : ""}`}>
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 0 && (
                      <div className="flex items-center gap-0.5 sm:hidden">
                        {dayEvents.slice(0, 4).map(event => <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${CATEGORIES[event.category].dot}`} />)}
                      </div>
                    )}
                    {dayEvents.length > MAX_PER_DAY && (
                      <div className="hidden text-[10px] text-gray-500 sm:block">+{dayEvents.length - MAX_PER_DAY} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="bg-white/70 dark:bg-gray-800/70">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{dayjs(selected).format("dddd, D MMMM")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {selectedEvents.length === 0 && <p className="text-sm text-gray-500">Nothing scheduled.</p>}
            {selectedEvents.map(event => <EventRow key={event.id} event={event} />)}
          </CardContent>
        </Card>
        {overdue.length > 0 && (
          <Card className="border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-900/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-red-700 dark:text-red-300">Overdue ({overdue.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">{overdue.slice(0, 6).map(event => <EventRow key={event.id} event={event} showDate />)}</CardContent>
          </Card>
        )}
        <Card className="bg-white/70 dark:bg-gray-800/70">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Coming up</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 && <p className="text-sm text-gray-500">Nothing coming up.</p>}
            {upcoming.map(event => <EventRow key={event.id} event={event} showDate />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EventRow({ event, showDate }: { event: FarmEvent; showDate?: boolean }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-gray-100 bg-white/80 p-2.5 dark:border-gray-700 dark:bg-gray-900/60">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${CATEGORIES[event.category].dot}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{event.title}</p>
        {event.details && <p className="text-xs text-gray-500">{event.details}</p>}
        <div className="mt-1 flex items-center gap-2">
          {showDate && <span className="text-xs text-gray-500">{dayjs(event.date).format("D MMM")}</span>}
          {event.status === "overdue" && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
          {event.status === "done" && <Badge variant="outline" className="text-[10px]">Done</Badge>}
        </div>
      </div>
    </div>
  );
}
