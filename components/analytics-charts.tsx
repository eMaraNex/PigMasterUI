"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Activity,
  Heart,
  Scale,
  Zap,
  Target,
  Home,
  Users,
  AlertTriangle,
  Clock,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Pie,
} from "recharts"
import { useCurrency } from "@/lib/currency-context"
import type { Pig, EarningsRecord, Row, MonthlyEarning, HealthData, AgeGroup, FeedData, OccupancyData, WeightTrend, MortalityData, GenderData, BreedCount } from "@/types"
import { useAuth } from "@/lib/auth-context"
import axios from "axios"
import * as utils from "@/lib/utils"

const colors = {
  primary: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"],
  gradients: [
    "from-blue-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-pink-500 to-rose-600",
    "from-orange-500 to-red-600",
    "from-green-500 to-emerald-600",
    "from-cyan-500 to-blue-600",
  ],
  health: {
    excellent: "#10b981",
    good: "#84cc16",
    fair: "#f59e0b",
    poor: "#ef4444",
  },
}

export default function AnalyticsCharts() {
  const { user } = useAuth();
  const { formatAmount, convertToBaseCurrency } = useCurrency()
  const [pigs, setPigs] = useState<Pig[]>([])
  const [earnings, setEarnings] = useState<EarningsRecord[]>([])
  const [timeRange, setTimeRange] = useState("6months")
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const token = localStorage.getItem("pig_farm_token") ?? "";

  useEffect(() => {
    loadData()
  }, [user?.farm_id])

  const loadData = async () => {
    setLoading(true);
    const farmId = user?.farm_id || "default-farm";
    const tempPigsData = localStorage.getItem(`pig_farm_pigs_${farmId}`) ?? '';
    const pigsData = JSON.parse(tempPigsData);
    let fetchedEarnings;
    if (user && farmId) {
      const response = await axios.get(`${utils.apiUrl}/earnings/${farmId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchedEarnings = response.data.data || [];
    }
    setPigs(pigsData)
    setEarnings(fetchedEarnings)
    setLoading(false)
  }

  const getTimeRangeData = () => {
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case "3months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case "6months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        break
      case "1year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        startDate = new Date(0)
    }

    return {
      earnings: earnings.filter((e) => new Date(e.date) >= startDate),
      pigs: pigs.filter((r) => new Date(r.created_at ?? r.birth_date ?? "") >= startDate),
    }
  }

  const getMonthlyEarnings = (): MonthlyEarning[] => {
    const { earnings: filteredEarnings } = getTimeRangeData();
    const monthlyData: Record<string, number> = {};

    filteredEarnings.forEach((earning) => {
      const date = new Date(earning.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const amountInBase = convertToBaseCurrency(earning.amount, earning.currency as any)

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0
      }
      monthlyData[monthKey] += amountInBase
    })
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        amount,
      }))
  }

  const getHealthDistribution = (): HealthData[] => {
    const totalPigs = pigs.length || 1
    const healthData = {
      excellent: Math.floor(totalPigs * 0.4),
      good: Math.floor(totalPigs * 0.35),
      fair: Math.floor(totalPigs * 0.2),
      poor: Math.floor(totalPigs * 0.05),
    }

    return [
      { name: "Excellent", value: healthData.excellent, color: colors.health.excellent },
      { name: "Good", value: healthData.good, color: colors.health.good },
      { name: "Fair", value: healthData.fair, color: colors.health.fair },
      { name: "Poor", value: healthData.poor, color: colors.health.poor },
    ]
  }

  const getAgeDistribution = (): AgeGroup[] => {
    const ageGroups = {
      "0-3 months": 0,
      "3-6 months": 0,
      "6-12 months": 0,
      "1-2 years": 0,
      "2+ years": 0,
    }
    pigs.forEach((pig) => {
      const birthDate = new Date(pig.birth_date ?? '')
      const now = new Date()
      const ageInMonths = (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)

      if (ageInMonths <= 3) ageGroups["0-3 months"]++
      else if (ageInMonths <= 6) ageGroups["3-6 months"]++
      else if (ageInMonths <= 12) ageGroups["6-12 months"]++
      else if (ageInMonths <= 24) ageGroups["1-2 years"]++
      else ageGroups["2+ years"]++
    })

    return Object.entries(ageGroups).map(([age, count]) => ({ age, count }))
  }

  const getFeedConsumption = (): FeedData[] => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        consumption: 800 + Math.random() * 400,
        cost: 120 + Math.random() * 80,
      })
    }
    return months
  }

  const getBreedingSuccess = (): number => {
    const femalePigs = pigs.filter((r) => r.gender === "female")
    const totalAttempts = femalePigs.length * 2
    const successfulBreedings = pigs.reduce((sum, r) => sum + (r.total_litters || 0), 0)
    return Math.round((successfulBreedings / Math.max(totalAttempts, 1)) * 100)
  }
  const getHutchOccupancy = (): OccupancyData[] => {
    try {
      const farmId = user?.farm_id || "default-farm";
      const rowsData = JSON.parse(localStorage.getItem(`pig_farm_rows_${farmId}`) || '[]') as Row[];
      const totalCapacity = rowsData.reduce((sum, row) => sum + row.capacity, 0);
      const totalOccupied = rowsData.reduce((sum, row) => sum + row.occupied, 0);
      return [
        { name: "Occupied", value: totalOccupied, color: "#10b981" },
        { name: "Available", value: totalCapacity - totalOccupied, color: "#3b82f6" },
      ];
    } catch (error) {
      console.error("Error in getHutchOccupancy:", error);
      return [
        { name: "Occupied", value: 0, color: "#10b981" },
        { name: "Available", value: 0, color: "#3b82f6" },
      ];
    }
  };

  const getWeightTrends = (): WeightTrend[] => {
    const farmId = user?.farm_id || "default-farm";
    const tempPigsData = localStorage.getItem(`pig_farm_pigs_${farmId}`) ?? '[]';
    const pigsData: Pig[] = JSON.parse(tempPigsData);
    const breeds = [...new Set(pigsData.map((r) => r.breed))];
    const finalData = breeds
      .map((breed) => {
        const breedPigs = pigsData.filter((r) => r.breed === breed);
        const avgTempWeight = breedPigs.reduce((sum, r) => sum + parseFloat(String(r.weight)), 0) / Math.max(breedPigs.length, 1);
        const tempWeight = parseFloat(avgTempWeight.toFixed(1));
        return { breed, weight: tempWeight, count: breedPigs.length };
      })
      .filter((b) => b.count > 0);
    return finalData;
  };

  const getMortalityRate = (): MortalityData[] => {
    const months = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        rate: Math.random() * 5
      })
    }
    return months
  }

  const getGenderDistribution = (): GenderData[] => {
    const genderCounts = {
      male: pigs.filter((r) => r.gender === "male").length,
      female: pigs.filter((r) => r.gender === "female").length,
    }

    const total = genderCounts.male + genderCounts.female

    return [
      {
        gender: "male",
        count: genderCounts.male,
        percentage: total > 0 ? (genderCounts.male / total) * 100 : 0,
      },
      {
        gender: "female",
        count: genderCounts.female,
        percentage: total > 0 ? (genderCounts.female / total) * 100 : 0,
      },
    ]
  }

  const getBreedDistribution = (): BreedCount[] => {
    const breedCounts: Record<string, number> = {}
    pigs.forEach((pig) => {
      breedCounts[pig.breed] = (breedCounts[pig.breed] || 0) + 1
    })
    const total = pigs.length
    return Object.entries(breedCounts)
      .map(([breed, count]) => ({
        breed,
        count: count as number,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }

  const breeds = [...new Set(pigs.map((r) => r.breed))];
  const monthlyEarnings = getMonthlyEarnings();
  const healthDistribution = getHealthDistribution();
  const ageDistribution = getAgeDistribution();
  const feedConsumption = getFeedConsumption();
  const breedingSuccess = getBreedingSuccess();
  const hutchOccupancy = getHutchOccupancy();
  const weightTrends = getWeightTrends();
  const mortalityRate = getMortalityRate();
  const genderDistribution = getGenderDistribution();
  const breedDistribution = getBreedDistribution();
  const totalPigs = pigs.length
  const totalEarnings = earnings.reduce((sum, e) => sum + convertToBaseCurrency(e.amount, e.currency as any), 0);
  const avgWeight = pigs.reduce((sum, r) => sum + parseFloat(String(r.weight)), 0) / Math.max(pigs.length, 1);
  const pregnantPigs = pigs.filter((r) => r.is_pregnant).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="">
      {/* <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6"> */}
      <div className="">
        {/* Header */}
        {/* <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Farm Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Comprehensive insights into your pig farm performance
          </p>
        </div> */}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Pigs</p>
                  <p className="text-3xl font-bold">{totalPigs}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Earnings</p>
                  <p className="text-3xl font-bold">{formatAmount(totalEarnings)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Avg Weight</p>
                  <p className="text-3xl font-bold">{avgWeight.toFixed(1)}kg</p>
                </div>
                <Scale className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Pregnant</p>
                  <p className="text-3xl font-bold">{pregnantPigs}</p>
                </div>
                <Heart className="h-8 w-8 text-pink-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Range Selector */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span>Analytics Overview</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabbed Analytics */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="health">Health & Growth</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Health Distribution */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>Health Status Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={healthDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {healthDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Age Distribution */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span>Age Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="age" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Breed Distribution */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <span>Breed Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {breedDistribution.map((data, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.breed}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{data.count}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              ({data.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r ${colors.gradients[index % colors.gradients.length]} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {/* Breeding Success Rate */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    <span>Breeding Success Rate</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        data={[{ value: breedingSuccess }]}
                      >
                        <RadialBar dataKey="value" cornerRadius={10} fill="#8b5cf6" />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{breedingSuccess}%</div>
                        <div className="text-sm text-gray-500">Success Rate</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gender Distribution */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-indigo-500" />
                    <span>Gender Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {genderDistribution.map((data, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                            {data.gender}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{data.count}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              ({data.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r ${data.gender === "male" ? "from-blue-500 to-blue-600" : "from-pink-500 to-pink-600"} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hutch Occupancy */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Home className="h-5 w-5 text-indigo-500" />
                    <span>Hutch Occupancy Rate</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={hutchOccupancy}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {hutchOccupancy.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-4">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {Math.round(
                        (hutchOccupancy[0].value / (hutchOccupancy[0].value + hutchOccupancy[1].value)) * 100,
                      )}
                      % Occupied
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Consumption vs Cost */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    <span>Feed Consumption & Cost</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={feedConsumption}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis yAxisId="left" stroke="#6b7280" />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="consumption" fill="#f59e0b" name="Consumption (kg)" />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cost"
                        stroke="#ef4444"
                        strokeWidth={3}
                        name="Cost ($)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {/* Monthly Earnings */}
              <Card className="bg-white/80 dark:bg-gray-800/80">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Monthly Earnings Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyEarnings}>
                      <defs>
                        <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#earningsGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weight Trends by Breed */}
              <Card className="bg-white/80 dark:bg-gray-800/80">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Scale className="h-5 w-5 text-green-500" />
                    <span>Average Weight by Breed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '400px' }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={weightTrends}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="breed"
                          stroke="#6b7280"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={11}
                          interval="preserveStartEnd"
                          tickFormatter={(value: string) => value.slice(0, 10) + (value.length > 10 ? '...' : '')}
                        />
                        <YAxis
                          stroke="#6b7280"
                          label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "none",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value, name) => [`${value} kg`, 'Average Weight']}
                          labelFormatter={(label) => `Breed: ${label}`}
                        />
                        <Bar
                          dataKey="weight"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          minPointSize={2}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Mortality Rate Trend */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>Mortality Rate Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mortalityRate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-100">Active Breeds</span>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {breeds.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-100">Breeding Ready</span>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {pigs.filter((r) => r.gender === 'female' && !r.is_pregnant).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-100">Total Litters</span>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {pigs.reduce((sum, r) => sum + (r.total_litters || 0), 0)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Indicators */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span>Performance Indicators</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Feed Efficiency</span>
                        <span className="text-sm text-green-600 font-semibold">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Growth Rate</span>
                        <span className="text-sm text-blue-600 font-semibold">87%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "87%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Health Score</span>
                        <span className="text-sm text-purple-600 font-semibold">95%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: "95%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Productivity</span>
                        <span className="text-sm text-orange-600 font-semibold">89%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: "89%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div >
  )
}
