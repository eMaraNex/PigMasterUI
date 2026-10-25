"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import Calendar from "@/components/calender";
import EmailVerificationBanner from "@/components/email-verification-banner";
import ProtectedRoute from "@/components/auth/protected-route";
import ThemeToggle from "@/components/theme-toggle";
import AddPigletDialog from "@/components/add-piglet-dialog";
import RowTutorialModal from "@/components/row-tutorial-modal";
import { useToast } from "@/lib/toast-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { CurrencyProvider } from "@/lib/currency-context";
import * as utils from "@/lib/utils";
import type { Pig as PigType } from "@/types";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/shared/sidebar";
import { Button } from "@/components/ui/button";
import FarmCreationModal from "@/components/farm-creation-modal";
import RowBanner from "@/components/row-banner";
import SkeletonDashboard from "@/components/skeletons/dashboard/skeleton";
import ClientHeaderWrapper from "@/components/ClientHeaderWrapper";
import { useSubscription } from "@/lib/subscription-context";
import UpgradePrompt from "@/components/shared/upgradeprompt";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setSelectedFarmId } from "@/lib/redux/preferences/preferencesSlice";
import { api, useGetHealthSummaryQuery } from "@/lib/redux/api";
import { usePermissions } from "@/lib/permissions";
import OverviewReminders from "@/components/overview-reminders";

const TABS: { value: string; label: string; object?: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "pens", label: "Pens", object: "pens" },
  { value: "breeding", label: "Breeding", object: "breeding_records" },
  { value: "health", label: "Health", object: "health_records" },
  { value: "feeding", label: "Feeding", object: "feeding_records" },
  { value: "earnings", label: "Earnings", object: "earnings" },
  { value: "reports", label: "Reports", object: "reports" },
  { value: "analytics", label: "Analytics", object: "reports" },
  { value: "calender", label: "Calendar", object: "alerts" },
];

const DashboardContent: React.FC = () => {
  const { user, logout } = useAuth();
  const { showError } = useToast();
  const { isFeatureAvailable, isTrialActive, trialDaysLeft, tier, ready: subscriptionReady, isFarmOwner } = useSubscription();
  const { can } = usePermissions();
  const [selectedPig, setSelectedPig] = useState<PigType | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { data: healthSummary } = useGetHealthSummaryQuery(undefined, { skip: !user?.farm_id });
  const [pigs, setPigs] = useState<PigType[]>([]);
  const [pens, setPens] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [farmName, setFarmName] = useState<string>("");
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showMandatoryRowModal, setShowMandatoryRowModal] = useState(false);
  const [addRowOpen, setAddRowOpen] = useState<boolean>(false);

  const hasFarm = Boolean(user?.farm_id);
  const hasRow = rows?.length > 0;
  // Tabs the user's farm role can open (the API enforces the same permissions).
  const visibleTabs = useMemo(() => TABS.filter(tab => !tab.object || can(tab.object, "read")), [can]);
  const [breedingRefreshTrigger, setBreedingRefreshTrigger] =
    useState<number>(0);
  const [showAddPigletDialog, setShowAddPigletDialog] = useState<boolean>(false);
  const [selectedPigForPiglet, setSelectedPigForPiglet] = useState<PigType | null>(null);
  const [boarIdForPiglet, setBoarIdForPiglet] = useState<string>("");
  const tabsListRef = useRef<HTMLDivElement>(null);
  const notifiedPigsRef = useRef<Set<string>>(new Set());
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleAddRow = () => {
    setAddRowOpen(true);
    setShowMandatoryRowModal(false);
  }

  useEffect(() => {
    dispatch(setSelectedFarmId(user?.farm_id || null));
  }, [dispatch, user?.farm_id]);

  useEffect(() => {
    if (hasFarm && dataLoaded && rows.length === 0) {
      setShowMandatoryRowModal(true);
    } else {
      setShowMandatoryRowModal(false);
    }
  }, [hasFarm, dataLoaded, rows.length])

  const loadData = useCallback(async () => {
    if (!user?.farm_id) {
      setDataLoaded(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const farmKey = user.farm_id;
      const [newRows, newPens, pigsResponse] = await Promise.all([
        dispatch(api.endpoints.getRows.initiate(farmKey, { forceRefetch: true, subscribe: false })).unwrap(),
        dispatch(api.endpoints.getPens.initiate(farmKey, { forceRefetch: true, subscribe: false })).unwrap(),
        dispatch(api.endpoints.getPigs.initiate(farmKey, { forceRefetch: true, subscribe: false })).unwrap(),
      ]);
      let newPigs = pigsResponse || [];
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

      setRows(newRows);
      setPens(newPens);
      setPigs(newPigs);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error)
      setDataLoaded(true)
      showError("Error", "Failed to fetch data from server.")
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, user?.farm_id, showError])

  // Refresh only pigs and pens after transfer
  const refreshPigsAndPens = useCallback(async () => {
    if (!user?.farm_id) return;

    try {
      const [newPens, pigsResponse] = await Promise.all([
        dispatch(api.endpoints.getPens.initiate(user.farm_id, { forceRefetch: true, subscribe: false })).unwrap(),
        dispatch(api.endpoints.getPigs.initiate(user.farm_id, { forceRefetch: true, subscribe: false })).unwrap(),
      ]);

      let newPigs = pigsResponse || [];
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

      // Update state
      setPens(newPens);
      setPigs(newPigs);

    } catch (error) {
      console.error("Error refreshing pigs and pens:", error);
    }
  }, [dispatch, user?.farm_id]);

  const handlePigsUpdate = useCallback(
    (updatedPigs: PigType[]) => {
      setPigs(updatedPigs);
      setBreedingRefreshTrigger((prev) => prev + 1);
    },
    [],
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
      const tabIndex = visibleTabs.findIndex(tab => tab.value === activeTab);
      const tabWidth = 76;
      tabsListRef.current.scrollTo({
        left: tabIndex * tabWidth,
        behavior: "smooth",
      });
    }
  }, [activeTab, visibleTabs]);

  const handleRowAdded = useCallback(() => {
    setDataLoaded(false);
    loadData();
  }, [loadData]);

  const handleFarmCreated = useCallback(() => {
    dispatch(api.util.invalidateTags(["CurrentUser", "Farm"]));
    setDataLoaded(false);
    loadData();
  }, [dispatch, loadData]);

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
        {subscriptionReady && isTrialActive && (
          <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            <p className="font-medium">
              Full-access trial: {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left to explore every feature.
            </p>
            {isFarmOwner && (
              <Button size="sm" variant="outline" onClick={() => router.push("/pricing")} className="rounded-xl border-amber-300 bg-white/70 text-amber-900 hover:bg-white">
                Choose a plan
              </Button>
            )}
          </div>
        )}
        {subscriptionReady && !isTrialActive && tier === "free" && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-900 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <div>
                <p className="font-semibold">Your trial has ended.</p>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  {isFarmOwner
                    ? "Upgrade to keep using breeding, analytics, and other premium tools."
                    : "Ask the farm owner to upgrade to keep using premium tools."}
                </p>
              </div>
            </div>
            {isFarmOwner && (
              <Button
                onClick={() => router.push("/pricing")}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs sm:text-sm"
              >
                View Plans
              </Button>
            )}
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
                className="inline-flex w-full justify-start overflow-x-auto scroll-smooth whitespace-nowrap bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent relative shadow-sm md:shadow-none"
              >
                {visibleTabs.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex-1 min-w-[76px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
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
                      <Card
                        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveTab("breeding")}
                        onKeyDown={event => event.key === "Enter" && setActiveTab("breeding")}
                      >
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
                      <Card
                        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveTab("health")}
                        onKeyDown={event => event.key === "Enter" && setActiveTab("health")}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Health Alerts</CardTitle>
                          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                            <Pill className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            {(healthSummary?.overdue ?? 0) + (healthSummary?.due_this_week ?? 0)}
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                            {healthSummary?.overdue ?? 0} overdue, {healthSummary?.due_this_week ?? 0} due this week
                          </p>
                        </CardContent>
                      </Card>
                      <Card
                        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveTab("pens")}
                        onKeyDown={event => event.key === "Enter" && setActiveTab("pens")}
                      >
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
                    <OverviewReminders onOpenTab={setActiveTab} />
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
                  <Calendar />
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
