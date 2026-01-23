"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Utensils, Clock, Plus } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/lib/auth-context"
import * as utils from "@/lib/utils"
import { useToast } from "@/lib/toast-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import type { FeedingScheduleProps, Pig } from "@/types"
import { penNamesConversion } from "@/lib/utils"

export default function FeedingSchedule({ pigs, pens }: FeedingScheduleProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [localPigs, setLocalPigs] = useState<Pig[]>(pigs || [])
  const [periodRecords, setPeriodRecords] = useState([])
  const [dailyRecords, setDailyRecords] = useState([])

  useEffect(() => {
    setLocalPigs(pigs || [])
  }, [pigs])

  // Fetch period records (weekly/monthly)
  useEffect(() => {
    if (user?.farm_id) {
      axios.get(`${utils.apiUrl}/feeding/record/period/farm/${user.farm_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` }
      })
        .then(resp => {
          setPeriodRecords(resp.data.data || [])
        })
        .catch(err => console.error('Error fetching period records:', err))
    }
  }, [user?.farm_id])

  // Fetch daily records
  useEffect(() => {
    if (user?.farm_id) {
      axios.get(`${utils.apiUrl}/feeding/record/farm/${user.farm_id}?record_type=daily`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` }
      })
        .then(resp => {
          setDailyRecords(resp.data.data || [])
        })
        .catch(err => console.error('Error fetching daily records:', err))
    }
  }, [user?.farm_id])

  const [recordType, setRecordType] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const [dailyForm, setDailyForm] = useState({
    pig_id: '',
    pen_id: '',
    feed_type: 'pellets',
    amount: '',
    unit: 'grams',
    feeding_time: new Date().toISOString(),
    notes: ''
  })

  const [weeklyForm, setWeeklyForm] = useState({
    feed_type: 'pellets',
    total_amount: '',
    unit: 'kg',
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [monthlyForm, setMonthlyForm] = useState({
    feed_type: 'pellets',
    total_amount: '',
    unit: 'kg',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const getCurrentFeedingStatus = (pig: Pig) => {
    if (!pig?.feedingSchedule?.lastFed) return "overdue"
    const now = new Date()
    const lastFed = new Date(pig.feedingSchedule.lastFed)
    const hoursSinceLastFed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastFed > 24) return "overdue"
    if (hoursSinceLastFed > 12) return "due"
    return "fed"
  }

  const safePigs = localPigs || []

  const pigsWithIndividualFeeding = safePigs.filter(pig => pig?.feedingSchedule?.lastFed)
  const overduePigs = pigsWithIndividualFeeding.filter((r) => getCurrentFeedingStatus(r) === "overdue")
  const duePigs = pigsWithIndividualFeeding.filter((r) => getCurrentFeedingStatus(r) === "due")
  const fedPigs = pigsWithIndividualFeeding.filter((r) => getCurrentFeedingStatus(r) === "fed")

  const getTotalDailyFeed = () => {
    return safePigs.reduce((total, pig) => {
      const dailyAmount = pig?.feedingSchedule?.dailyAmount || "0g"
      const amount = Number.parseFloat(dailyAmount.replace(/[^\d.]/g, ""))
      return total + (isNaN(amount) ? 0 : amount)
    }, 0)
  }

  // Aggregate daily records by date and feed_type
  const aggregateDailyRecords = (records) => {
    return records.reduce((acc, r) => {
      const date = new Date(r.feeding_time).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date: date,
          feed_types: {},
          total: 0
        }
      }
      const feedType = r.feed_type || 'Unknown'
      const amount = parseFloat(r.amount || 0)
      const amountInKg = r.unit === 'grams' ? amount / 1000 : r.unit === 'kg' ? amount : amount
      acc[date].feed_types[feedType] = (acc[date].feed_types[feedType] || 0) + amountInKg
      acc[date].total += amountInKg
      return acc
    }, {})
  }

  const aggregatePeriodRecords = (records) => {
    return records.reduce((acc, r) => {
      const key = `${r.start_date}-${r.end_date}`
      if (!acc[key]) {
        acc[key] = {
          start: r.start_date,
          end: r.end_date,
          feed_types: {},
          total: 0
        }
      }
      const feedType = r.feed_type || 'Unknown'
      const amount = parseFloat(r.total_amount || 0)
      acc[key].feed_types[feedType] = (acc[key].feed_types[feedType] || 0) + amount
      acc[key].total += amount
      return acc
    }, {})
  }

  const dailyAggregates = aggregateDailyRecords(dailyRecords)
  const weeklyAggregates = aggregatePeriodRecords(periodRecords.filter(r => r.record_type === 'weekly'))
  const monthlyAggregates = aggregatePeriodRecords(periodRecords.filter(r => r.record_type === 'monthly'))

  const sortedDaily = Object.values(dailyAggregates).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const sortedWeekly = Object.values(weeklyAggregates).sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime())
  const sortedMonthly = Object.values(monthlyAggregates).sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime())

  const handleDailySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.farm_id) { showError('Error', 'Missing farm info'); return }
    if (!dailyForm.pig_id && !dailyForm.pen_id) {
      showError('Error', 'Please select either a pig or pen')
      return
    }
    try {
      const payload = {
        ...dailyForm,
        farm_id: user.farm_id,
        pig_id: dailyForm.pig_id || null,
        pen_id: dailyForm.pen_id || null
      }
      const resp = await axios.post(`${utils.apiUrl}/feeding/record/${user.farm_id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` }
      })
      const added = resp?.data?.data ?? resp?.data
      if (added?.feeding_time) {
        if (added?.pig_id) {
          setLocalPigs(prev => prev.map(p => p.pig_id === added.pig_id ? {
            ...p,
            feedingSchedule: { ...(p.feedingSchedule || {}), lastFed: added.feeding_time }
          } : p))
        } else if (added?.pen_id) {
          setLocalPigs(prev => prev.map(p => p.pen_id === added.pen_id ? {
            ...p,
            feedingSchedule: { ...(p.feedingSchedule || {}), lastFed: added.feeding_time }
          } : p))
        }
      }
      showSuccess('Success', 'Daily feeding recorded')
      setAddOpen(false)
      setDailyForm({ pig_id: '', pen_id: '', feed_type: 'pellets', amount: '', unit: 'grams', feeding_time: new Date().toISOString(), notes: '' })

      // Refresh daily records
      axios.get(`${utils.apiUrl}/feeding/record/farm/${user.farm_id}?record_type=daily`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` }
      }).then(resp => setDailyRecords(resp.data.data || []))
    } catch (err: any) {
      showError('Error', err?.response?.data?.message || err?.message)
    }
  }

  const handleWeeklySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.farm_id) { showError('Error', 'Missing farm info'); return }
    try {
      const payload = {
        ...weeklyForm,
        farm_id: user.farm_id,
        record_type: 'weekly'
      }
      await axios.post(`${utils.apiUrl}/feeding/record/period/${user.farm_id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` }
      })
      showSuccess('Success', `Weekly feeding recorded (${weeklyForm.start_date} to ${weeklyForm.end_date})`)
      setAddOpen(false)
      setWeeklyForm({ feed_type: 'pellets', total_amount: '', unit: 'kg', start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], notes: '' })

      // Refresh period records
      axios.get(`${utils.apiUrl}/feeding/record/period/farm/${user.farm_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` }
      }).then(resp => setPeriodRecords(resp.data.data || []))
    } catch (err: any) {
      showError('Error', err?.response?.data?.message || err?.message)
    }
  }

  const handleMonthlySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.farm_id) { showError('Error', 'Missing farm info'); return }
    try {
      const payload = {
        ...monthlyForm,
        farm_id: user.farm_id,
        record_type: 'monthly'
      }
      await axios.post(`${utils.apiUrl}/feeding/record/period/${user.farm_id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` }
      })
      showSuccess('Success', `Monthly feeding recorded (${monthlyForm.start_date} to ${monthlyForm.end_date})`)
      setAddOpen(false)
      setMonthlyForm({ feed_type: 'pellets', total_amount: '', unit: 'kg', start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], notes: '' })

      // Refresh period records
      axios.get(`${utils.apiUrl}/feeding/record/period/farm/${user.farm_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` }
      }).then(resp => setPeriodRecords(resp.data.data || []))
    } catch (err: any) {
      showError('Error', err?.response?.data?.message || err?.message)
    }
  }

  const sortedDailyRecords = [...dailyRecords].sort((a, b) => new Date(b.feeding_time).getTime() - new Date(a.feeding_time).getTime())

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-red-600 dark:text-red-400">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent">
              {overduePigs.length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Not fed in 24+ hours</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-amber-600 dark:text-amber-400">Due Soon</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              {duePigs.length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Due for feeding</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-green-600 dark:text-green-400">Recently Fed</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
              {fedPigs.length}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Fed today</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Daily Feed Total</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {getTotalDailyFeed().toFixed(1)}g
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total daily requirement</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 border-b border-gray-200 dark:border-gray-600 pb-3 sm:pb-4">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-gray-900 dark:text-gray-100">Today's Feeding Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 p-3 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-3 sm:mt-5">
            {["Morning (6:00 AM)", "Afternoon (2:00 PM)", "Evening (6:00 PM)"].map((timeSlot, index) => (
              <div key={timeSlot} className="space-y-3">
                <h4 className="font-medium text-base sm:text-lg text-gray-900 dark:text-gray-100">{timeSlot}</h4>
                <div className="space-y-2">
                  {safePigs.filter((pig) => {
                    const times = pig?.feedingSchedule?.times || []
                    return times.some((time) => {
                      if (index === 0) return time.includes("6:00") && time.includes("AM")
                      if (index === 1) return time.includes("2:00") && time.includes("PM")
                      return time.includes("6:00") && time.includes("PM")
                    })
                  }).map((pig) => {
                    const status = getCurrentFeedingStatus(pig)
                    const dailyAmount = pig?.feedingSchedule?.dailyAmount || "N/A"
                    return (
                      <div key={pig?.id} className="flex items-center justify-between p-2 sm:p-3 border border-gray-200 dark:border-gray-600 rounded bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">{pig?.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{pig?.pen_id} • {dailyAmount}</p>
                        </div>
                        <Badge variant={status === "overdue" ? "destructive" : status === "due" ? "secondary" : "default"} className={`ml-2 flex-shrink-0 text-xs whitespace-nowrap ${status === "fed" ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : status === "overdue" ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-amber-500 to-amber-600 text-white"}`}>
                          {status === "overdue" ? "Overdue" : status === "due" ? "Due" : "Fed"}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <span className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">Individual Feeding Status</span>
            <Dialog open={addOpen} onOpenChange={(v) => setAddOpen(v)}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white w-full sm:w-auto">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Record Feeding</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>Record Feeding</DialogTitle>
                </DialogHeader>
                <Tabs value={recordType} onValueChange={(v) => setRecordType(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                  <TabsContent value="daily">
                    <form onSubmit={handleDailySubmit}>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium">Select Pig or Pen</label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <div>
                              <label className="text-xs text-gray-500">Pig</label>
                              <Select value={dailyForm?.pig_id} onValueChange={(v) => setDailyForm({ ...dailyForm, pig_id: v, pen_id: '' })}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select pig" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {localPigs?.map(p => <SelectItem key={p.pig_id} value={p.pig_id || ''}>{p.name || p.pig_id}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Pen</label>
                              <Select value={dailyForm.pen_id} onValueChange={(v) => setDailyForm({ ...dailyForm, pen_id: v, pig_id: '' })}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select pen" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {pens?.map(pen => <SelectItem key={pen.id} value={pen.id}>{pen.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Feed type</label>
                          <Input value={dailyForm.feed_type} onChange={(e) => setDailyForm({ ...dailyForm, feed_type: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium">Amount</label>
                            <Input value={dailyForm.amount} onChange={(e) => setDailyForm({ ...dailyForm, amount: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Unit</label>
                            <Select value={dailyForm.unit} onValueChange={(v) => setDailyForm({ ...dailyForm, unit: v })}>
                              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="grams">grams</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="liters">liters</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Notes</label>
                          <Textarea value={dailyForm.notes} onChange={(e) => setDailyForm({ ...dailyForm, notes: e.target.value })} />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                          <Button type="submit">Record</Button>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                  <TabsContent value="weekly">
                    <form onSubmit={handleWeeklySubmit}>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Record total feed usage for the entire farm this week</p>
                        <div>
                          <label className="text-xs font-medium">Feed type</label>
                          <Input value={weeklyForm.feed_type} onChange={(e) => setWeeklyForm({ ...weeklyForm, feed_type: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium">Total Amount</label>
                            <Input value={weeklyForm.total_amount} onChange={(e) => setWeeklyForm({ ...weeklyForm, total_amount: e.target.value })} placeholder="e.g., 50" />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Unit</label>
                            <Select value={weeklyForm.unit} onValueChange={(v) => setWeeklyForm({ ...weeklyForm, unit: v })}>
                              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="liters">liters</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium">Start Date</label>
                            <Input type="date" value={weeklyForm.start_date} onChange={(e) => setWeeklyForm({ ...weeklyForm, start_date: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs font-medium">End Date</label>
                            <Input type="date" value={weeklyForm.end_date} onChange={(e) => setWeeklyForm({ ...weeklyForm, end_date: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Notes</label>
                          <Textarea value={weeklyForm.notes} onChange={(e) => setWeeklyForm({ ...weeklyForm, notes: e.target.value })} placeholder="Optional notes" />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                          <Button type="submit">Record Weekly</Button>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                  <TabsContent value="monthly">
                    <form onSubmit={handleMonthlySubmit}>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Record total feed usage for the entire farm this month</p>
                        <div>
                          <label className="text-xs font-medium">Feed type</label>
                          <Input value={monthlyForm.feed_type} onChange={(e) => setMonthlyForm({ ...monthlyForm, feed_type: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium">Total Amount</label>
                            <Input value={monthlyForm.total_amount} onChange={(e) => setMonthlyForm({ ...monthlyForm, total_amount: e.target.value })} placeholder="e.g., 200" />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Unit</label>
                            <Select value={monthlyForm.unit} onValueChange={(v) => setMonthlyForm({ ...monthlyForm, unit: v })}>
                              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="liters">liters</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium">Start Date</label>
                            <Input type="date" value={monthlyForm.start_date} onChange={(e) => setMonthlyForm({ ...monthlyForm, start_date: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs font-medium">End Date</label>
                            <Input type="date" value={monthlyForm.end_date} onChange={(e) => setMonthlyForm({ ...monthlyForm, end_date: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Notes</label>
                          <Textarea value={monthlyForm.notes} onChange={(e) => setMonthlyForm({ ...monthlyForm, notes: e.target.value })} placeholder="Optional notes" />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                          <Button type="submit">Record Monthly</Button>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {dailyRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No daily feeding records yet.</p>
              <p className="text-sm mt-2">Use "Record Feeding" to track individual pig or pen feeding.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {sortedDailyRecords.map((record) => {
                const isPig = !!record.pig_id
                const entityId = isPig ? record.pig_id : record.pen_id
                const entityName = isPig
                  ? (localPigs.find(p => p.pig_id === entityId)?.name || entityId)
                  : (pens.find(p => p.id === entityId)?.name || entityId)
                const entityType = isPig ? 'Pig' : 'Pen'
                const feedTime = new Date(record.feeding_time).toLocaleString()
                return (
                  <div
                    key={record.id || record.feeding_time}
                    className="flex flex-col lg:flex-row lg:items-start lg:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 space-y-3 lg:space-y-0"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        {entityType}: {entityName}
                      </h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Feed Type:</span> {record.feed_type || "N/A"}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Amount:</span> {record.amount || "N/A"} {record.unit || ""}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Fed At:</span> {feedTime}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Notes:</span> {record.notes || "None"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feeding History: Removed daily tab since no API, kept weekly/monthly with feed type breakdowns */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">Feeding History (By Period and Feed Type)</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly" className="space-y-3">
              {sortedWeekly.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No weekly records yet.</p>
              ) : (
                sortedWeekly.map((period, index) => (
                  <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>{new Date(period.start).toLocaleDateString()} - {new Date(period.end).toLocaleDateString()}</span>
                      <span>Total: {period.total.toFixed(1)} kg</span>
                    </div>
                    {Object.entries(period.feed_types).map(([feedType, amt]) => (
                      <div key={feedType} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{feedType}</span>
                        <span>{amt.toFixed(1)} kg</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </TabsContent>
            <TabsContent value="monthly" className="space-y-3">
              {sortedMonthly.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No monthly records yet.</p>
              ) : (
                sortedMonthly.map((period, index) => (
                  <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>{new Date(period.start).toLocaleDateString()} - {new Date(period.end).toLocaleDateString()}</span>
                      <span>Total: {period.total.toFixed(1)} kg</span>
                    </div>
                    {Object.entries(period.feed_types).map(([feedType, amt]) => (
                      <div key={feedType} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{feedType}</span>
                        <span>{amt.toFixed(1)} kg</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">Feed Inventory & Requirements</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-3 sm:mt-5">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-300 text-sm sm:text-base">Daily Requirements</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Pellets:</span>
                  <span className="text-gray-900 dark:text-gray-100">{(getTotalDailyFeed() * 0.7).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Hay:</span>
                  <span className="text-gray-900 dark:text-gray-100">{(getTotalDailyFeed() * 0.2).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Vegetables:</span>
                  <span className="text-gray-900 dark:text-gray-100">{(getTotalDailyFeed() * 0.1).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between font-medium border-t border-blue-200 dark:border-blue-700 pt-2 text-xs sm:text-sm">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-gray-900 dark:text-gray-100">{getTotalDailyFeed().toFixed(1)}g</span>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 rounded-lg border border-green-200 dark:border-green-700">
              <h4 className="font-medium mb-3 text-green-800 dark:text-green-300 text-sm sm:text-base">Weekly Requirements</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Pellets:</span>
                  <span className="text-gray-900 dark:text-gray-100">{((getTotalDailyFeed() * 0.7 * 7) / 1000).toFixed(2)}kg</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Hay:</span>
                  <span className="text-gray-900 dark:text-gray-100">{((getTotalDailyFeed() * 0.2 * 7) / 1000).toFixed(2)}kg</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Vegetables:</span>
                  <span className="text-gray-900 dark:text-gray-100">{((getTotalDailyFeed() * 0.1 * 7) / 1000).toFixed(2)}kg</span>
                </div>
                <div className="flex justify-between font-medium border-t border-green-200 dark:border-green-700 pt-2 text-xs sm:text-sm">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-gray-900 dark:text-gray-100">{((getTotalDailyFeed() * 7) / 1000).toFixed(2)}kg</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}