"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { downloadExport, exportErrorMessage, type ExportFormat } from "@/lib/download";
import { useToast } from "@/lib/toast-provider";

type Props = {
  /** API path that returns the file, e.g. "/feeding-records/export". */
  path: string;
  /** Filters, sort and columns sent with the request; `format` is added. */
  params?: Record<string, unknown>;
  method?: "get" | "post";
  filename: string;
  disabled?: boolean;
  className?: string;
};

/** "Export" button offering Excel and CSV; the API builds the file so big farms export in full. */
export function ExportMenu({ path, params = {}, method = "post", filename, disabled, className }: Props) {
  const [busy, setBusy] = useState(false);
  const { showError, showWarn } = useToast();

  const run = async (format: ExportFormat) => {
    setBusy(true);
    try {
      const { truncated } = await downloadExport(path, { ...params, format }, `${filename}.${format}`, method);
      if (truncated) showWarn("Export limited", "Only the first 10,000 rows were exported. Narrow the date range for the rest.");
    } catch (error) {
      showError("Export failed", await exportErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || busy} className={className}>
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => run("xlsx")}>Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("csv")}>CSV (.csv)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
