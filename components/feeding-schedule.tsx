"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dayjs from "dayjs"
import { CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, Package, Plus, Save, Wheat } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiRequest } from "@/lib/api/client"
import { useToast } from "@/lib/toast-provider"
import { useCurrency } from "@/lib/currency-context"
import type { FeedingScheduleProps } from "@/types"
import { DateRangePicker, presetRange, rangeToParams, type DateRange } from "@/components/shared/date-range-picker"
import { ExportMenu } from "@/components/shared/export-menu"
import { usePermissions } from "@/lib/permissions"

type GuideEntry = { label: string; feed_type: string; kg_per_day: number }
type PlanPen = {
  pen_id: string
  pen_name: string
  row_name: string | null
  pigs: number
  stages: Record<string, number>
  feed_type: string
  suggested_kg: number
  fed_today_kg: number
}
type Plan = { guide: Record<string, GuideEntry>; feed_types: string[]; pens: PlanPen[] }
type Summary = {
  currency: string
  total_kg: number
  estimated_cost: number
  kg_per_pig_per_day: number
  by_feed_type: { feed_type: string; kg: number }[]
  stock: { feed_type: string; bought_kg: number; used_kg: number; on_hand_kg: number; cost_per_kg: number | null }[]
}
type Row = { selected: boolean; feed_type: string; amount: string }
type Tab = "today" | "history" | "store"

const UNITS: Record<string, string> = { bag_70kg: "70 kg bags", bag_50kg: "50 kg bags", bag_25kg: "25 kg bags", kg: "kg", tonne: "tonnes" }
const PAGE_SIZE = 20

export default function FeedingSchedule(_props: FeedingScheduleProps) {
  const { showSuccess, showError } = useToast()
  const { formatAmount: formatBase, convertToBaseCurrency } = useCurrency()
  const [tab, setTab] = useState<Tab>("today")
  const [plan, setPlan] = useState<Plan | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  // Feed prices are entered in the farm's currency; convert into the user's display currency.
  const formatAmount = (amount: number) => formatBase(convertToBaseCurrency(amount, (summary?.currency ?? "KES") as never))
  const [rows, setRows] = useState<Record<string, Row>>({})
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const loadPlan = useCallback(async () => {
    setLoadingPlan(true)
    try {
      const [planResponse, summaryResponse] = await Promise.all([
        apiRequest.get("/feeding-records/plan"),
        apiRequest.get("/feeding-records/summary"),
      ])
      const nextPlan: Plan = planResponse.data.data
      setPlan(nextPlan)
      setSummary(summaryResponse.data.data)
      setRows(Object.fromEntries(nextPlan.pens.map(pen => [pen.pen_id, {
        // Pens already fed today start unticked so a second round is a deliberate choice.
        selected: pen.fed_today_kg === 0,
        feed_type: pen.feed_type,
        amount: String(Math.max(0, Math.round((pen.suggested_kg - pen.fed_today_kg) * 10) / 10)),
      }])))
    } catch (err: any) {
      showError("Error", err?.response?.data?.message || "Could not load the feeding plan")
    } finally {
      setLoadingPlan(false)
    }
  }, [])

  useEffect(() => { loadPlan() }, [loadPlan])

  const selected = useMemo(() => (plan?.pens ?? []).filter(pen => rows[pen.pen_id]?.selected && Number(rows[pen.pen_id]?.amount) > 0), [plan, rows])
  const selectedKg = selected.reduce((sum, pen) => sum + Number(rows[pen.pen_id].amount), 0)
  const suggestedToday = (plan?.pens ?? []).reduce((sum, pen) => sum + pen.suggested_kg, 0)
  const fedToday = (plan?.pens ?? []).reduce((sum, pen) => sum + pen.fed_today_kg, 0)
  const onHand = (summary?.stock ?? []).reduce((sum, item) => sum + Math.max(0, item.on_hand_kg), 0)
  const daysOfStock = suggestedToday > 0 ? Math.floor(onHand / suggestedToday) : null

  const updateRow = (penId: string, patch: Partial<Row>) => setRows(prev => ({ ...prev, [penId]: { ...prev[penId], ...patch } }))
  const setAll = (value: boolean) => setRows(prev => Object.fromEntries(Object.entries(prev).map(([id, row]) => [id, { ...row, selected: value }])))

  const saveRound = async () => {
    if (!selected.length) return
    setSaving(true)
    try {
      const response = await apiRequest.post("/feeding-records/round", {
        entries: selected.map(pen => ({ pen_id: pen.pen_id, feed_type: rows[pen.pen_id].feed_type, amount_kg: Number(rows[pen.pen_id].amount) })),
      })
      showSuccess("Saved", `Feeding recorded for ${response.data.data.created} pens (${Math.round(selectedKg * 10) / 10} kg)`)
      await loadPlan()
    } catch (err: any) {
      showError("Error", err?.response?.data?.message || err?.message)
    } finally {
      setSaving(false)
    }
  }

  const stageText = (stages: Record<string, number>) =>
    Object.entries(stages).map(([stage, count]) => `${count} ${(plan?.guide[stage]?.label ?? stage).split(" (")[0].toLowerCase()}`).join(", ")

  return (
    <div className="space-y-4 p-2 sm:space-y-6 sm:p-0">
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Fed today", value: `${Math.round(fedToday)} kg`, hint: `of ~${Math.round(suggestedToday)} kg suggested`, tone: "text-emerald-600" },
          { label: "Feed used (30 days)", value: `${(summary?.total_kg ?? 0).toLocaleString()} kg`, hint: `${summary?.kg_per_pig_per_day ?? 0} kg/pig/day`, tone: "text-amber-600" },
          { label: "Feed cost (30 days)", value: formatAmount(summary?.estimated_cost ?? 0), hint: "From purchase prices", tone: "text-blue-600" },
          { label: "Feed in store", value: `${Math.round(onHand).toLocaleString()} kg`, hint: daysOfStock === null ? "Record purchases to track stock" : `About ${daysOfStock} days left`, tone: daysOfStock !== null && daysOfStock < 7 ? "text-red-600" : "text-violet-600" },
        ].map(card => (
          <Card key={card.label} className="bg-white/70 dark:bg-gray-800/70">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{card.label}</p>
              <p className={`mt-2 text-xl font-bold sm:text-2xl ${card.tone}`}>{card.value}</p>
              <p className="text-xs text-gray-500">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700 sm:w-fit">
        {([["today", "Today's feeding"], ["history", "History"], ["store", "Feed store"]] as [Tab, string][]).map(([value, label]) => (
          <button key={value} onClick={() => setTab(value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium sm:flex-none ${tab === value ? "bg-white shadow dark:bg-gray-900" : "text-gray-600 dark:text-gray-300"}`}>{label}</button>
        ))}
      </div>

      {tab === "today" && (
        <Card className="bg-white/70 dark:bg-gray-800/70">
          <CardHeader className="space-y-2 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base"><Wheat className="h-5 w-5 text-amber-600" />Feeding round · {dayjs().format("ddd D MMM")}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowGuide(v => !v)}><Info className="mr-1 h-4 w-4" />Ration guide</Button>
                <Button onClick={saveRound} disabled={saving || !selected.length} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save {selected.length} pens · {Math.round(selectedKg * 10) / 10} kg
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">Amounts are suggested from each pen&apos;s pigs and their stage. Adjust them to what you actually gave, then save once for the whole round.</p>
            {showGuide && plan && (
              <div className="overflow-x-auto rounded-lg border bg-gray-50 p-3 text-xs dark:border-gray-700 dark:bg-gray-900">
                <table className="w-full">
                  <thead><tr className="text-left text-gray-500"><th className="pb-1">Stage</th><th className="pb-1">Feed</th><th className="pb-1">kg / pig / day</th></tr></thead>
                  <tbody>{Object.entries(plan.guide).map(([stage, entry]) => (
                    <tr key={stage}><td className="py-0.5">{entry.label}</td><td>{entry.feed_type}</td><td>{entry.kg_per_day}</td></tr>
                  ))}</tbody>
                </table>
                <p className="mt-2 text-gray-500">Starting points from common East African practice. Confirm with your feed supplier or nutritionist and adjust to body condition.</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loadingPlan ? <div className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" /></div>
              : !plan?.pens.length ? <p className="py-10 text-center text-sm text-gray-500">No pens have pigs yet. Add pigs to pens to start recording feeding.</p> : (
              <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
                    <tr>
                      <th className="w-10 px-3 py-2"><input type="checkbox" aria-label="Select all pens" checked={selected.length === plan.pens.length} onChange={e => setAll(e.target.checked)} /></th>
                      <th className="px-3 py-2">Pen</th>
                      <th className="hidden px-3 py-2 md:table-cell">Pigs</th>
                      <th className="px-3 py-2">Feed</th>
                      <th className="px-3 py-2">kg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.pens.map(pen => {
                      const row = rows[pen.pen_id]
                      if (!row) return null
                      return (
                        <tr key={pen.pen_id} className="border-t dark:border-gray-700">
                          <td className="px-3 py-2"><input type="checkbox" aria-label={`Feed ${pen.pen_name}`} checked={row.selected} onChange={e => updateRow(pen.pen_id, { selected: e.target.checked })} /></td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{pen.pen_name}</div>
                            {pen.fed_today_kg > 0 && <Badge variant="outline" className="mt-0.5 text-[10px] text-emerald-700"><CheckCircle2 className="mr-1 h-3 w-3" />{pen.fed_today_kg} kg given today</Badge>}
                          </td>
                          <td className="hidden px-3 py-2 text-xs text-gray-600 md:table-cell dark:text-gray-400">{pen.pigs} · {stageText(pen.stages)}</td>
                          <td className="px-3 py-2">
                            <select value={row.feed_type} onChange={e => updateRow(pen.pen_id, { feed_type: e.target.value })}
                              className="h-8 w-full min-w-36 rounded-md border bg-white px-2 text-xs dark:bg-gray-900" aria-label={`Feed for ${pen.pen_name}`}>
                              {[...new Set([row.feed_type, ...plan.feed_types])].map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <Input type="number" min={0} step="0.1" value={row.amount} onChange={e => updateRow(pen.pen_id, { amount: e.target.value, selected: true })}
                              className="h-8 w-20" aria-label={`Kg for ${pen.pen_name}`} />
                            <div className="text-[10px] text-gray-500">suggested {pen.suggested_kg}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "history" && <FeedingHistory />}
      {tab === "store" && <FeedStore summary={summary} feedTypes={plan?.feed_types ?? []} onChange={loadPlan} formatAmount={formatAmount} />}
    </div>
  )
}

function FeedingHistory() {
  const { showError } = useToast()
  const [page, setPage] = useState(1)
  const [range, setRange] = useState<DateRange>(() => presetRange("last_30_days"))
  const { can } = usePermissions()
  const { from, to } = rangeToParams(range)
  const filter = [
    ...(from ? [{ field: "feeding_time", operator: "gte", value: from }] : []),
    ...(to ? [{ field: "feeding_time", operator: "lte", value: to }] : []),
  ]
  const [records, setRecords] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiRequest.post("/feeding-records/list", {
      page, limit: PAGE_SIZE, sort: [{ field: "feeding_time", order: "DESC" }],
      filter,
    })
      .then(response => { setRecords(response.data.data); setTotal(response.data.total) })
      .catch(err => showError("Error", err?.response?.data?.message || "Could not load feeding history"))
      .finally(() => setLoading(false))
  }, [page, from, to])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  return (
    <Card className="bg-white/70 dark:bg-gray-800/70">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
        <CardTitle className="text-base">Feeding history</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={range} onChange={next => { setRange(next); setPage(1) }} allowAll />
          {can("feeding_records", "export") && (
            <ExportMenu
              path="/feeding-records/export"
              filename="feeding-records"
              params={{ filter, sort: [{ field: "feeding_time", order: "DESC" }] }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
              <tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Pen / pig</th><th className="px-3 py-2">Feed</th><th className="px-3 py-2">Amount</th><th className="hidden px-3 py-2 md:table-cell">Pigs</th></tr>
            </thead>
            <tbody>
              {loading && records.length === 0 && <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" /></td></tr>}
              {!loading && records.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">No feeding recorded in this period.</td></tr>}
              {records.map(record => (
                <tr key={record.id} className="border-t dark:border-gray-700">
                  <td className="whitespace-nowrap px-3 py-2">{dayjs(record.feeding_time).format("D MMM, HH:mm")}</td>
                  <td className="px-3 py-2">{record.pen_name ?? record.pig_id ?? "—"}</td>
                  <td className="px-3 py-2">{record.feed_type}</td>
                  <td className="whitespace-nowrap px-3 py-2">{record.record_type === "daily" ? `${record.amount} ${record.unit}` : `${record.total_amount} ${record.unit} (${record.record_type})`}</td>
                  <td className="hidden px-3 py-2 md:table-cell">{record.pigs_count ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{total.toLocaleString()} records</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const emptyPurchase = { feed_type: "Sow & weaner meal", brand: "", quantity: "", unit: "bag_70kg", cost_per_unit: "", purchase_date: dayjs().format("YYYY-MM-DD"), supplier: "" }

function FeedStore({ summary, feedTypes, onChange, formatAmount }: { summary: Summary | null; feedTypes: string[]; onChange: () => void; formatAmount: (n: number) => string }) {
  const { showSuccess, showError } = useToast()
  const [purchases, setPurchases] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyPurchase)
  const [saving, setSaving] = useState(false)

  const loadPurchases = () =>
    apiRequest.get("/feed-stock/list", { params: { limit: 20, sort: "-purchase_date" } })
      .then(response => setPurchases(response.data.data))
      .catch(() => setPurchases([]))

  useEffect(() => { loadPurchases() }, [])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await apiRequest.post("/feed-stock/create", {
        ...form,
        quantity: Number(form.quantity),
        cost_per_unit: form.cost_per_unit ? Number(form.cost_per_unit) : null,
      })
      showSuccess("Saved", "Feed purchase recorded")
      setOpen(false)
      setForm(emptyPurchase)
      loadPurchases()
      onChange()
    } catch (err: any) {
      showError("Error", err?.response?.data?.message || err?.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/70 dark:bg-gray-800/70">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Package className="h-5 w-5 text-violet-600" />Stock on hand</CardTitle>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Record purchase</Button>
        </CardHeader>
        <CardContent>
          {!summary?.stock.length ? <p className="text-sm text-gray-500">Record feed purchases to track stock and cost per kg.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-gray-500"><th className="pb-2">Feed</th><th className="pb-2">Bought</th><th className="pb-2">Used</th><th className="pb-2">On hand</th><th className="pb-2">Cost / kg</th></tr></thead>
                <tbody>{summary.stock.map(item => (
                  <tr key={item.feed_type} className="border-t dark:border-gray-700">
                    <td className="py-2 font-medium">{item.feed_type}</td>
                    <td>{item.bought_kg.toLocaleString()} kg</td>
                    <td>{item.used_kg.toLocaleString()} kg</td>
                    <td className={item.on_hand_kg < 70 ? "font-semibold text-red-600" : ""}>{item.on_hand_kg.toLocaleString()} kg <span className="text-xs text-gray-500">({(item.on_hand_kg / 70).toFixed(1)} bags)</span></td>
                    <td>{item.cost_per_kg ? formatAmount(item.cost_per_kg) : "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="bg-white/70 dark:bg-gray-800/70">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Recent purchases</CardTitle></CardHeader>
        <CardContent>
          {purchases.length === 0 ? <p className="text-sm text-gray-500">No purchases yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-gray-500"><th className="pb-2">Date</th><th className="pb-2">Feed</th><th className="pb-2">Quantity</th><th className="pb-2">Total</th><th className="pb-2">Supplier</th></tr></thead>
                <tbody>{purchases.map(item => (
                  <tr key={item.id} className="border-t dark:border-gray-700">
                    <td className="py-2">{dayjs(item.purchase_date).format("D MMM YYYY")}</td>
                    <td>{item.feed_type}{item.brand ? ` · ${item.brand}` : ""}</td>
                    <td>{Number(item.quantity)} {UNITS[item.unit] ?? item.unit}</td>
                    <td>{formatAmount(Number(item.total_cost))}</td>
                    <td>{item.supplier || "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record feed purchase</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium">Feed</label>
                <select value={form.feed_type} onChange={e => setForm({ ...form, feed_type: e.target.value })} className="h-9 w-full rounded-md border bg-white px-3 text-sm dark:bg-gray-900">
                  {feedTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Quantity</label>
                <Input type="number" min={0} step="0.5" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Unit</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="h-9 w-full rounded-md border bg-white px-3 text-sm dark:bg-gray-900">
                  {Object.entries(UNITS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Price per unit</label>
                <Input type="number" min={0} value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: e.target.value })} placeholder="e.g. 3400" />
              </div>
              <div>
                <label className="text-xs font-medium">Date</label>
                <Input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Brand</label>
                <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Supplier</label>
                <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
