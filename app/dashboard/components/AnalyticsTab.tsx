"use client";

import { BarChart3, Calendar, TrendingUp, Users } from "lucide-react";
import { AnalyticsDashboard } from "../AnalyticsDashboard";
import { MonthlyReportSummary } from "../MonthlyReportSummary";
import { type EmployeeInfo, type ReportStats, type AnalyticsExtras } from "../hooks/useReports";
import { type Report } from "../types";

interface Props {
  reports: Report[];
  employeeList: EmployeeInfo[];
  stats: ReportStats;
  departmentList: string[];
  topDepartments: [string, number][];
  analytics: AnalyticsExtras;
}

export function AnalyticsTab({
  reports,
  employeeList,
  stats,
  departmentList,
  topDepartments,
  analytics,
}: Props) {
  return (
    <div className="space-y-8 pb-8">
      <section>
        <div className="flex items-center space-x-2 mb-3 px-1">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">สรุปรายเดือน</h2>
        </div>
        <MonthlyReportSummary reports={reports} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Approval Stats */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-4 w-4 text-slate-500" />
            <h3 className="font-semibold text-slate-800">สถิติการอนุมัติ</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">อนุมัติแล้ว</span>
              <div className="flex items-center space-x-3 w-[130px]">
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: stats.total > 0 ? `${(stats.approved / stats.total) * 100}%` : "0%",
                    }}
                  />
                </div>
                <span className="text-sm font-bold w-6 text-right text-emerald-600">{stats.approved}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">รอการอนุมัติ</span>
              <div className="flex items-center space-x-3 w-[130px]">
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: stats.total > 0 ? `${(stats.pending / stats.total) * 100}%` : "0%",
                    }}
                  />
                </div>
                <span className="text-sm font-bold w-6 text-right text-amber-600">{stats.pending}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">ไม่อนุมัติ</span>
              <div className="flex items-center space-x-3 w-[130px]">
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: stats.total > 0 ? `${(stats.rejected / stats.total) * 100}%` : "0%",
                    }}
                  />
                </div>
                <span className="text-sm font-bold w-6 text-right text-rose-600">{stats.rejected}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-4 w-4 text-slate-500" />
            <h3 className="font-semibold text-slate-800">พฤติกรรมความปลอดภัย</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-emerald-50/50 rounded-xl">
              <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-lg">
                {stats.totalSafeActions}
              </div>
              <div>
                <p className="font-bold text-emerald-700 leading-tight">Safe Actions</p>
                <p className="text-xs text-emerald-600/80">พฤติกรรมปลอดภัย</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-rose-50/50 rounded-xl">
              <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold text-lg">
                {stats.totalUnsafeActions}
              </div>
              <div>
                <p className="font-bold text-rose-700 leading-tight">Unsafe Actions</p>
                <p className="text-xs text-rose-600/80">พฤติกรรมไม่ปลอดภัย</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Departments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-4 w-4 text-slate-500" />
            <h3 className="font-semibold text-slate-800">แผนกที่ส่งรายงานมากที่สุด</h3>
          </div>
          <div className="space-y-3">
            {topDepartments.length > 0 ? (
              topDepartments.map(([dept, count], idx) => (
                <div key={dept} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}.</span>
                    <span className="text-sm font-medium text-slate-700">{dept}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">ยังไม่มีข้อมูล</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 px-1">
          <h2 className="text-lg font-semibold text-slate-800">ภาพรวมการมีส่วนร่วม</h2>
          <p className="text-xs text-slate-500">ข้อมูลการวิเคราะห์และอันดับการเข้าร่วมของพนักงาน</p>
        </div>
        <AnalyticsDashboard
          employeeList={employeeList}
          stats={stats}
          departmentList={departmentList}
          analytics={analytics}
        />
      </section>
    </div>
  );
}
