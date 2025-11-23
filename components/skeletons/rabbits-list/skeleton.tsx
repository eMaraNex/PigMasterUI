"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Baby, TrendingUp } from "lucide-react";
import { PigListSkeletonProps } from "@/types";

const PigListSkeleton: React.FC<PigListSkeletonProps> = () => {
  return (
    <div className="space-y-6">
      {/* Header Section Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
          {/* Stats Cards Skeleton */}
          <div className="flex gap-4">
            {[TrendingUp, Heart, Baby].map((Icon, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 min-w-[120px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Section Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Skeleton className="h-10 w-full max-w-md rounded-xl" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Table Section Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="text-left p-4 w-12">
                  <Checkbox disabled className="rounded-md" />
                </th>
                {[
                  "Name",
                  "Gender",
                  "Breed",
                  "Total Kits",
                  "Litters",
                  "Status",
                  "Actions",
                ].map((header, index) => (
                  <th
                    key={index}
                    className="text-left p-4 font-semibold text-gray-900 dark:text-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-50 dark:border-gray-800"
                >
                  <td className="p-4">
                    <Checkbox disabled className="rounded-md" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-8" />
                      <Baby className="h-4 w-4 text-gray-400" />
                    </div>
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-5 w-8" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-8 rounded-lg" />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20 rounded-xl" />
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-10 w-10 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PigListSkeleton;
