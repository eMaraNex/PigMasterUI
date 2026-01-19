"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/toast-provider";
import axios from "axios";
import * as utils from "@/lib/utils";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface Pen {
  id: string;
  name: string;
  is_occupied?: boolean;
  row_id?: string;
  row_name?: string;
}

interface Row {
  id: string;
  name: string;
}

interface TransferPigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pigId: string;
  pigName: string;
  farmId: string;
  currentPenId?: string;
  currentPenName?: string;
  pens: Pen[];
  onTransferSuccess: () => void;
}

const TRANSFER_REASONS = [
  { value: "quarantine", label: "Quarantine (Health Concerns)" },
  { value: "cannibalism_prevention", label: "Cannibalism Prevention" },
  { value: "breeding_program", label: "Breeding Program" },
  { value: "overcrowding", label: "Pen Overcrowding" },
  { value: "facility_maintenance", label: "Facility Maintenance" },
  { value: "social_grouping", label: "Social Grouping" },
  { value: "other", label: "Other" },
];

export default function TransferPigDialog({
  isOpen,
  onClose,
  pigId,
  pigName,
  farmId,
  currentPenId,
  currentPenName,
  pens,
  onTransferSuccess,
}: TransferPigDialogProps) {
  const { showSuccess, showError } = useToast();
  const [selectedRowId, setSelectedRowId] = useState("");
  const [selectedPenId, setSelectedPenId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Extract unique rows from pens - more robust approach
  const rows: Row[] = Array.from(
    new Map(
      pens
        .filter((pen) => pen.row_name) // Filter by row_name only (it should always be present)
        .map((pen) => {
          // Use row_id if available, otherwise use row_name as ID
          const rowId = pen.row_id || pen.row_name || "";
          const rowName = pen.row_name || "";
          return [rowId, { id: rowId, name: rowName }];
        })
    ).values()
  ).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  // Filter pens by selected row
  const pensByRow = selectedRowId
    ? pens.filter((pen) => {
        const penRowId = pen.row_id || pen.row_name;
        return penRowId === selectedRowId && (!currentPenId || pen.id !== currentPenId);
      })
    : [];

  // Reset pen selection when row changes
  const handleRowChange = (rowId: string) => {
    setSelectedRowId(rowId);
    setSelectedPenId(""); // Reset pen selection
  };

  const handleTransfer = async () => {
    // Validation
    if (!selectedPenId) {
      setError("Please select a destination pen");
      return;
    }

    if (!transferReason) {
      setError("Please select a transfer reason");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("pig_farm_token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.post(
        `${utils.apiUrl}/pigs/${farmId}/${pigId}/transfer`,
        {
          new_pen_id: selectedPenId,
          transfer_reason: transferReason,
          transfer_notes: transferNotes || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        showSuccess(
          "Transfer Successful",
          `${pigName} has been transferred successfully`
        );

        // Reset form
        setTimeout(() => {
          setSelectedRowId("");
          setSelectedPenId("");
          setTransferReason("");
          setTransferNotes("");
          setSuccess(false);
          onTransferSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to transfer pig";
      setError(errorMessage);
      showError("Transfer Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !success) {
      setSelectedRowId("");
      setSelectedPenId("");
      setTransferReason("");
      setTransferNotes("");
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const selectedPen = pens.find((pen) => pen.id === selectedPenId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Transfer Pig</span>
          </DialogTitle>
          <DialogDescription>
            Transfer {pigName} to a new pen
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-center text-sm font-medium text-gray-900 dark:text-gray-100">
              Transfer completed successfully!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Pen Info */}
            {currentPenName && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Current Pen
                </p>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {currentPenName}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Select Row */}
            <div className="space-y-2">
              <Label htmlFor="row-select" className="text-sm font-medium">
                Select Row *
              </Label>
              <Select
                value={selectedRowId}
                onValueChange={handleRowChange}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="row-select"
                  className="w-full bg-white dark:bg-gray-800"
                >
                  <SelectValue placeholder="Choose a row" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  {rows.length === 0 ? (
                    <div className="p-2 text-xs text-gray-500">
                      No rows available
                    </div>
                  ) : (
                    rows.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Select Pen */}
            <div className="space-y-2">
              <Label htmlFor="pen-select" className="text-sm font-medium">
                Select Pen *
              </Label>
              <Select
                value={selectedPenId}
                onValueChange={setSelectedPenId}
                disabled={isLoading || !selectedRowId}
              >
                <SelectTrigger
                  id="pen-select"
                  className="w-full bg-white dark:bg-gray-800"
                >
                  <SelectValue placeholder={selectedRowId ? "Choose a pen" : "Select a row first"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  {pensByRow.length === 0 ? (
                    <div className="p-2 text-xs text-gray-500">
                      {selectedRowId ? "No available pens in this row" : "Select a row first"}
                    </div>
                  ) : (
                    pensByRow.map((pen) => (
                      <SelectItem key={pen.id} value={pen.id}>
                        {pen.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Transfer Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason-select" className="text-sm font-medium">
                Transfer Reason *
              </Label>
              <Select
                value={transferReason}
                onValueChange={setTransferReason}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="reason-select"
                  className="w-full bg-white dark:bg-gray-800"
                >
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  {TRANSFER_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transfer Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this transfer..."
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                disabled={isLoading}
                className="min-h-20 resize-none bg-white dark:bg-gray-800"
              />
            </div>

            {/* Transfer Summary */}
            {selectedPen && (
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg space-y-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Transfer Summary
                </p>
                <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                  <p>
                    <span className="font-medium">Pig:</span> {pigName}
                  </p>
                  <p>
                    <span className="font-medium">From:</span>{" "}
                    {currentPenName || "Unknown"}
                  </p>
                  <p>
                    <span className="font-medium">To Row:</span>{" "}
                    {rows.find((r) => r.id === selectedRowId)?.name || "Unknown"}
                  </p>
                  <p>
                    <span className="font-medium">To Pen:</span> {selectedPen.name}
                  </p>
                  <p>
                    <span className="font-medium">Reason:</span>{" "}
                    {TRANSFER_REASONS.find((r) => r.value === transferReason)
                      ?.label || transferReason}
                  </p>
                </div>
                {selectedPen.row_name && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2 mt-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      ℹ️ Cross-row transfer: This pig will be moved to {selectedPen.row_name} row
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading || success}
            className="flex-1"
          >
            {success ? "Done" : "Cancel"}
          </Button>
          {!success && (
            <Button
              onClick={handleTransfer}
              disabled={
                isLoading || !selectedPenId || !transferReason
              }
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Confirm Transfer"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
