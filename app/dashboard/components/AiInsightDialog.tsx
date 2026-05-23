"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, BrainCircuit, Clock } from "lucide-react";
import { type Report } from "../types";

interface Props {
  report: Report | null;
  onClose: () => void;
}

export function AiInsightDialog({ report, onClose }: Props) {
  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-indigo-600" />
            ผลการวิเคราะห์จาก AI
          </DialogTitle>
          <DialogDescription>
            <span className="block mb-1">
              รายงานวันที่{" "}
              {report?.date
                ? format(report.date, "dd MMMM yyyy", { locale: th })
                : "-"}{" "}
              โดย {report?.employeeName} ({report?.group})
            </span>
            {report?.aiInsight?.updatedAt && (
              <span className="flex items-center gap-1 text-indigo-600">
                <Clock className="w-3 h-3" />
                <span>
                  วิเคราะห์เมื่อ:{" "}
                  {format(
                    new Date(report.aiInsight.updatedAt),
                    "dd MMMM yyyy HH:mm",
                    { locale: th }
                  )}
                </span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {report?.aiInsight && (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-slate-50 rounded-lg border">
              <h4 className="text-sm font-semibold text-gray-500 mb-1">
                ข้อความที่พนักงานรายงาน:
              </h4>
              <p className="text-gray-800 text-sm">{report.observedWork}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">
                  หมวดหมู่
                </h4>
                <p className="font-medium text-indigo-700">
                  {report.aiInsight.category}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">
                  ระดับความรุนแรง (Severity)
                </h4>
                <p
                  className={`font-bold text-lg ${
                    report.aiInsight.severityScore >= 8
                      ? "text-red-600"
                      : report.aiInsight.severityScore >= 5
                      ? "text-orange-500"
                      : "text-green-600"
                  }`}
                >
                  {report.aiInsight.severityScore} / 10
                </p>
              </div>
            </div>
            <div className="p-4 border border-rose-100 bg-rose-50 rounded-lg">
              <h4 className="text-sm font-semibold text-rose-700 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Root Cause Analysis
              </h4>
              <p className="text-rose-900 text-sm">
                {report.aiInsight.rootCause}
              </p>
            </div>
            <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-700 mb-2">
                คำแนะนำ / Recommendations
              </h4>
              <ul className="list-disc pl-5 text-sm text-blue-900 space-y-1">
                {Array.isArray(report.aiInsight.recommendations) ? (
                  report.aiInsight.recommendations.map(
                    (rec: string, i: number) => <li key={i}>{rec}</li>
                  )
                ) : (
                  <li>{String(report.aiInsight.recommendations || "-")}</li>
                )}
              </ul>
            </div>
            <div className="p-4 border border-amber-100 bg-amber-50 rounded-lg">
              <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Predictive Warning
              </h4>
              <p className="text-amber-900 text-sm">
                {report.aiInsight.predictiveWarning}
              </p>
            </div>
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            ปิด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
