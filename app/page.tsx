"use client";

import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, Heart, Pill, AlertTriangle, Building } from "lucide-react";
import PenLayout from "@/components/pen-layout";
import PigProfile from "@/components/pig-profile";
import BreedingManager from "@/components/breeding-manager";
import { WhatsAppButton } from "@/components/whatsapp-button"
import HealthTracker from "@/components/health-tracker";
import FeedingSchedule from "@/components/feeding-schedule";
import EarningsTracker from "@/components/earnings-tracker";
import ReportsDashboard from "@/components/reports-dashboard";
import AnalyticsCharts from "@/components/analytics-charts";
import CurrencySelector from "@/components/currency-selector";
import AddRowDialog from "@/components/add-row-dialog";
import FarmBanner from "@/components/farm-banner";
import Calendar, { type CalendarEvent } from "@/components/calender";
import EmailVerificationBanner from "@/components/email-verification-banner";
import ProtectedRoute from "@/components/auth/protected-route";
import ThemeToggle from "@/components/theme-toggle";
import AddPigletDialog from "@/components/add-piglet-dialog";
import RowTutorialModal from "@/components/row-tutorial-modal";
import { useToast } from "@/lib/toast-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { CurrencyProvider } from "@/lib/currency-context";
import axios from "axios";
import * as utils from "@/lib/utils";
import type { Pig as PigType } from "@/types";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/shared/sidebar";
import { Alert, ServerAlert, AlertCalendar } from "@/types";
import { penNamesConversion } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import FarmCreationModal from "@/components/farm-creation-modal";
import RowBanner from "@/components/row-banner";
import SkeletonDashboard from "@/components/skeletons/dashboard/skeleton";
import ClientHeaderWrapper from "@/components/ClientHeaderWrapper";
import { useSubscription } from "@/lib/subscription-context";
import UpgradePrompt from "@/components/shared/upgradeprompt";

const DashboardContent: React.FC = () => {
  const { user, logout } = useAuth();
  const { showError } = useToast();
  const { isFeatureAvailable, isTrialActive, trialDaysLeft, tier } = useSubscription();
  const [selectedPig, setSelectedPig] = useState<PigType | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [pigs, setPigs] = useState<PigType[]>([]);
  const [pens, setPens] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [farmName, setFarmName] = useState<string>("");
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<AlertCalendar[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showMandatoryRowModal, setShowMandatoryRowModal] = useState(false);
  const [addRowOpen, setAddRowOpen] = useState<boolean>(false);

  const tempFarmId = localStorage.getItem("pig_farm_id");
  let farmId;
  try {
    farmId = tempFarmId ? JSON.parse(tempFarmId) : null;
  } catch (e) {
    farmId = tempFarmId;
  }
  const finalFarmId =
    farmId && typeof farmId === "object" ? farmId.farmId : farmId;

  // Set hasFarm to true only if finalFarmId is a non-empty string
  const [hasFarm, setHasFarm] = useState<boolean>(
    !!finalFarmId && finalFarmId !== ""
  );
  const hasRow = rows?.length > 0;
  const [breedingRefreshTrigger, setBreedingRefreshTrigger] =
    useState<number>(0);
  const [showAddPigletDialog, setShowAddPigletDialog] = useState<boolean>(false);
  const [selectedPigForPiglet, setSelectedPigForPiglet] = useState<PigType | null>(null);
  const [boarIdForPiglet, setBoarIdForPiglet] = useState<string>("");
  const tabsListRef = useRef<HTMLDivElement>(null);
  const notifiedPigsRef = useRef<Set<string>>(new Set());
  const router = useRouter();

  const handleAddRow = () => {
    setAddRowOpen(true);
    setShowMandatoryRowModal(false);
  }

  const cachedFarmDetails = localStorage.getItem(`pig_farm_data`);
  const farmDetails = cachedFarmDetails ? JSON.parse(cachedFarmDetails) : [];

  useEffect(() => {
    if (hasFarm && dataLoaded && rows.length === 0) {
      setShowMandatoryRowModal(true);
    } else {
      setShowMandatoryRowModal(false);
    }
  }, [hasFarm, dataLoaded, rows.length])

  function transformRawEvents(rawData: AlertCalendar[]): CalendarEvent[] {
    const transformedEvents: CalendarEvent[] = [];
    const today = new Date();

    rawData.forEach((rawItem) => {
      rawItem.notify_on.forEach((notifyDateStr) => {
        const notifyDate = new Date(notifyDateStr);
        const type: "event" | "notification" = notifyDate < today ? "event" : "notification"
        const time: string | undefined = undefined;
        transformedEvents.push({
          id: rawItem.id,
          date: notifyDate.toISOString().split("T")[0],
          title: rawItem.name,
          description: rawItem.message,
          type: type,
          time: time,
        });
      });
    });
    return transformedEvents;
  }

  const loadFromStorage = useCallback((farmId: string) => {
    try {
      const cachedRows = localStorage.getItem(`pig_farm_rows_${farmId}`);
      const cachedPens = localStorage.getItem(`pig_farm_pens_${farmId}`);
      const cachedPigs = localStorage.getItem(`pig_farm_pigs_${farmId}`);
      return {
        rows: cachedRows ? JSON.parse(cachedRows) : [],
        pens: cachedPens ? JSON.parse(cachedPens) : [],
        pigs: cachedPigs ? JSON.parse(cachedPigs) : [],
      };
    } catch (error) {
      console.error("Error loading from storage:", error);
      return { rows: [], pens: [], pigs: [] };
    }
  }, []);

  const saveToStorage = useCallback((farmId: string, data: { rows: any[]; pens: any[]; pigs: any[] }) => {
    try {
      localStorage.setItem(`pig_farm_rows_${farmId}`, JSON.stringify(data.rows));
      localStorage.setItem(`pig_farm_pens_${farmId}`, JSON.stringify(data.pens));
      localStorage.setItem(`pig_farm_pigs_${farmId}`, JSON.stringify(data.pigs));
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  }, [])

  const loadData = useCallback(async () => {
    if (!user?.farm_id) {
      setDataLoaded(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const cachedData = loadFromStorage(user.farm_id)
    if (cachedData.rows.length || cachedData.pens.length || cachedData.pigs.length) {
      setRows(cachedData.rows);
      setPens(cachedData.pens);
      setPigs(cachedData.pigs);
      setDataLoaded(true);
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("pig_farm_token")
      if (!token) {
        console.warn("No authentication token found")
        setDataLoaded(true);
        setIsLoading(false);
        return;
      }

      const [rowsResponse, pensResponse, pigsResponse, alertsResponse, calenderResponse] = await Promise.all([
        axios.get(`${utils.apiUrl}/rows/list/${user.farm_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${utils.apiUrl}/pens/${user.farm_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${utils.apiUrl}/pigs/${user.farm_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${utils.apiUrl}/alerts/${user.farm_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${utils.apiUrl}/alerts/calendar/${user.farm_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let newPigs = pigsResponse.data.data || [];
      newPigs = newPigs.map((r: any) => ({
        ...r,
        expected_birth_date:
          r.is_pregnant && r.pregnancy_start_date
            ? new Date(
              new Date(r.pregnancy_start_date).getTime() +
              (utils.PREGNANCY_DURATION_DAYS || 114) * 24 * 60 * 60 * 1000
            ).toISOString()
            : r.expected_birth_date,
      }));

      const newRows = rowsResponse.data.data || [];
      const newPens = pensResponse.data.data || [];
      const calendarAlerts = calenderResponse.data.data || [];
      const serverAlerts: ServerAlert[] = alertsResponse.data.data || [];

      const mappedAlerts: Alert[] = serverAlerts.map((alert) => ({
        type:
          alert.alert_type === "birth"
            ? "Birth Expected"
            : alert.alert_type === "medication"
              ? "Medication Due"
              : alert.name,
        message: alert.message,
        variant: alert.severity === "high" ? "destructive" : alert.severity === "medium" ? "secondary" : "outline",
      }))

      setRows(newRows);
      setPens(newPens);
      setPigs(newPigs);
      setAlerts(mappedAlerts);
      setCalendarEvents(calendarAlerts);
      saveToStorage(user.farm_id, {
        rows: newRows,
        pens: newPens,
        pigs: newPigs,
      });
      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error)
      setDataLoaded(true)
      showError("Error", "Failed to fetch data from server.")
    } finally {
      setIsLoading(false)
    }
  }, [user?.farm_id, loadFromStorage, saveToStorage, showError])

  // Refresh only pigs and pens after transfer
  const refreshPigsAndPens = useCallback(async () => {
    if (!user?.farm_id) return;

    try {
      const token = localStorage.getItem("pig_farm_token");
      if (!token) return;

      const [pensResponse, pigsResponse] = await Promise.all([
        axios.get(`${utils.apiUrl}/pens/${user.farm_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${utils.apiUrl}/pigs/${user.farm_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let newPigs = pigsResponse.data.data || [];
      newPigs = newPigs.map((r: any) => ({
        ...r,
        expected_birth_date:
          r.is_pregnant && r.pregnancy_start_date
            ? new Date(
              new Date(r.pregnancy_start_date).getTime() +
              (utils.PREGNANCY_DURATION_DAYS || 114) * 24 * 60 * 60 * 1000
            ).toISOString()
            : r.expected_birth_date,
      }));

      const newPens = pensResponse.data.data || [];

      // Update state
      setPens(newPens);
      setPigs(newPigs);

      // Update localStorage
      saveToStorage(user.farm_id, { rows, pens: newPens, pigs: newPigs });
    } catch (error) {
      console.error("Error refreshing pigs and pens:", error);
    }
  }, [user?.farm_id, saveToStorage, rows]);

  const handlePigsUpdate = useCallback(
    (updatedPigs: PigType[]) => {
      setPigs(updatedPigs);
      if (user?.farm_id) {
        saveToStorage(user.farm_id, { rows, pens, pigs: updatedPigs });
      }
      setBreedingRefreshTrigger((prev) => prev + 1);
    },
    [user, rows, pens, saveToStorage],
  );

  //Check this later if condition necessary
  useEffect(() => {
    if (user?.farm_id && !isLoading && !dataLoaded) {
      loadData();
    }
  }, [user?.farm_id, isLoading, dataLoaded, loadData])

  useEffect(() => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollLeft = 0;
    }
  }, []);

  useEffect(() => {
    if (tabsListRef.current) {
      const tabIndex = [
        "overview",
        "pens",
        "breeding",
        "health",
        "feeding",
        "earnings",
        "reports",
        "analytics",
        "calender",
      ].indexOf(activeTab);
      const tabWidth = 70;
      tabsListRef.current.scrollTo({
        left: tabIndex * tabWidth,
        behavior: "smooth",
      });
    }
  }, [activeTab]);

  useEffect(() => {
    const handleStorageChange = () => {
      setHasFarm(!!farmId || !!user?.farm_id);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user, farmId]);

  const handleRowAdded = useCallback(() => {
    setDataLoaded(false);
    loadData();
  }, [loadData]);

  const handleFarmCreated = useCallback(() => {
    setHasFarm(true);
    setDataLoaded(false);
    loadData();
  }, [loadData]);

  const handleRowCreated = useCallback(() => {
    setDataLoaded(false);
    loadData();
  }, [loadData]);

  const handlePigletAdded = useCallback(() => {
    setDataLoaded(false);
    loadData();
    setShowAddPigletDialog(false);
    if (selectedPigForPiglet?.pig_id) {
      notifiedPigsRef.current.delete(selectedPigForPiglet.pig_id);
    }
    setBoarIdForPiglet("");
  }, [loadData, selectedPigForPiglet]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const events = transformRawEvents(calendarEvents);
  const totalPigs = pigs.length;
  const sows = pigs.filter((r) => r.gender === "female").length;
  const boars = pigs.filter((r) => r.gender === "male").length;
  const pregnantSows = pigs.filter((r) => r.is_pregnant && utils.isPigMature(r).isMature).length;
  const upcomingBirths = pigs.filter(
    (r) =>
      r.expected_birth_date &&
      utils.isPigMature(r).isMature &&
      new Date(r.expected_birth_date).getTime() <=
      new Date().getTime() + 7 * 24 * 60 * 60 * 1000
  ).length;

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ClientHeaderWrapper />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        user={user}
        rows={rows}
        logout={logout}
        handleRowAdded={handleRowAdded}
        hasFarm={hasFarm}
        handleAddRow={handleAddRow}
        addRowOpen={addRowOpen}
      />
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}
      {showAddPigletDialog && selectedPigForPiglet && (
        <AddPigletDialog
          pig={selectedPigForPiglet}
          sowId={selectedPigForPiglet.pig_id ?? ""}
          boarId={boarIdForPiglet}
          sowName={selectedPigForPiglet.name}
          onClose={() => setShowAddPigletDialog(false)}
          onPigletAdded={handlePigletAdded}
        />
      )}

      <RowTutorialModal open={showMandatoryRowModal} onCreateRow={handleAddRow} />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {user && !user.email_verified && <EmailVerificationBanner />}
        {isTrialActive && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow-sm">
            <p className="font-medium">
              You&apos;re on a full-access trial. {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left to explore every feature.
            </p>
          </div>
        )}
        {!isTrialActive && tier === "free" && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <div>
                <p className="font-semibold">Your trial has ended.</p>
                <p className="text-xs text-rose-800">
                  Upgrade to keep using breeding, analytics, and other premium tools.
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/pricing")}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs sm:text-sm"
            >
              View Plans
            </Button>
          </div>
        )}
        {hasFarm ? (
          <>
            {hasFarm && !hasRow && <RowBanner onRowAdded={handleRowCreated} />}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6 sm:space-y-8"
            >
              <TabsList
                ref={tabsListRef}
                key={activeTab}
                className="inline-flex justify-start w-full md:grid md:grid-cols-9 overflow-x-auto scroll-smooth whitespace-nowrap bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent relative shadow-sm md:shadow-none"
              >
                <TabsTrigger
                  value="overview"
                  className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="pens"
                  className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
                >
                  Pens
                </TabsTrigger>
                <TabsTrigger
                  value="breeding"
                  className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
                >
                  Breeding
                </TabsTrigger>
                <TabsTrigger
                  value="health"
                  className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
                >
                  Health
                </TabsTrigger>
                <TabsTrigger
                  value="feeding"
                  className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
                >
                  Feeding
                </TabsTrigger>
                <TabsTrigger
                  value="earnings"
                  className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
                >
                  Earnings
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
                >
                  Reports
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
                >
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="calender"
                  className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
                >
                  Calender
                </TabsTrigger>
                {/* <TabsTrigger
                value="pricing"
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white whitespace-nowrap"
                onClick={() => router.push("/pricing")}
              >
                Pricing
              </TabsTrigger> */}
              </TabsList>

              <TabsContent value="overview" className="space-y-6 sm:space-y-8">
                {isFeatureAvailable("overview") ? (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                      <Card
                        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => router.push("/pigs")}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Total Pigs</CardTitle>
                          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                            <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {totalPigs}
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                            {sows} sows, {boars} boars
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Pregnant Sows</CardTitle>
                          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg">
                            <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                            {pregnantSows}
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                            {upcomingBirths} due this week
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Health Alerts</CardTitle>
                          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                            <Pill className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            {alerts.filter((a) => a.type === "Medication Due").length}
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Medication due</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Active Rows</CardTitle>
                          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                            <Building className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                            {rows.length}
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                            {pens.length} total pens
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base dark:text-gray-200">
                          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                          <span>Recent Alerts & Reminders</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                          {alerts.map((alert, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border ${alert.variant === "destructive"
                                ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800"
                                : alert.variant === "secondary"
                                  ? "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800"
                                  : "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800"
                                }`}
                            >
                              <div>
                                <p className="font-medium text-sm sm:text-base">
                                  {alert.type === "Medication Due" ||
                                    (alert.type === "Birth Expected" &&
                                      alert.variant === "destructive") ? (
                                    <span className="text-red-800 dark:text-red-300">
                                      {alert.type}
                                    </span>
                                  ) : (
                                    <span className="text-amber-800 dark:text-amber-300">{alert.type}</span>
                                  )}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  {penNamesConversion(pens, alert.message)}
                                </p>
                              </div>
                              <Badge variant={alert.variant} className="text-xs">
                                {alert.variant === "destructive"
                                  ? "Overdue"
                                  : alert.variant === "secondary"
                                    ? "Upcoming"
                                    : "Ready"}
                              </Badge>
                            </div>
                          ))}
                          {alerts.length === 0 && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">No alerts at this time.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <UpgradePrompt feature="Overview" />
                )}
              </TabsContent>
              <TabsContent value="pens">
                {isFeatureAvailable("pens") ? (
                  <>
                    <PenLayout
                      pens={pens}
                      pigs={pigs}
                      rows={rows}
                      onPigSelect={setSelectedPig}
                      onRowAdded={handleRowAdded}
                      handleAddRow={handleAddRow}
                    />
                    {selectedPig && <PigProfile pig={selectedPig} onClose={() => setSelectedPig(null)} onTransferComplete={refreshPigsAndPens} />}
                  </>
                ) : (
                  <UpgradePrompt feature="Pens" />
                )}
              </TabsContent>
              <TabsContent value="breeding">
                {isFeatureAvailable("breeding") ? (
                  <BreedingManager
                    pigs={pigs}
                    onPigsUpdate={handlePigsUpdate}
                    pens={pens ?? []}
                  />
                ) : (
                  <UpgradePrompt feature="Breeding" />
                )}
              </TabsContent>
              <TabsContent value="health">
                {isFeatureAvailable("health") ? (
                  <HealthTracker pigs={pigs} pens={pens ?? []} />
                ) : (
                  <UpgradePrompt feature="Health" />
                )}
              </TabsContent>
              <TabsContent value="feeding">
                {isFeatureAvailable("feeding") ? (
                  <FeedingSchedule pigs={pigs} pens={pens ?? []} />
                ) : (
                  <UpgradePrompt feature="Feeding" />
                )}
              </TabsContent>
              <TabsContent value="earnings">
                {isFeatureAvailable("earnings") ? (
                  <EarningsTracker />
                ) : (
                  <UpgradePrompt feature="Earnings" />
                )}
              </TabsContent>
              <TabsContent value="reports">
                {isFeatureAvailable("reports") ? (
                  <ReportsDashboard pens={pens} />
                ) : (
                  <UpgradePrompt feature="Reports" />
                )}
              </TabsContent>
              <TabsContent value="analytics">
                {isFeatureAvailable("analytics") ? (
                  <AnalyticsCharts />
                ) : (
                  <UpgradePrompt feature="Analytics" />
                )}
              </TabsContent>
              <TabsContent value="calender">
                {isFeatureAvailable("calender") ? (
                  <Calendar events={events} pens={pens} />
                ) : (
                  <UpgradePrompt feature="Calender" />
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            <FarmBanner onFarmCreated={handleFarmCreated} />
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-xl max-w-2xl mx-auto">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-center dark:text-white flex items-center justify-center space-x-2">
                  <PiggyBank className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <span>Welcome to Pig Farming</span>
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 text-center">No farm created yet</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Get started by creating your farm to manage your pigs, pens, and more.
                </p>
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    Create Farm
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <WhatsAppButton
          phoneNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}
          message="Hi! I have a question about your services."
        />
      </main>
      <AddRowDialog
        open={addRowOpen}
        onClose={() => setAddRowOpen(false)}
        onRowAdded={handleRowAdded}
      />

      <FarmCreationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onFarmCreated={handleFarmCreated}
      />
    </div>
  );
};

const PigFarmDashboard: React.FC = () => {
  return (
    <CurrencyProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProtectedRoute>
            <DashboardContent />
          </ProtectedRoute>
        </AuthProvider>
      </ThemeProvider>
    </CurrencyProvider>
  );
};

export default PigFarmDashboard;
