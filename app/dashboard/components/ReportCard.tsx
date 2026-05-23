"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Ban,
  BrainCircuit,
  Check,
  ChevronRight,
} from "lucide-react";
import { type Report, getStatusInfo } from "../types";

interface Props {
  report: Report;
  isOpen?: boolean; // Kept for backwards compatibility with DashboardClient
  isSheOrManager: boolean;
  onToggle?: () => void; // Kept for backwards compatibility
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
  onAiView: () => void;
}

export function ReportCard({
  report,
  isSheOrManager,
  onApprove,
  onReject,
  onView,
  onAiView,
}: Props) {
  const statusInfo = getStatusInfo(report.status);
  const StatusIcon = statusInfo.icon;

  return (
    <Card
      onClick={onView}
      className="mb-2 overflow-hidden hover:bg-slate-50 cursor-pointer active:scale-[0.99] transition-transform border border-slate-200 shadow-sm relative group"
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          report.status === "pending"
            ? "bg-yellow-400"
            : report.status === "approved"
            ? "bg-green-500"
            : "bg-red-500"
        )}
      />

      <div className="p-4 flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 h-10 w-10 mt-1 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100">
          {report.employeeName.substring(0, 2)}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="text-sm font-semibold text-slate-900 truncate pr-2">
              {report.employeeName}
            </h3>
            <span className="text-[10px] text-slate-400 flex-shrink-0">
              {format(report.submittedDate, "dd/MM/yy HH:mm")}
            </span>
          </div>

          <p className="text-xs text-slate-500 truncate mb-2">
            {report.department} • #{report.id}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn("text-[10px] px-1.5 py-0 font-medium", statusInfo.color)}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>

            {report.priority === "high" && (
              <Badge
                variant="outline"
                className="text-red-600 border-red-200 bg-red-50 text-[10px] py-0 px-1.5 font-medium"
              >
                สำคัญ
              </Badge>
            )}

            <div className="flex items-center gap-2 text-xs bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              <span className="flex items-center text-green-600 font-medium">
                <Check className="w-3 h-3 mr-0.5" />
                {report.safeCount}
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center text-red-600 font-medium">
                <Ban className="w-3 h-3 mr-0.5" />
                {report.unsafeCount}
              </span>
            </div>
          </div>
        </div>

        {/* Chevron Right (Only show if not pending, since pending has buttons) */}
        {report.status !== "pending" && (
          <div className="flex-shrink-0 flex items-center text-slate-300 group-hover:text-indigo-400 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Action Bar for Pending Items or AI Insights */}
      {(report.status === "pending" || (isSheOrManager && report.aiInsight)) && (
        <div 
          className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {isSheOrManager && report.aiInsight && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={onAiView}
            >
              <BrainCircuit className="w-3 h-3 mr-1.5" />
              วิเคราะห์ AI
            </Button>
          )}
          {report.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                onClick={onReject}
              >
                ไม่อนุมัติ
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={onApprove}
              >
                <Check className="w-3 h-3 mr-1.5" />
                อนุมัติ
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
