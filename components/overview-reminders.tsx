"use client";

import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { AlertTriangle, Baby, CalendarDays, ChevronRight, CreditCard, Heart, Loader2, Package, Syringe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetRemindersQuery, type Reminder } from "@/lib/redux/api";

const CATEGORY: Record<Reminder["category"], { icon: typeof Syringe; tone: string; tab: string }> = {
  health: { icon: Syringe, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", tab: "health" },
  breeding: { icon: Heart, tone: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300", tab: "breeding" },
  farrowing: { icon: Baby, tone: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", tab: "breeding" },
  weaning: { icon: Baby, tone: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", tab: "breeding" },
  feed: { icon: Package, tone: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", tab: "feeding" },
  alert: { icon: AlertTriangle, tone: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", tab: "calender" },
  // Plan / trial ending: opens billing instead of a dashboard tab.
  billing: { icon: CreditCard, tone: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", tab: "billing" },
};

const when = (date: string) => {
  const days = dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days < 0 ? `${-days} days ago` : `In ${days} days`;
};

/**
 * Overview card: what needs doing now (overdue first), built by the API from health
 * schedules, breeding milestones and feed stock. Each item opens the screen to act on it.
 */
export default function OverviewReminders({ onOpenTab }: { onOpenTab: (tab: string) => void }) {
  const { data, isLoading, isError, refetch } = useGetRemindersQuery(undefined, { refetchOnMountOrArgChange: 60 });
  const router = useRouter();
  const open = (tab: string) => (tab === "billing" ? router.push("/settings?tab=billing") : onOpenTab(tab));

  return (
    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base dark:text-gray-200">
          <AlertTriangle className="h-4 w-4 text-amber-500 sm:h-5 sm:w-5" />
          Alerts & reminders
          {data && data.overdue > 0 && <Badge variant="destructive">{data.overdue} overdue</Badge>}
          {data && data.upcoming > 0 && <Badge variant="secondary">{data.upcoming} coming up</Badge>}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => onOpenTab("calender")} className="text-xs">
          <CalendarDays className="mr-1.5 h-4 w-4" />Open calendar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>}
        {isError && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            Could not load reminders.
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        )}
        {data && data.items.length === 0 && (
          <p className="py-4 text-sm text-gray-600 dark:text-gray-400">
            You&apos;re all caught up. Scheduled vaccinations, heat checks, farrowings, weanings and low feed show up here.
          </p>
        )}
        <ul className="divide-y dark:divide-gray-700">
          {data?.items.map(item => {
            const meta = CATEGORY[item.category] ?? CATEGORY.alert;
            const Icon = meta.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => open(meta.tab)}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                      {dayjs(item.date).format("ddd D MMM")} · {when(item.date)}{item.details ? ` · ${item.details}` : ""}
                    </span>
                  </span>
                  <Badge variant={item.status === "overdue" ? "destructive" : "outline"} className="shrink-0 text-[10px]">
                    {item.status === "overdue" ? "Overdue" : "Due"}
                  </Badge>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
