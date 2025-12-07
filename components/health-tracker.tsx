"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, AlertTriangle, Calendar, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "@/lib/auth-context"
import * as utils from "@/lib/utils"
import { useToast } from "@/lib/toast-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { HealthTrackerProps, Pig } from "@/types"
import { penNamesConversion } from "@/lib/utils"

export default function HealthTracker({ pigs, pens }: HealthTrackerProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [localPigs, setLocalPigs] = useState<Pig[]>(pigs || [])

  useEffect(() => {
    setLocalPigs(pigs || [])
  }, [pigs])
  const [form, setForm] = useState({
    pig_id: pigs?.[0]?.pig_id || "",
    type: 'checkup',
    description: '',
    date: new Date().toISOString().split('T')[0],
    next_due: '',
    status: 'completed',
    veterinarian: '',
    notes: ''
  })
  const getHealthStatus = (pig: Pig) => {
    const now = new Date()
    const healthRecords = pig?.healthRecords || []

    const overdueMedications = healthRecords.filter((record) => {
      if (record.nextDue) {
        return new Date(record.nextDue) < now && record.status !== "completed"
      }
      return false
    })

    if (overdueMedications.length > 0) return "overdue"

    const upcomingMedications = healthRecords.filter((record) => {
      if (record.nextDue) {
        const dueDate = new Date(record.nextDue)
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        return dueDate <= threeDaysFromNow && dueDate >= now && record?.status !== "completed"
      }
      return false
    })

    if (upcomingMedications.length > 0) return "upcoming"
    return "good"
  }

  const overduePigs = localPigs?.filter((r) => getHealthStatus(r) === "overdue") || []
  const upcomingPigs = localPigs?.filter((r) => getHealthStatus(r) === "upcoming") || []
  const healthyPigs = localPigs?.filter((r) => getHealthStatus(r) === "good") || []

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mt-3 sm:mt-5">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-red-600 dark:text-red-400">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent">
              {overduePigs.length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Medications overdue</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-amber-600 dark:text-amber-400">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              {upcomingPigs.length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Due in 3 days</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-green-600 dark:text-green-400">Healthy</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
              {healthyPigs.length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Up to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Medications */}
      {overduePigs.length > 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 border-b border-red-200 dark:border-red-700 pb-3 sm:pb-4">
            <CardTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>Overdue Medications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {overduePigs.map((pig) => {
                const healthRecords = pig?.healthRecords || []
                return (
                  <div
                    key={pig.id}
                    className="p-3 sm:p-4 border border-red-200 dark:border-red-700 bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{pig.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pen {pig.pen_id}</p>
                        <div className="mt-2 space-y-1">
                          {healthRecords
                            .filter(
                              (record) =>
                                record.nextDue && new Date(record.nextDue) < new Date() && record.status !== "completed",
                            )
                            .map((record, index) => (
                              <div key={index} className="text-xs sm:text-sm">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{record.type}</span> -
                                <span className="text-red-600 dark:text-red-400 ml-1">
                                  Overdue by{" "}
                                  {Math.ceil(
                                    (new Date().getTime() - new Date(record.nextDue!).getTime()) / (1000 * 60 * 60 * 24),
                                  )}{" "}
                                  days
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex-shrink-0 w-full sm:w-auto"
                        onClick={async () => {
                          try {
                            if (!user?.farm_id) { showError('Error', 'Missing farm details'); return }
                            const overdue = healthRecords.filter((record) => record.nextDue && new Date(record.nextDue) < new Date() && record.status !== 'completed')
                            const updatedRecords = [] as any[]
                            for (const r of overdue) {
                              const resp = await axios.put(`${utils.apiUrl}/health/${r.id}`, { status: 'completed' }, { headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` } })
                              const updated = resp?.data?.data ?? resp?.data
                              updatedRecords.push(updated)
                            }
                            // update local state for this pig
                            setLocalPigs(prev => prev.map(p => {
                              if (p.pig_id !== pig.pig_id) return p
                              const newRecords = (p.healthRecords || []).map(rec => {
                                const u = updatedRecords.find(x => x.id === rec.id)
                                return u ? u : rec
                              })
                              return { ...p, healthRecords: newRecords }
                            }))
                            showSuccess('Success', 'Marked overdue record(s) as completed')
                          } catch (err: any) {
                            showError('Error', err?.response?.data?.message || err?.message)
                          }
                        }}
                      >
                        <Pill className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        <span className="text-xs sm:text-sm">Administer</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Medications */}
      {upcomingPigs.length > 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50/80 to-amber-100/80 dark:from-amber-900/30 dark:to-amber-800/30 border-b border-amber-200 dark:border-amber-700 pb-3 sm:pb-4">
            <CardTitle className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>Upcoming Medications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {upcomingPigs.map((pig) => {
                const healthRecords = pig?.healthRecords || []
                return (
                  <div
                    key={pig.id}
                    className="p-3 sm:p-4 border border-amber-200 dark:border-amber-700 bg-gradient-to-r from-amber-50/80 to-amber-100/80 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{pig.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pen {pig.pen_id}</p>
                        <div className="mt-2 space-y-1">
                          {healthRecords
                            .filter((record) => {
                              if (record.nextDue) {
                                const dueDate = new Date(record.nextDue)
                                const threeDaysFromNow = new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000)
                                return (
                                  dueDate <= threeDaysFromNow && dueDate >= new Date() && record.status !== "completed"
                                )
                              }
                              return false
                            })
                            .map((record, index) => (
                              <div key={index} className="text-xs sm:text-sm flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{record.type}</span> -
                                <span className="text-amber-600 dark:text-amber-400 ml-1">
                                  Due {new Date(record.nextDue!).toLocaleDateString()}
                                </span>
                                <div className="ml-2 flex items-center space-x-2">
                                  <button onClick={async () => { try { const resp = await axios.put(`${utils.apiUrl}/health/${record.id}`, { status: 'completed' }, { headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` } }); const updated = resp?.data?.data ?? resp?.data; setLocalPigs(prev => prev.map(p => ({ ...p, healthRecords: (p.healthRecords || []).map(r => r.id === updated.id ? updated : r) }))); showSuccess('Success', 'Record marked completed'); } catch (err: any) { showError('Error', err?.response?.data?.message || err?.message) } }} className="text-xs text-emerald-700">Mark done</button>
                                  <button onClick={async () => { try { const resp = await axios.delete(`${utils.apiUrl}/health/${record.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` } }); const deleted = resp?.data?.data ?? resp?.data; setLocalPigs(prev => prev.map(p => ({ ...p, healthRecords: (p.healthRecords || []).filter(r => r.id !== deleted.id) }))); showSuccess('Success', 'Record deleted'); } catch (err: any) { showError('Error', err?.response?.data?.message || err?.message) } }} className="text-xs text-red-600">Delete</button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/50 dark:bg-gray-700/50 border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex-shrink-0 w-full sm:w-auto"
                      >
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        <span className="text-xs sm:text-sm">Schedule</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Pigs Health Status */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <span className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">All Pigs Health Status</span>
            <Dialog open={addOpen} onOpenChange={(v) => setAddOpen(v)}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white w-full sm:w-auto">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Add Health Record</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add health record</DialogTitle>
                </DialogHeader>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user?.farm_id) { showError('Error', 'Missing farm info'); return }
                  try {
                    const resp = await axios.post(`${utils.apiUrl}/health/${user.farm_id}`, form, { headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` } })
                    const added = resp?.data?.data ?? resp?.data
                    // add record into localPigs
                    setLocalPigs(prev => prev.map(p => p.pig_id === added.pig_id ? { ...p, healthRecords: [added, ...(p.healthRecords || [])] } : p))
                    showSuccess('Success', 'Health record added')
                    setAddOpen(false)
                  } catch (err: any) {
                    showError('Error', err?.response?.data?.message || err?.message)
                  }
                }}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium">Pig</label>
                      <Select value={form.pig_id} onValueChange={(v) => setForm({ ...form, pig_id: v })}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {localPigs?.map(p => <SelectItem key={p.pig_id} value={p.pig_id}>{p.name || p.pig_id}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Type</label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vaccination">Vaccination</SelectItem>
                          <SelectItem value="treatment">Treatment</SelectItem>
                          <SelectItem value="checkup">Checkup</SelectItem>
                          <SelectItem value="medication">Medication</SelectItem>
                          <SelectItem value="surgery">Surgery</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Description</label>
                      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">Date</label>
                        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Next due</label>
                        <Input type="date" value={form.next_due} onChange={(e) => setForm({ ...form, next_due: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Veterinarian</label>
                      <Input value={form.veterinarian} onChange={(e) => setForm({ ...form, veterinarian: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Notes</label>
                      <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                      <Button type="submit">Add</Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {localPigs?.map((pig) => {
              const status = getHealthStatus(pig)
              const healthRecords = pig?.healthRecords || []
              return (
                <div
                  key={pig.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 space-y-3 sm:space-y-0"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{pig.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Pen {penNamesConversion(pens, pig.pen_id ?? '')} • {pig.breed} • {pig.gender === "female" ? "Sow" : "Boar"}
                    </p>
                    <div className="mt-1 sm:mt-2">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Last health check:{" "}
                        {healthRecords.length > 0
                          ? new Date(healthRecords[healthRecords.length - 1].date).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-row sm:items-center sm:space-x-3">
                    <Badge
                      variant={status === "overdue" ? "destructive" : status === "upcoming" ? "secondary" : "default"}
                      className={`flex-shrink-0 text-xs sm:text-sm whitespace-nowrap ${status === "good"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                        : status === "overdue"
                          ? "bg-gradient-to-r from-red-500 to-red-600"
                          : "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                        }`}
                    >
                      {status === "overdue" ? "Overdue" : status === "upcoming" ? "Upcoming" : "Up to date"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 ml-2 sm:ml-0 flex-shrink-0"
                    >
                      <span className="text-xs sm:text-sm">View Records</span>
                    </Button>
                  </div>
                </div>
              )
            }) || []}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}