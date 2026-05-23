"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { formatDateRange, monthNames } from "../../utils/payrollHelpers";

interface Props {
  selectedMonth: Date;
  monthRange: { start: Date; end: Date };
  onChangeMonth: (direction: "prev" | "next") => void;
  onRefreshShe: () => void;
  isLoadingShe: boolean;
  onExport: () => void;
  isExporting: boolean;
}

export function PayrollHeader({
  selectedMonth,
  monthRange,
  onChangeMonth,
  onRefreshShe,
  isLoadingShe,
  onExport,
  isExporting,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChangeMonth("prev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </h3>
          <p className="text-sm text-gray-600">
            ({formatDateRange(monthRange)})
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChangeMonth("next")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          onClick={onRefreshShe}
          disabled={isLoadingShe}
          variant="outline"
          size="sm"
        >
          {isLoadingShe ? "กำลังโหลด SHE..." : "รีเฟรช SHE"}
        </Button>
        <Button
          onClick={onExport}
          disabled={isExporting}
          variant="default"
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "กำลัง Export..." : "Export"}
        </Button>
      </div>
    </div>
  );
}
