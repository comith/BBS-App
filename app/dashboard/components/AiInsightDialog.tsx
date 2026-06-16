import { useState, useEffect } from "react";
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
  const [insight, setInsight] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (report && report.aiInsight) {
      // If report.aiInsight only has updatedAt, or we just want to fetch the full object
      setIsLoading(true);
      setError(null);
      fetch(`/api/ai-insight/${report.recordId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load insight");
          return res.json();
        })
        .then((data) => {
          setInsight(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("ไม่สามารถโหลดข้อมูลวิเคราะห์ได้");
          setIsLoading(false);
        });
    } else {
      setInsight(null);
      setError(null);
    }
  }, [report]);

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
            {(insight?.updatedAt || report?.aiInsight?.updatedAt) && (
              <span className="flex items-center gap-1 text-indigo-600">
                <Clock className="w-3 h-3" />
                <span>
                  วิเคราะห์เมื่อ:{" "}
                  {format(
                    new Date(insight?.updatedAt || report!.aiInsight.updatedAt),
                    "dd MMMM yyyy HH:mm",
                    { locale: th }
                  )}
                </span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-sm text-gray-500">กำลังโหลดข้อมูลวิเคราะห์...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        ) : insight ? (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-slate-50 rounded-lg border">
              <h4 className="text-sm font-semibold text-gray-500 mb-1">
                ข้อความที่พนักงานรายงาน:
              </h4>
              <p className="text-gray-800 text-sm">{report?.observedWork}</p>
            </div>

            {insight.category === "FAILED" ? (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg space-y-2">
                <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> เกิดข้อผิดพลาดในการวิเคราะห์ด้วย AI
                </h4>
                <p className="text-red-950 text-sm font-mono bg-red-100/50 p-3 rounded border border-red-200/50 whitespace-pre-wrap">
                  {insight.rootCause}
                </p>
                <p className="text-xs text-red-700">
                  คุณสามารถสั่งวิเคราะห์ใหม่ได้ในหน้า AI Safety Analytics
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">
                      หมวดหมู่
                    </h4>
                    <p className="font-medium text-indigo-700">
                      {insight.category}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">
                      ระดับความรุนแรง (Severity)
                    </h4>
                    <p
                      className={`font-bold text-lg ${
                        insight.severityScore >= 8
                          ? "text-red-600"
                          : insight.severityScore >= 5
                          ? "text-orange-500"
                          : "text-green-600"
                      }`}
                    >
                      {insight.severityScore} / 10
                    </p>
                  </div>
                </div>
                <div className="p-4 border border-rose-100 bg-rose-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-rose-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Root Cause Analysis
                  </h4>
                  <p className="text-rose-900 text-sm">
                    {insight.rootCause}
                  </p>
                </div>
                <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2">
                    คำแนะนำ / Recommendations
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-blue-900 space-y-1">
                    {Array.isArray(insight.recommendations) ? (
                      insight.recommendations.map(
                        (rec: string, i: number) => <li key={i}>{rec}</li>
                      )
                    ) : (
                      <li>{String(insight.recommendations || "-")}</li>
                    )}
                  </ul>
                </div>
                <div className="p-4 border border-amber-100 bg-amber-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Predictive Warning
                  </h4>
                  <p className="text-amber-900 text-sm">
                    {insight.predictiveWarning}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : null}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            ปิด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
