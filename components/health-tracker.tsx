"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, AlertTriangle, Calendar, Plus } from "lucide-react"
import type { HealthTrackerProps, Pig } from "@/types"
import { hutchNamesConversion } from "@/lib/utils"

export default function HealthTracker({ pigs, hutches }: HealthTrackerProps) {
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

  const overduePigs = pigs?.filter((r) => getHealthStatus(r) === "overdue") || []
  const upcomingPigs = pigs?.filter((r) => getHealthStatus(r) === "upcoming") || []
  const healthyPigs = pigs?.filter((r) => getHealthStatus(r) === "good") || []

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
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Hutch {pig.hutch_id}</p>
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
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Hutch {pig.hutch_id}</p>
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
                              <div key={index} className="text-xs sm:text-sm">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{record.type}</span> -
                                <span className="text-amber-600 dark:text-amber-400 ml-1">
                                  Due {new Date(record.nextDue!).toLocaleDateString()}
                                </span>
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
            <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white w-full sm:w-auto">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="text-xs sm:text-sm">Add Health Record</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {pigs?.map((pig) => {
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
                      Hutch {hutchNamesConversion(hutches, pig.hutch_id ?? '')} • {pig.breed} • {pig.gender === "female" ? "Sow" : "Boar"}
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