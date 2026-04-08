"use client";
import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { startOfDay, endOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Report } from "./types";

const monthNames = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function getWeeksInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weeks = [];
  const current = new Date(firstDay);

  while (current.getDay() !== 1) {
    current.setDate(current.getDate() - 1);
  }

  let weekNumber = 1;
  while (current <= lastDay) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    weeks.push({
      number: weekNumber,
      start: weekStart,
      end: weekEnd > lastDay ? lastDay : weekEnd,
      label: `สัปดาห์ที่ ${weekNumber}`,
    });

    current.setDate(current.getDate() + 7);
    weekNumber++;
  }

  return weeks;
}

export const IndividualReportSummary = React.memo(({ reports }: { reports: Report[] }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewType, setViewType] = useState<"monthly" | "weekly">("monthly");

  const ithOeReports = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    return reports.filter((r) => {
      const d = r.submittedDate;
      return r.department === "ITH-OE" && d.getFullYear() === year && d.getMonth() === month;
    });
  }, [reports, selectedMonth]);

  const individualSummary = useMemo(() => {
    const individuals = [...new Set(ithOeReports.map((r) => r.employeeId))];
    return individuals
      .map((employeeId) => {
        const employeeReports = ithOeReports.filter((r) => r.employeeId === employeeId);
        return {
          employeeId,
          employeeName: employeeReports[0]?.employeeName || employeeId,
          total: employeeReports.length,
          approved: employeeReports.filter((r) => r.status === "approved").length,
          pending: employeeReports.filter((r) => r.status === "pending").length,
          rejected: employeeReports.filter((r) => r.status === "rejected").length,
          totalSafe: employeeReports.reduce((sum, r) => sum + r.safeCount, 0),
          totalUnsafe: employeeReports.reduce((sum, r) => sum + r.unsafeCount, 0),
          approvalRate:
            employeeReports.length > 0
              ? Math.round(
                  (employeeReports.filter((r) => r.status === "approved").length /
                    employeeReports.length) *
                    100
                )
              : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [ithOeReports]);

  const weeklySummary = useMemo(() => {
    const weeks = getWeeksInMonth(selectedMonth);
    const individuals = [...new Set(ithOeReports.map((r) => r.employeeId))];

    return weeks.map((week) => {
      const weekReports = ithOeReports.filter((r) => {
        const d = startOfDay(r.submittedDate);
        return d >= startOfDay(week.start) && d <= endOfDay(week.end);
      });

      const individualStats = individuals
        .map((employeeId) => {
          const employeeReports = weekReports.filter((r) => r.employeeId === employeeId);
          return {
            employeeId,
            employeeName:
              ithOeReports.find((r) => r.employeeId === employeeId)?.employeeName || employeeId,
            total: employeeReports.length,
            approved: employeeReports.filter((r) => r.status === "approved").length,
            pending: employeeReports.filter((r) => r.status === "pending").length,
            rejected: employeeReports.filter((r) => r.status === "rejected").length,
            totalSafe: employeeReports.reduce((sum, r) => sum + r.safeCount, 0),
            totalUnsafe: employeeReports.reduce((sum, r) => sum + r.unsafeCount, 0),
          };
        })
        .filter((s) => s.total > 0);

      return { ...week, totalReports: weekReports.length, individualStats };
    });
  }, [ithOeReports, selectedMonth]);

  const changeMonth = (direction: "prev" | "next") => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
      return d;
    });
  };

  const exportIndividualReport = () => {
    const monthName = monthNames[selectedMonth.getMonth()];
    const year = selectedMonth.getFullYear();

    let csvContent: string;
    let filename: string;

    if (viewType === "monthly") {
      const headers = [
        "รหัสพนักงาน", "ชื่อพนักงาน", "รายงานทั้งหมด",
        "อนุมัติแล้ว", "รอการอนุมัติ", "ไม่อนุมัติ",
        "เปอร์เซ็นต์การอนุมัติ", "Safe Actions", "Unsafe Actions",
      ];
      const csvData = individualSummary.map((ind) => [
        ind.employeeId, ind.employeeName, ind.total,
        ind.approved, ind.pending, ind.rejected,
        `${ind.approvalRate}%`, ind.totalSafe, ind.totalUnsafe,
      ]);
      csvContent = [headers, ...csvData]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      filename = `ITH-OE_Individual_Monthly_Report_${monthName}_${year}.csv`;
    } else {
      const headers = [
        "สัปดาห์", "ช่วงวันที่", "รหัสพนักงาน", "ชื่อพนักงาน",
        "รายงานทั้งหมด", "อนุมัติแล้ว", "รอการอนุมัติ", "ไม่อนุมัติ",
        "Safe Actions", "Unsafe Actions",
      ];
      const csvData: (string | number)[][] = [];
      weeklySummary.forEach((week) => {
        week.individualStats.forEach((ind) => {
          csvData.push([
            week.label,
            `${format(week.start, "dd/MM/yyyy")} - ${format(week.end, "dd/MM/yyyy")}`,
            ind.employeeId, ind.employeeName, ind.total,
            ind.approved, ind.pending, ind.rejected,
            ind.totalSafe, ind.totalUnsafe,
          ]);
        });
      });
      csvContent = [headers, ...csvData]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      filename = `ITH-OE_Individual_Weekly_Report_${monthName}_${year}.csv`;
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => changeMonth("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            รายงานรายบุคคล ITH-OE — {monthNames[selectedMonth.getMonth()]}{" "}
            {selectedMonth.getFullYear()}
          </h3>
          <Button variant="outline" size="sm" onClick={() => changeMonth("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewType === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("monthly")}
              className="text-xs"
            >
              รายเดือน
            </Button>
            <Button
              variant={viewType === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("weekly")}
              className="text-xs"
            >
              รายสัปดาห์
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            รายงานทั้งหมด: {ithOeReports.length} รายการ จาก {individualSummary.length} คน
          </div>
        </div>
      </div>

      {/* Monthly View */}
      {viewType === "monthly" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-3 font-medium">รหัสพนักงาน</th>
                <th className="text-left p-3 font-medium">ชื่อพนักงาน</th>
                <th className="text-center p-3 font-medium">รายงานทั้งหมด</th>
                <th className="text-center p-3 font-medium">อนุมัติแล้ว</th>
                <th className="text-center p-3 font-medium">รอการอนุมัติ</th>
                <th className="text-center p-3 font-medium">ไม่อนุมัติ</th>
                <th className="text-center p-3 font-medium">% อนุมัติ</th>
                <th className="text-center p-3 font-medium">Safe</th>
                <th className="text-center p-3 font-medium">Unsafe</th>
              </tr>
            </thead>
            <tbody>
              {individualSummary.length > 0 ? (
                individualSummary.map((ind) => (
                  <tr key={ind.employeeId} className="border-b">
                    <td className="p-3 font-medium">{ind.employeeId}</td>
                    <td className="p-3">{ind.employeeName}</td>
                    <td className="p-3 text-center font-medium">{ind.total}</td>
                    <td className="p-3 text-center text-green-600 font-medium">{ind.approved}</td>
                    <td className="p-3 text-center text-yellow-600 font-medium">{ind.pending}</td>
                    <td className="p-3 text-center text-red-600 font-medium">{ind.rejected}</td>
                    <td className="p-3 text-center">
                      <Badge
                        className={
                          ind.approvalRate >= 80
                            ? "bg-green-100 text-green-800"
                            : ind.approvalRate >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {ind.approvalRate}%
                      </Badge>
                    </td>
                    <td className="p-3 text-center text-green-600 font-medium">{ind.totalSafe}</td>
                    <td className="p-3 text-center text-red-600 font-medium">{ind.totalUnsafe}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">
                    ไม่มีข้อมูลรายงานสำหรับแผนก ITH-OE ในเดือนนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Weekly View */}
      {viewType === "weekly" && (
        <div className="space-y-4">
          {weeklySummary.map((week, weekIndex) => (
            <div key={weekIndex} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg">
                  {week.label} ({format(week.start, "dd/MM")} — {format(week.end, "dd/MM")})
                </h4>
                <Badge variant="outline">รายงานทั้งหมด: {week.totalReports} รายการ</Badge>
              </div>

              {week.individualStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 font-medium">รหัสพนักงาน</th>
                        <th className="text-left p-2 font-medium">ชื่อพนักงาน</th>
                        <th className="text-center p-2 font-medium">รายงาน</th>
                        <th className="text-center p-2 font-medium">อนุมัติ</th>
                        <th className="text-center p-2 font-medium">รอ</th>
                        <th className="text-center p-2 font-medium">ไม่อนุมัติ</th>
                        <th className="text-center p-2 font-medium">Safe</th>
                        <th className="text-center p-2 font-medium">Unsafe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {week.individualStats.map((ind) => (
                        <tr key={ind.employeeId} className="border-b">
                          <td className="p-2 font-medium">{ind.employeeId}</td>
                          <td className="p-2">{ind.employeeName}</td>
                          <td className="p-2 text-center font-medium">{ind.total}</td>
                          <td className="p-2 text-center text-green-600">{ind.approved}</td>
                          <td className="p-2 text-center text-yellow-600">{ind.pending}</td>
                          <td className="p-2 text-center text-red-600">{ind.rejected}</td>
                          <td className="p-2 text-center text-green-600">{ind.totalSafe}</td>
                          <td className="p-2 text-center text-red-600">{ind.totalUnsafe}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">ไม่มีรายงานในสัปดาห์นี้</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={exportIndividualReport}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={
            viewType === "monthly"
              ? individualSummary.length === 0
              : weeklySummary.every((w) => w.individualStats.length === 0)
          }
        >
          <FileText className="h-4 w-4" />
          Export รายงาน{viewType === "monthly" ? "รายเดือน" : "รายสัปดาห์"} ITH-OE
        </Button>
      </div>
    </div>
  );
});

IndividualReportSummary.displayName = "IndividualReportSummary";
