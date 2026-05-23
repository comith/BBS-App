"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  violations: any[];
}

export function SheViolationsDialog({
  open,
  onOpenChange,
  title,
  violations,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">⚠️ {title}</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            จำนวนรายงานทั้งหมด: {violations.length} รายการ
          </p>
        </DialogHeader>

        <div className="mt-4">
          {violations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ไม่พบรายงาน SHE</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-semibold">#</th>
                    <th className="p-3 text-left font-semibold">วันที่</th>
                    <th className="p-3 text-left font-semibold">ระดับ</th>
                    <th className="p-3 text-left font-semibold">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((violation, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-gray-600">{index + 1}</td>
                      <td className="p-3">
                        {violation.date
                          ? format(new Date(violation.date), "dd/MM/yyyy")
                          : "-"}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            violation.level_accident === "อุบัติเหตุ"
                              ? "bg-red-100 text-red-800"
                              : violation.level_accident === "เสี่ยงสูง"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {violation.level_accident || "ไม่ระบุ"}
                        </Badge>
                      </td>
                      <td className="p-3 max-w-md">
                        <div className="space-y-1">
                          {violation.observed_Work && (
                            <p className="text-gray-700">
                              {violation.observed_Work}
                            </p>
                          )}
                          {violation.detail &&
                            violation.detail !== violation.observed_Work && (
                              <p className="text-gray-600 text-xs">
                                {violation.detail}
                              </p>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
