"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Report } from "../../types";
import { getMonthlyRange } from "../../utils/payrollHelpers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmployee: any | null;
  selectedMonth: Date;
  reports: Report[];
}

export function EmployeeReportsDialog({
  open,
  onOpenChange,
  selectedEmployee,
  selectedMonth,
  reports,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="center min-w-[90dvw] max-h-[90vh] p-2 md:p-4">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold md:text-2xl">
            📋 รายละเอียดการส่งรายงาน BBS
          </DialogTitle>
          {selectedEmployee && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">รหัส:</span>{" "}
                {selectedEmployee.employeeId}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">ชื่อ:</span>{" "}
                {selectedEmployee.employeeName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">แผนก:</span>{" "}
                {selectedEmployee.department}
                {selectedEmployee.group && ` (${selectedEmployee.group})`}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">จำนวนส่ง:</span>{" "}
                {selectedEmployee.bbsCount} ครั้ง
              </p>
            </div>
          )}
        </DialogHeader>

        {selectedEmployee && (
          <div className="mt-4 overflow-x-hidden md:h-[100vh] h-[calc(100vh-100px)]">
            <div className="rounded-lg border md:h-[calc(100vh-350px)] h-[calc(100vh-300px)] overflow-auto ">
              <table className="w-[1000px] md:w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left font-semibold">#</th>
                    <th className="p-3 text-left font-semibold">วันที่ส่ง</th>
                    <th className="p-3 text-left font-semibold">รายละเอียด</th>
                    <th className="p-3 text-left font-semibold">
                      แผนกที่สังเกต
                    </th>
                    <th className="p-3 text-center font-semibold">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="overflow-y-auto">
                  {(() => {
                    const currentMonthRange = getMonthlyRange(selectedMonth);
                    const employeeReports = reports
                      .filter(
                        (r) =>
                          r.employeeId === selectedEmployee.employeeId &&
                          new Date(r.submittedDate) >=
                            currentMonthRange.start &&
                          new Date(r.submittedDate) <= currentMonthRange.end
                      )
                      .sort(
                        (a, b) =>
                          new Date(b.submittedDate).getTime() -
                          new Date(a.submittedDate).getTime()
                      );

                    if (employeeReports.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-gray-500"
                          >
                            ไม่พบรายงานในเดือนนี้
                          </td>
                        </tr>
                      );
                    }

                    return employeeReports.map((report, index) => (
                      <tr
                        key={report.id || index}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="p-3 text-gray-600">{index + 1}</td>
                        <td className="p-3">
                          {format(
                            new Date(report.submittedDate),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </td>
                        <td className="p-3 max-w-md">
                          <div className="space-y-1">
                            {report.observedWork && (
                              <p className="text-gray-700">
                                {report.observedWork}
                              </p>
                            )}
                            {report.selectedOptions &&
                              report.selectedOptions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {report.selectedOptions.map(
                                    (opt: string, i: number) => (
                                      <span
                                        key={i}
                                        className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                                      >
                                        {opt}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">
                          {report.observedDepartment || "-"}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            className={
                              report.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : report.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {report.status === "approved"
                              ? "อนุมัติ"
                              : report.status === "pending"
                              ? "รอดำเนินการ"
                              : report.status}
                          </Badge>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
