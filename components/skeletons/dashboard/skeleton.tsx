"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Circle, Heart, Pill, Building } from "lucide-react";

const SkeletonDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Skeleton */}
      <header className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Overdue Banner Skeleton */}
        <Skeleton className="h-20 w-full rounded-xl mb-6" />

        {/* Tabs Skeleton */}
        <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
          <TabsList className="inline-flex justify-start w-full overflow-x-auto bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            {[
              "overview",
              "hutches",
              "breeding",
              "health",
              "feeding",
              "earnings",
              "reports",
              "analytics",
            ].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex-1 min-w-[70px]"
              >
                <Skeleton className="h-4 w-16" />
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {[
                { icon: Circle, title: "Total Pigs" },
                { icon: Heart, title: "Pregnant Sows" },
                { icon: Pill, title: "Health Alerts" },
                { icon: Building, title: "Active Rows" },
              ].map((card, index) => (
                <Card
                  key={index}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="p-2 rounded-lg">
                      <card.icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Alerts Card Skeleton */}
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl border"
                    >
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SkeletonDashboard;
