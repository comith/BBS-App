"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calendar, TrendingUp, Users } from "lucide-react";
import { AnalyticsDashboard } from "../AnalyticsDashboard";
import { MonthlyReportSummary } from "../MonthlyReportSummary";
import { type EmployeeInfo, type ReportStats } from "../hooks/useReports";
import { type Report } from "../types";

interface Props {
  reports: Report[];
  employeeList: EmployeeInfo[];
  stats: ReportStats;
  departmentList: string[];
  topDepartments: [string, number][];
}

export function AnalyticsTab({
  reports,
  employeeList,
  stats,
  departmentList,
  topDepartments,
}: Props) {
  return (
    <>
      <Card className="py-4 px-0  md:p-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>สรุปรายเดือน</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyReportSummary reports={reports} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="py-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>สถิติการอนุมัติ</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">อนุมัติแล้ว</span>
                <div className="flex items-center space-x-2 w-[130px]">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width:
                          stats.total > 0
                            ? `${(stats.approved / stats.total) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.approved}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">รอการอนุมัติ</span>
                <div className="flex items-center space-x-2 w-[130px]">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width:
                          stats.total > 0
                            ? `${(stats.pending / stats.total) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.pending}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ไม่อนุมัติ</span>
                <div className="flex items-center space-x-2 w-[130px]">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width:
                          stats.total > 0
                            ? `${(stats.rejected / stats.total) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.rejected}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>พฤติกรรมความปลอดภัย</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">
                    {stats.totalSafeActions}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-green-600">Safe Actions</p>
                  <p className="text-sm text-gray-600">พฤติกรรมปลอดภัย</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-red-600">
                    {stats.totalUnsafeActions}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-red-600">Unsafe Actions</p>
                  <p className="text-sm text-gray-600">พฤติกรรมไม่ปลอดภัย</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>แผนกที่ส่งรายงานมากที่สุด</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDepartments.length > 0 ? (
                topDepartments.map(([dept, count]) => (
                  <div
                    key={dept}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-600">{dept}</span>
                    <span className="text-sm font-medium">
                      {count} รายการ
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  ยังไม่มีข้อมูลรายงาน
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <AnalyticsDashboard
        reports={reports}
        employeeList={employeeList}
        stats={stats}
        departmentList={departmentList}
      />
    </>
  );
}
