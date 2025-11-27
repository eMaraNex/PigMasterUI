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
import { useState } from "react"
import type { FeedingScheduleProps, Pig } from "@/types"
import { hutchNamesConversion } from "@/lib/utils"

export default function FeedingSchedule({ pigs, hutches }: FeedingScheduleProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    pig_id: pigs?.[0]?.pig_id || '',
    feed_type: 'pellets',
    amount: '',
    unit: 'grams',
    feeding_time: new Date().toISOString(),
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

  const safePigs = pigs || []
  const overduePigs = safePigs.filter((r) => getCurrentFeedingStatus(r) === "overdue")
  const duePigs = safePigs.filter((r) => getCurrentFeedingStatus(r) === "due")
  const fedPigs = safePigs.filter((r) => getCurrentFeedingStatus(r) === "fed")

  const getTotalDailyFeed = () => {
    return safePigs.reduce((total, pig) => {
      const dailyAmount = pig?.feedingSchedule?.dailyAmount || "0g"
      const amount = Number.parseFloat(dailyAmount.replace(/[^\d.]/g, ""))
      return total + (isNaN(amount) ? 0 : amount)
    }, 0)
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Feeding Overview */}
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

      {/* Feeding Schedule by Time */}
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
                  {safePigs
                    .filter((pig) => {
                      const times = pig?.feedingSchedule?.times || []
                      return times.some((time) => {
                        if (index === 0) return time.includes("6:00") && time.includes("AM")
                        if (index === 1) return time.includes("2:00") && time.includes("PM")
                        return time.includes("6:00") && time.includes("PM")
                      })
                    })
                    .map((pig) => {
                      const status = getCurrentFeedingStatus(pig)
                      const dailyAmount = pig?.feedingSchedule?.dailyAmount || "N/A"
                      return (
                        <div
                          key={pig?.id}
                          className="flex items-center justify-between p-2 sm:p-3 border border-gray-200 dark:border-gray-600 rounded bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">{pig?.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {pig?.hutch_id} • {dailyAmount}
                            </p>
                          </div>
                          <Badge
                            variant={status === "overdue" ? "destructive" : status === "due" ? "secondary" : "default"}
                            className={`ml-2 flex-shrink-0 text-xs whitespace-nowrap ${status === "fed"
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                              : status === "overdue"
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                              }`}
                          >
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

      {/* Individual Pig Feeding Status */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <span className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">Individual Feeding Status</span>
            <Dialog open={addOpen} onOpenChange={(v)=>setAddOpen(v)}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white w-full sm:w-auto">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Record Feeding</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Record feeding</DialogTitle>
                </DialogHeader>
                <form onSubmit={async(e)=>{e.preventDefault(); if(!user?.farm_id){ showError('Error','Missing farm info'); return } try{ await axios.post(`${utils.apiUrl}/feeding/record/${user.farm_id}`, form, { headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` } }); showSuccess('Success','Feeding recorded'); setAddOpen(false); window.location.reload(); }catch(err:any){ showError('Error', err?.response?.data?.message || err?.message) } }}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium">Pig</label>
                      <Select value={form.pig_id} onValueChange={(v)=>setForm({...form,pig_id:v})}>
                        <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          {pigs?.map(p=> <SelectItem key={p.pig_id} value={p.pig_id}>{p.name || p.pig_id}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Feed type</label>
                      <Input value={form.feed_type} onChange={(e)=>setForm({...form,feed_type:e.target.value})}/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">Amount</label>
                        <Input value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})}/>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Unit</label>
                        <Select value={form.unit} onValueChange={(v)=>setForm({...form,unit:v})}>
                          <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
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
                      <Textarea value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={()=>setAddOpen(false)}>Cancel</Button>
                      <Button type="submit">Record</Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {safePigs.map((pig) => {
              const status = getCurrentFeedingStatus(pig)
              const lastFed = pig?.feedingSchedule?.lastFed ? new Date(pig.feedingSchedule.lastFed) : new Date()
              const hoursSinceLastFed = pig?.feedingSchedule?.lastFed
                ? Math.floor((new Date().getTime() - lastFed.getTime()) / (1000 * 60 * 60))
                : 0

              const dailyAmount = pig?.feedingSchedule?.dailyAmount || "N/A"
              const feedType = pig?.feedingSchedule?.feedType || "N/A"
              const times = pig?.feedingSchedule?.times || []

              return (
                <div
                  key={pig.id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 space-y-3 lg:space-y-0"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{pig.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Hutch {hutchNamesConversion(hutches, pig.hutch_id ?? '')} • {pig?.breed} • {pig?.gender === "female" ? "Sow" : "Boar"}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Daily Amount:</span> {dailyAmount}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Feed Type:</span> {feedType}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Schedule:</span> {times.length > 0 ? times.join(", ") : "N/A"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Last Fed:</span> {
                          pig?.feedingSchedule?.lastFed
                            ? `${lastFed.toLocaleDateString()} at ${lastFed.toLocaleTimeString()}`
                            : "Never"
                        }
                        {pig?.feedingSchedule?.lastFed && (
                          <span className="text-gray-500 dark:text-gray-500 ml-1">({hoursSinceLastFed}h ago)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-row sm:items-center sm:space-x-3">
                    <Badge
                      variant={status === "overdue" ? "destructive" : status === "due" ? "secondary" : "default"}
                      className={`flex-shrink-0 text-xs whitespace-nowrap ${status === "fed"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                        : status === "overdue"
                          ? "bg-gradient-to-r from-red-500 to-red-600"
                          : "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                        }`}
                    >
                      {status === "overdue" ? "Overdue" : status === "due" ? "Due" : "Fed"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 ml-2 sm:ml-0 flex-shrink-0"
                      onClick={async ()=>{
                        try{
                          if (!user?.farm_id) { showError('Error','Missing farm info'); return }
                          // try to use pig feedingSchedule data if available
                          const amount = pig?.feedingSchedule?.dailyAmount || '0'
                          const feedType = pig?.feedingSchedule?.feedType || 'pellets'
                          const payload = { pig_id: pig.pig_id, farm_id: user.farm_id, feed_type: feedType, amount: amount, unit: 'grams', feeding_time: new Date().toISOString() }
                          await axios.post(`${utils.apiUrl}/feeding/record/${user.farm_id}`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('pig_farm_token')}` } })
                          showSuccess('Success','Feeding recorded')
                          window.location.reload()
                        }catch(err:any){ showError('Error', err?.response?.data?.message || err?.message) }
                      }}
                    >
                      <Utensils className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Feed Now</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feed Inventory */}
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
                  <span className="text-gray-900 dark:text-gray-100">
                    {((getTotalDailyFeed() * 0.7 * 7) / 1000).toFixed(2)}kg
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Hay:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {((getTotalDailyFeed() * 0.2 * 7) / 1000).toFixed(2)}kg
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Vegetables:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {((getTotalDailyFeed() * 0.1 * 7) / 1000).toFixed(2)}kg
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t border-green-200 dark:border-green-700 pt-2 text-xs sm:text-sm">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {((getTotalDailyFeed() * 7) / 1000).toFixed(2)}kg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}