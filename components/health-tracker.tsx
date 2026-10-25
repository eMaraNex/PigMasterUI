"use client"

import { useCallback, useEffect, useState } from "react"
import dayjs from "dayjs"
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Plus, Search, Syringe, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiRequest } from "@/lib/api/client"
import { useToast } from "@/lib/toast-provider"
import { useAppDispatch } from "@/lib/redux/hooks"
import { api, useGetHealthSummaryQuery } from "@/lib/redux/api"
import type { HealthTrackerProps } from "@/types"

type HealthRecord = {
  id: string
  pig_id: string
  pig_name: string | null
  type: string
  description: string
  date: string
  next_due: string | null
  due_date: string | null
  status: string
  veterinarian: string | null
  notes: string | null
}

type View = "due" | "history"
type DueFilter = "all" | "overdue" | "week"

const TYPES = ["vaccination", "treatment", "medication", "checkup", "surgery", "other"]
const PAGE_SIZE = 20

/** Common treatments on Kenyan farms; the interval pre-fills the next due date. Confirm doses with your vet. */
const PRESETS: { label: string; type: string; description: string; repeatDays?: number }[] = [
  { label: "Iron injection (piglets, day 3)", type: "medication", description: "Iron dextran injection" },
  { label: "Deworming", type: "medication", description: "Deworming", repeatDays: 90 },
  { label: "Erysipelas vaccine", type: "vaccination", description: "Erysipelas vaccine", repeatDays: 180 },
  { label: "Mange / lice treatment", type: "treatment", description: "Mange and lice treatment", repeatDays: 90 },
  { label: "Vitamin / mineral injection", type: "medication", description: "Vitamin and mineral injection" },
  { label: "Vet check-up", type: "checkup", description: "Routine vet check-up", repeatDays: 30 },
]

const emptyForm = {
  scope: "pigs" as "pigs" | "pen" | "all",
  pig_id: "",
  pen_id: "",
  type: "vaccination",
  description: "",
  date: dayjs().format("YYYY-MM-DD"),
  next_due: "",
  veterinarian: "",
  notes: "",
}

const dueLabel = (record: HealthRecord) => {
  if (!record.due_date) return null
  const days = dayjs(record.due_date).startOf("day").diff(dayjs().startOf("day"), "day")
  if (days < 0) return { text: `Overdue ${-days}d`, tone: "destructive" as const }
  if (days === 0) return { text: "Due today", tone: "default" as const }
  return { text: `In ${days}d`, tone: "secondary" as const }
}

export default function HealthTracker({ pigs, pens }: HealthTrackerProps) {
  const dispatch = useAppDispatch()
  const { showSuccess, showError } = useToast()
  const { data: summary, refetch: refetchSummary } = useGetHealthSummaryQuery()
  const [view, setView] = useState<View>("due")
  const [dueFilter, setDueFilter] = useState<DueFilter>("all")
  const [typeFilter, setTypeFilter] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState<HealthRecord | null>(null)
  const [nextDose, setNextDose] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    const today = dayjs().format("YYYY-MM-DD")
    const filter: { field: string; operator: string; value?: unknown }[] = []
    if (typeFilter) filter.push({ field: "type", operator: "eq", value: typeFilter })
    if (view === "due") {
      filter.push({ field: "due_date", operator: "isNotEmpty" })
      filter.push({ field: "status", operator: "neq", value: "cancelled" })
      if (dueFilter === "overdue") filter.push({ field: "due_date", operator: "lt", value: today })
      if (dueFilter === "week") {
        filter.push({ field: "due_date", operator: "gte", value: today })
        filter.push({ field: "due_date", operator: "lte", value: dayjs().add(7, "day").format("YYYY-MM-DD") })
      }
    } else {
      filter.push({ field: "status", operator: "eq", value: "completed" })
    }
    try {
      const response = await apiRequest.post("/health-records/list", {
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        filter,
        sort: [view === "due" ? { field: "due_date", order: "ASC" } : { field: "date", order: "DESC" }],
      })
      setRecords(response.data.data)
      setTotal(response.data.total)
    } catch (err: any) {
      showError("Error", err?.response?.data?.message || "Could not load health records")
    } finally {
      setLoading(false)
    }
  }, [view, dueFilter, typeFilter, debouncedSearch, page])

  useEffect(() => { load() }, [load])

  const refresh = () => {
    load()
    refetchSummary()
    dispatch(api.util.invalidateTags(["Health"]))
  }

  const openDue = (filter: DueFilter) => { setView("due"); setDueFilter(filter); setPage(1) }

  const applyPreset = (preset: (typeof PRESETS)[number]) =>
    setForm(prev => ({
      ...prev,
      type: preset.type,
      description: preset.description,
      next_due: preset.repeatDays ? dayjs(prev.date).add(preset.repeatDays, "day").format("YYYY-MM-DD") : "",
    }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const common = {
        type: form.type,
        description: form.description,
        date: form.date,
        next_due: form.next_due || null,
        veterinarian: form.veterinarian || null,
        notes: form.notes || null,
      }
      if (form.scope === "pigs") {
        if (!form.pig_id) throw new Error("Choose a pig")
        await apiRequest.post("/health-records/create", { ...common, pig_id: form.pig_id })
        showSuccess("Saved", "Health record added")
      } else {
        const response = await apiRequest.post("/health-records/bulk", {
          ...common,
          scope: form.scope,
          ...(form.scope === "pen" && { pen_id: form.pen_id }),
        })
        showSuccess("Saved", `Recorded for ${response.data.data.created} pigs`)
      }
      setAddOpen(false)
      setForm(emptyForm)
      setView(dayjs(form.date).isAfter(dayjs(), "day") || form.next_due ? "due" : "history")
      setPage(1)
      refresh()
    } catch (err: any) {
      showError("Error", err?.response?.data?.message || err?.message)
    } finally {
      setSaving(false)
    }
  }

  const complete = async () => {
    if (!completing) return
    try {
      await apiRequest.post(`/health-records/complete/${completing.id}`, { next_due: nextDose || null })
      showSuccess("Done", "Marked as given")
      setCompleting(null)
      setNextDose("")
      refresh()
    } catch (err: any) {
      showError("Error", err?.response?.data?.message || err?.message)
    }
  }

  const remove = async (record: HealthRecord) => {
    if (!window.confirm(`Delete "${record.description}" for pig ${record.pig_id}?`)) return
    try {
      await apiRequest.delete(`/health-records/delete/${record.id}`)
      showSuccess("Deleted", "Health record deleted")
      refresh()
    } catch (err: any) {
      showError("Error", err?.response?.data?.message || err?.message)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cards = [
    { label: "Overdue", value: summary?.overdue, hint: "Past their due date", tone: "text-red-600", icon: AlertTriangle, onClick: () => openDue("overdue") },
    { label: "Due this week", value: summary?.due_this_week, hint: "Next 7 days", tone: "text-amber-600", icon: CalendarClock, onClick: () => openDue("week") },
    { label: "Scheduled later", value: summary?.scheduled_later, hint: "After this week", tone: "text-blue-600", icon: Syringe, onClick: () => openDue("all") },
    { label: "Given this month", value: summary?.done_this_month, hint: `${summary?.vaccinations_this_year ?? 0} vaccinations this year`, tone: "text-emerald-600", icon: CheckCircle2, onClick: () => { setView("history"); setPage(1) } },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-5 lg:grid-cols-4 sm:gap-4">
        {cards.map(card => (
          <Card key={card.label} role="button" tabIndex={0} onClick={card.onClick} onKeyDown={e => e.key === "Enter" && card.onClick()}
            className="cursor-pointer bg-white/70 transition hover:shadow-lg dark:bg-gray-800/70">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">{card.label}</p>
                <card.icon className={`h-4 w-4 ${card.tone}`} />
              </div>
              <p className={`mt-2 text-2xl font-bold ${card.tone}`}>{card.value ?? "–"}</p>
              <p className="text-xs text-gray-500">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/70 dark:bg-gray-800/70">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
              {(["due", "history"] as View[]).map(item => (
                <button key={item} onClick={() => { setView(item); setPage(1) }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === item ? "bg-white shadow dark:bg-gray-900" : "text-gray-600 dark:text-gray-300"}`}>
                  {item === "due" ? "Due & scheduled" : "History"}
                </button>
              ))}
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
              <Plus className="mr-2 h-4 w-4" />Record health work
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pig, treatment, vet..." className="pl-9" />
            </div>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
              className="h-9 rounded-md border bg-white px-3 text-sm dark:bg-gray-900" aria-label="Type">
              <option value="">All types</option>
              {TYPES.map(type => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}
            </select>
            {view === "due" && (
              <select value={dueFilter} onChange={e => { setDueFilter(e.target.value as DueFilter); setPage(1) }}
                className="h-9 rounded-md border bg-white px-3 text-sm dark:bg-gray-900" aria-label="Due">
                <option value="all">All due</option>
                <option value="overdue">Overdue</option>
                <option value="week">Due this week</option>
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2">Pig</th>
                  <th className="px-3 py-2">Treatment</th>
                  <th className="px-3 py-2">{view === "due" ? "Due" : "Given"}</th>
                  <th className="hidden px-3 py-2 md:table-cell">Vet</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && records.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" /></td></tr>
                )}
                {!loading && records.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-gray-500">{view === "due" ? "Nothing due. Well done!" : "No health records yet."}</td></tr>
                )}
                {records.map(record => {
                  const due = view === "due" ? dueLabel(record) : null
                  return (
                    <tr key={record.id} className={`border-t dark:border-gray-700 ${loading ? "opacity-60" : ""}`}>
                      <td className="px-3 py-2.5">
                        <div className="font-medium">{record.pig_id}</div>
                        {record.pig_name && <div className="text-xs text-gray-500">{record.pig_name}</div>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div>{record.description}</div>
                        <Badge variant="outline" className="mt-0.5 text-[10px] capitalize">{record.type}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {view === "due" ? (
                          <>
                            <div>{record.due_date && dayjs(record.due_date).format("D MMM YYYY")}</div>
                            {due && <Badge variant={due.tone} className="mt-0.5 text-[10px]">{due.text}</Badge>}
                          </>
                        ) : (
                          <>
                            <div>{dayjs(record.date).format("D MMM YYYY")}</div>
                            {record.next_due && <div className="text-xs text-gray-500">Next: {dayjs(record.next_due).format("D MMM")}</div>}
                          </>
                        )}
                      </td>
                      <td className="hidden px-3 py-2.5 md:table-cell">{record.veterinarian || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        {view === "due" && (
                          <Button size="sm" variant="outline" className="mr-1" onClick={() => setCompleting(record)}>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Given
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => remove(record)} aria-label="Delete record">
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>{total.toLocaleString()} record{total === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="px-2">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Record health work</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs font-medium">Quick pick</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {PRESETS.map(preset => (
                  <button type="button" key={preset.label} onClick={() => applyPreset(preset)}
                    className="rounded-full border px-2.5 py-1 text-xs hover:bg-blue-50 dark:hover:bg-gray-700">{preset.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Who</label>
              <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                {([["pigs", "One pig"], ["pen", "Whole pen"], ["all", "All pigs"]] as const).map(([value, label]) => (
                  <button type="button" key={value} onClick={() => setForm({ ...form, scope: value })}
                    className={`rounded-md py-1.5 text-xs font-medium ${form.scope === value ? "bg-white shadow dark:bg-gray-900" : ""}`}>{label}</button>
                ))}
              </div>
            </div>
            {form.scope === "pigs" && (
              <div>
                <label className="text-xs font-medium">Pig tag</label>
                <Input list="health-pig-options" value={form.pig_id} onChange={e => setForm({ ...form, pig_id: e.target.value })} placeholder="Type to search pig tag or name" required />
                <datalist id="health-pig-options">
                  {pigs.map(pig => <option key={pig.id ?? pig.pig_id} value={pig.pig_id}>{pig.name ?? ""}</option>)}
                </datalist>
              </div>
            )}
            {form.scope === "pen" && (
              <div>
                <label className="text-xs font-medium">Pen</label>
                <select required value={form.pen_id} onChange={e => setForm({ ...form, pen_id: e.target.value })}
                  className="h-9 w-full rounded-md border bg-white px-3 text-sm dark:bg-gray-900">
                  <option value="">Choose pen</option>
                  {pens.filter(pen => pen.is_occupied).map(pen => <option key={pen.id} value={pen.id}>{pen.name}</option>)}
                </select>
              </div>
            )}
            {form.scope === "all" && <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">This records the treatment for every live pig on the farm ({pigs.length}).</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="h-9 w-full rounded-md border bg-white px-3 text-sm capitalize dark:bg-gray-900">
                  {TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Date given / planned</label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Treatment / product</label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Erysipelas vaccine, Ivermectin 1%" required />
            </div>
            <div>
              <label className="text-xs font-medium">Next dose / booster due</label>
              <div className="flex gap-1.5">
                <Input type="date" value={form.next_due} onChange={e => setForm({ ...form, next_due: e.target.value })} />
                {[["3 wk", 21], ["3 mo", 90], ["6 mo", 180]].map(([label, days]) => (
                  <Button key={label} type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, next_due: dayjs(form.date).add(Number(days), "day").format("YYYY-MM-DD") })}>{label}</Button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-gray-500">A future date (planned work) and the next dose both appear on the calendar.</p>
            </div>
            <div>
              <label className="text-xs font-medium">Veterinarian</label>
              <Input value={form.veterinarian} onChange={e => setForm({ ...form, veterinarian: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Notes</label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(completing)} onOpenChange={open => !open && setCompleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Mark as given</DialogTitle></DialogHeader>
          {completing && (
            <div className="space-y-3">
              <p className="text-sm">{completing.description} for pig <strong>{completing.pig_id}</strong>, given today.</p>
              <div>
                <label className="text-xs font-medium">Next dose due (optional)</label>
                <Input type="date" value={nextDose} onChange={e => setNextDose(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCompleting(null)}>Cancel</Button>
                <Button onClick={complete}>Confirm</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
