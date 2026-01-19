"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import * as utils from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Loader2, ArrowRight } from "lucide-react";

interface TransferRecord {
  id: string;
  pig_id: string;
  old_pen_name?: string;
  new_pen_name: string;
  transfer_reason: string;
  transfer_notes?: string;
  transferred_by_user?: string;
  transferred_at: string;
}

interface TransferHistoryProps {
  pigId: string;
  farmId: string;
}

const REASON_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  quarantine: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    badge: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  },
  cannibalism_prevention: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-300",
    badge: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
  },
  breeding_program: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-300",
    badge: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  },
  overcrowding: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-300",
    badge: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  },
  facility_maintenance: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  },
  social_grouping: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    badge: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  },
  other: {
    bg: "bg-gray-50 dark:bg-gray-800/50",
    text: "text-gray-700 dark:text-gray-300",
    badge: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
  },
};

const REASON_LABELS: Record<string, string> = {
  quarantine: "Quarantine",
  cannibalism_prevention: "Cannibalism Prevention",
  breeding_program: "Breeding Program",
  overcrowding: "Overcrowding",
  facility_maintenance: "Facility Maintenance",
  social_grouping: "Social Grouping",
  other: "Other",
};

export default function PigTransferHistory({
  pigId,
  farmId,
}: TransferHistoryProps) {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransferHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("pig_farm_token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.get(
          `${utils.apiUrl}/pigs/${farmId}/${pigId}/transfer-history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setTransfers(response.data.data || []);
        } else {
          setError("Failed to load transfer history");
        }
      } catch (err: any) {
        console.error("Error loading transfer history:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load transfer history"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (pigId && farmId) {
      loadTransferHistory();
    }
  }, [pigId, farmId]);

  if (isLoading) {
    return (
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (transfers.length === 0) {
    return (
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">
            No transfers recorded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          Transfer History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transfers.map((transfer) => {
            const colors =
              REASON_COLORS[transfer.transfer_reason] ||
              REASON_COLORS["other"];
            const reasonLabel =
              REASON_LABELS[transfer.transfer_reason] ||
              transfer.transfer_reason;

            return (
              <div
                key={transfer.id}
                className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${colors.bg}`}
              >
                {/* Transfer Info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {transfer.old_pen_name || "Unknown"}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {transfer.new_pen_name}
                    </span>
                  </div>
                  <Badge
                    className={`text-xs whitespace-nowrap flex-shrink-0 ${colors.badge}`}
                  >
                    {reasonLabel}
                  </Badge>
                </div>

                {/* Transfer Date and User */}
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {formatDate(transfer.transferred_at)}
                  {transfer.transferred_by_user && (
                    <span> • By {transfer.transferred_by_user}</span>
                  )}
                </div>

                {/* Notes */}
                {transfer.transfer_notes && (
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-600">
                    {transfer.transfer_notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
