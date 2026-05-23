"use client";
import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { startOfDay, endOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
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
    if (weekNumber > 5) break;

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

function exportMonthlyReportCSV(
  weeklySummary: any[],
  monthlyStats: any,
  selectedMonth: Date
) {
  const monthName = monthNames[selectedMonth.getMonth()];
  const year = selectedMonth.getFullYear();

  const headers = [
    "สัปดาห์",
    "ช่วงวันที่",
    "รายงานทั้งหมด",
    ...monthlyStats.groupSummary.map((g: any) => `${g.group} (ทั้งหมด)`),
    ...monthlyStats.groupSummary.map((g: any) => `${g.group} (อนุมัติ)`),
  ];

  const csvData = weeklySummary.map((week) => [
    week.label,
    `${format(week.start, "dd/MM/yyyy")} - ${format(week.end, "dd/MM/yyyy")}`,
    week.totalReports,
    ...monthlyStats.groupSummary.map((g: any) => {
      const stat = week.groupStats.find((gs: any) => gs.group === g.group);
      return stat ? stat.total : 0;
    }),
    ...monthlyStats.groupSummary.map((g: any) => {
      const stat = week.groupStats.find((gs: any) => gs.group === g.group);
      return stat ? stat.approved : 0;
    }),
  ]);

  csvData.push([
    "รวมทั้งเดือน",
    "",
    monthlyStats.totalReports,
    ...monthlyStats.groupSummary.map((g: any) => g.total),
    ...monthlyStats.groupSummary.map((g: any) => g.approved),
  ]);

  const allData = [headers, ...csvData];
  const csvContent = allData
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename = `BBS_Monthly_Report_${monthName}_${year}.csv`;
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.setAttribute("href", URL.createObjectURL(blob));
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const MonthlyReportSummary = React.memo(({ reports }: { reports: Report[] }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isGroupTableOpen, setIsGroupTableOpen] = useState(false);

  const monthlyReports = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    return reports.filter((r) => {
      const d = r.submittedDate;
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [reports, selectedMonth]);

  const weeklySummary = useMemo(() => {
    const weeks = getWeeksInMonth(selectedMonth);
    const groups = [...new Set(monthlyReports.map((r) => r.group))].sort();

    const weekBounds = weeks.map((w) => ({
      start: startOfDay(w.start).getTime(),
      end: endOfDay(w.end).getTime(),
    }));

    type GroupStat = {
      group: string;
      total: number;
      approved: number;
      pending: number;
      rejected: number;
    };
    const emptyStat = (group: string): GroupStat => ({
      group,
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    });

    const perWeek = weeks.map(() => {
      const m = new Map<string, GroupStat>();
      for (const g of groups) m.set(g, emptyStat(g));
      return { total: 0, byGroup: m };
    });

    for (const r of monthlyReports) {
      const t = startOfDay(r.submittedDate).getTime();
      for (let i = 0; i < weekBounds.length; i++) {
        if (t >= weekBounds[i].start && t <= weekBounds[i].end) {
          const slot = perWeek[i];
          slot.total++;
          const gs = slot.byGroup.get(r.group);
          if (gs) {
            gs.total++;
            if (r.status === "approved") gs.approved++;
            else if (r.status === "pending") gs.pending++;
            else if (r.status === "rejected") gs.rejected++;
          }
          break;
        }
      }
    }

    return weeks.map((week, i) => ({
      ...week,
      totalReports: perWeek[i].total,
      groupStats: [...perWeek[i].byGroup.values()],
    }));
  }, [monthlyReports, selectedMonth]);

  const monthlyStats = useMemo(() => {
    const byGroup = new Map<
      string,
      { total: number; approved: number; pending: number; rejected: number }
    >();
    let totalApproved = 0;
    let totalPending = 0;
    let totalRejected = 0;

    for (const r of monthlyReports) {
      if (r.status === "approved") totalApproved++;
      else if (r.status === "pending") totalPending++;
      else if (r.status === "rejected") totalRejected++;

      let g = byGroup.get(r.group);
      if (!g) {
        g = { total: 0, approved: 0, pending: 0, rejected: 0 };
        byGroup.set(r.group, g);
      }
      g.total++;
      if (r.status === "approved") g.approved++;
      else if (r.status === "pending") g.pending++;
      else if (r.status === "rejected") g.rejected++;
    }

    const groupSummary = [...byGroup.entries()]
      .map(([group, s]) => ({
        group,
        ...s,
        approvalRate:
          s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalReports: monthlyReports.length,
      totalApproved,
      totalPending,
      totalRejected,
      groupSummary,
    };
  }, [monthlyReports]);

  const changeMonth = (direction: "prev" | "next") => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
      return d;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => changeMonth("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </h3>
          <Button variant="outline" size="sm" onClick={() => changeMonth("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col md:flex-row justify-center items-center gap-3">
          <div className="text-sm text-gray-600">
            รายงานทั้งหมด: {monthlyStats.totalReports} รายการ
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={monthlyStats.totalReports === 0}
            onClick={() => exportMonthlyReportCSV(weeklySummary, monthlyStats, selectedMonth)}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{monthlyStats.totalReports}</div>
          <div className="text-sm text-blue-700">รายงานทั้งหมด</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{monthlyStats.totalApproved}</div>
          <div className="text-sm text-green-700">อนุมัติแล้ว</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{monthlyStats.totalPending}</div>
          <div className="text-sm text-yellow-700">รอการอนุมัติ</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{monthlyStats.totalRejected}</div>
          <div className="text-sm text-red-700">ไม่อนุมัติ</div>
        </div>
      </div>

      {/* Group summary table — collapsible */}
      {monthlyStats.groupSummary.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setIsGroupTableOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
          >
            <span>สรุปรายกลุ่ม ({monthlyStats.groupSummary.length} กลุ่ม)</span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isGroupTableOpen ? "rotate-180" : ""
                }`}
            />
          </button>
          {isGroupTableOpen && (
            <div className="overflow-x-auto h-[500px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 font-medium">กลุ่ม</th>
                    <th className="text-center p-3 font-medium">ทั้งหมด</th>
                    <th className="text-center p-3 font-medium">อนุมัติ</th>
                    <th className="text-center p-3 font-medium">รอ</th>
                    <th className="text-center p-3 font-medium">ไม่อนุมัติ</th>
                    <th className="text-center p-3 font-medium">% อนุมัติ</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.groupSummary.map((g) => (
                    <tr key={g.group} className="border-b">
                      <td className="p-3 font-medium">{g.group}</td>
                      <td className="p-3 text-center">{g.total}</td>
                      <td className="p-3 text-center text-green-600 font-medium">{g.approved}</td>
                      <td className="p-3 text-center text-yellow-600 font-medium">{g.pending}</td>
                      <td className="p-3 text-center text-red-600 font-medium">{g.rejected}</td>
                      <td className="p-3 text-center">
                        <Badge
                          className={
                            g.approvalRate >= 80
                              ? "bg-green-100 text-green-800"
                              : g.approvalRate >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {g.approvalRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MonthlyReportSummary.displayName = "MonthlyReportSummary";
