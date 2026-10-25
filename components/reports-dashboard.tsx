"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Baby, Download, HeartPulse, Loader2, PiggyBank, Skull, TrendingUp, Wheat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateRangePicker, presetRange, rangeToParams, type DateRange } from "@/components/shared/date-range-picker";
import { useCurrency } from "@/lib/currency-context";
import { apiRequest } from "@/lib/api/client";
import { downloadExport, exportErrorMessage, type ExportFormat } from "@/lib/download";
import { usePermissions } from "@/lib/permissions";
import { useToast } from "@/lib/toast-provider";
import type { ReportsProps } from "@/types";

type FarmReport = {
  currency: string;
  from: string;
  to: string;
  herd: { total: number; females: number; males: number; pregnant: number; piglets: number; weaners_growers: number; adults: number; sick: number; added: number };
  breeds: { breed: string; pigs: number }[];
  breeding: { matings: number; farrowings: number; piglets_born: number; avg_litter_size: number | null; due_to_farrow: number; piglet_deaths: number; pre_weaning_mortality_pct: number | null };
  removals: { reason: string; pigs: number; sale_amount: number }[];
  sales: { pigs_sold: number; sale_value: number };
  mortality: { deaths: number; rate_pct: number };
  finance: { income: number; feed_cost: number; margin_over_feed: number; by_type: { type: string; records: number; amount: number }[] };
  feed: { total_kg: number; kg_per_pig_per_day: number; by_feed_type: { feed_type: string; kg: number }[] };
  health: { type: string; records: number; pigs: number }[];
  monthly: { month: string; income: number; feed_kg: number }[];
};

const pretty = (value: string) => value.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());

function Kpi({ icon: Icon, label, value, hint, tone }: { icon: typeof PiggyBank; label: string; value: string | number; hint?: string; tone: string }) {
  return (
    <Card className="bg-white/70 dark:bg-gray-800/70">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <Icon className={`h-4 w-4 ${tone}`} />
        </div>
        <p className="mt-2 break-words text-lg font-bold leading-tight sm:text-2xl">{value}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function BreakdownTable({ title, rows, columns }: { title: string; rows: Record<string, unknown>[]; columns: { key: string; label: string; format?: (v: unknown) => string }[] }) {
  return (
    <Card className="bg-white/70 dark:bg-gray-800/70">
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-gray-500">No records in this period.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-500">{columns.map(c => <th key={c.key} className="pb-2">{c.label}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t dark:border-gray-700">
                  {columns.map(c => <td key={c.key} className="py-2">{c.format ? c.format(row[c.key]) : String(row[c.key] ?? "—")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

/** Farm performance report; every figure is aggregated by the API, so it scales with herd size. */
export default function ReportsDashboard(_props: ReportsProps) {
  const { formatAmount: formatBase, convertToBaseCurrency } = useCurrency();
  const [range, setRange] = useState<DateRange>(() => presetRange("last_6_months"));
  const [report, setReportState] = useState<FarmReport | null>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const { can } = usePermissions();
  const { showError } = useToast();
  // Report money is in the farm's currency; convert it into the user's display currency.
  const formatAmount = (amount: number) => formatBase(convertToBaseCurrency(amount, (report?.currency ?? "KES") as never));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest
      .get("/reports/summary", { params: rangeToParams(range) })
      .then(response => setReportState(response.data.data))
      .catch(err => setError(err?.response?.data?.message ?? "Could not load the report"))
      .finally(() => setLoading(false));
  }, [range]);

  // The API builds the file (a multi-sheet workbook for Excel) so large farms export in full.
  const exportReport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      await downloadExport("/reports/export", { ...rangeToParams(range), format }, `farm-report.${format}`);
    } catch (err) {
      showError("Export failed", await exportErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4 p-2 sm:space-y-6 sm:p-0">
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Farm performance</h2>
          {report && <p className="text-xs text-gray-500">{dayjs(report.from).format("D MMM YYYY")} – {dayjs(report.to).format("D MMM YYYY")}</p>}
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          <DateRangePicker value={range} onChange={setRange} />
          {can("reports", "export") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={!report || exporting !== null}>
                  {exporting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportReport("xlsx")}>Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReport("csv")}>CSV (.csv)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {report && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={PiggyBank} tone="text-blue-600" label="Pigs on farm" value={report.herd.total.toLocaleString()}
              hint={`${report.herd.females} female · ${report.herd.males} male · ${report.herd.pregnant} pregnant`} />
            <Kpi icon={Baby} tone="text-violet-600" label="Piglets born" value={report.breeding.piglets_born.toLocaleString()}
              hint={`${report.breeding.farrowings} farrowings · avg litter ${report.breeding.avg_litter_size ?? "–"}`} />
            <Kpi icon={Skull} tone="text-red-600" label="Deaths" value={report.mortality.deaths}
              hint={`Herd mortality ${report.mortality.rate_pct}% · pre-weaning ${report.breeding.pre_weaning_mortality_pct ?? "–"}%`} />
            <Kpi icon={TrendingUp} tone="text-emerald-600" label="Pigs sold" value={report.sales.pigs_sold}
              hint={formatAmount(report.sales.sale_value)} />
            <Kpi icon={TrendingUp} tone="text-emerald-600" label="Income" value={formatAmount(report.finance.income)} />
            <Kpi icon={Wheat} tone="text-amber-600" label="Feed used" value={`${report.feed.total_kg.toLocaleString()} kg`}
              hint={`${report.feed.kg_per_pig_per_day} kg per pig per day`} />
            <Kpi icon={Wheat} tone="text-amber-600" label="Feed cost (est.)" value={formatAmount(report.finance.feed_cost)}
              hint="From feed purchase prices" />
            <Kpi icon={HeartPulse} tone="text-pink-600" label="Margin over feed" value={formatAmount(report.finance.margin_over_feed)}
              hint={`${report.breeding.due_to_farrow} sows due to farrow`} />
          </div>

          <Card className="bg-white/70 dark:bg-gray-800/70">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Income and feed by month</CardTitle></CardHeader>
            <CardContent>
              {report.monthly.length === 0 ? <p className="py-10 text-center text-sm text-gray-500">No income or feeding recorded in this period.</p> : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={report.monthly.map(row => ({ ...row, month: dayjs(row.month + "-01").format("MMM YY") }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="income" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="feed" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="income" dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                    <Line yAxisId="feed" dataKey="feed_kg" name="Feed (kg)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownTable title="Herd composition" rows={[
              { group: "Piglets (under 8 weeks)", pigs: report.herd.piglets },
              { group: "Weaners & growers", pigs: report.herd.weaners_growers },
              { group: "Adults", pigs: report.herd.adults },
              { group: "Sick / quarantine", pigs: report.herd.sick },
            ]} columns={[{ key: "group", label: "Group" }, { key: "pigs", label: "Pigs" }]} />
            <BreakdownTable title="Pigs leaving the farm" rows={report.removals} columns={[
              { key: "reason", label: "Reason", format: v => pretty(String(v)) },
              { key: "pigs", label: "Pigs" },
              { key: "sale_amount", label: "Value", format: v => (Number(v) ? formatAmount(Number(v)) : "—") },
            ]} />
            <BreakdownTable title="Income by type" rows={report.finance.by_type} columns={[
              { key: "type", label: "Type", format: v => pretty(String(v)) },
              { key: "records", label: "Records" },
              { key: "amount", label: "Amount", format: v => formatAmount(Number(v)) },
            ]} />
            <BreakdownTable title="Feed used by type" rows={report.feed.by_feed_type} columns={[
              { key: "feed_type", label: "Feed" },
              { key: "kg", label: "Kg", format: v => Number(v).toLocaleString() },
            ]} />
            <BreakdownTable title="Health work done" rows={report.health} columns={[
              { key: "type", label: "Type", format: v => pretty(String(v)) },
              { key: "records", label: "Treatments" },
              { key: "pigs", label: "Pigs" },
            ]} />
            <BreakdownTable title="Breeds on farm" rows={report.breeds} columns={[{ key: "breed", label: "Breed" }, { key: "pigs", label: "Pigs" }]} />
          </div>
        </>
      )}
    </div>
  );
}
