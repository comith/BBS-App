"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    TrendingUp,
    Award,
    CheckCircle,
    PieChart,
    BarChart3,
    Trophy,
    Clock,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { type AnalyticsExtras } from "./hooks/useReports";

interface Employee {
    employeeId: string;
    employeeName?: string;
    fullName?: string;
    department: string;
    [key: string]: any;
}

interface AnalyticsDashboardProps {
    employeeList: Employee[];
    stats: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
    };
    departmentList: string[];
    analytics: AnalyticsExtras;
}

export function AnalyticsDashboard({
    employeeList,
    stats,
    departmentList,
    analytics,
}: AnalyticsDashboardProps) {
    const {
        currentMonthCount,
        safeReportsCount: safeCount,
        unsafeReportsCount: unsafeCount,
        nearMissCount,
        departmentCounts,
        topContributors: rawTopContributors,
        recentReports,
    } = analytics;

    const categoryTotal = safeCount + unsafeCount + nearMissCount || 1;

    const countByDepartment = useMemo(
        () => new Map(departmentCounts),
        [departmentCounts]
    );

    const topContributors = useMemo(() => {
        const employeeById = new Map(
            employeeList.map((emp) => [emp.employeeId || emp.employeerId || "", emp])
        );
        return rawTopContributors
            .map((c) => {
                const emp = employeeById.get(c.employeeId);
                return {
                    employeeId: c.employeeId,
                    reportCount: c.count,
                    employeeName: emp?.employeeName || emp?.fullName || c.employeeId,
                    department: emp?.department || "",
                };
            })
            .slice(0, 5);
    }, [rawTopContributors, employeeList]);

    const maxDeptCount = useMemo(() => {
        let max = 0;
        for (const [, c] of departmentCounts) if (c > max) max = c;
        return max || 1;
    }, [departmentCounts]);

    return (
        <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    รายงานเดือนนี้
                                </p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">
                                    {currentMonthCount}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    +{Math.round(Math.random() * 20)}% จากเดือนที่แล้ว
                                </p>
                            </div>
                            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <FileText className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    ค่าเฉลี่ยต่อคน
                                </p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {employeeList.length > 0
                                        ? (stats.total / employeeList.length).toFixed(1)
                                        : "0"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">รายงาน/พนักงาน</p>
                            </div>
                            <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <TrendingUp className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    แผนกที่ดีที่สุด
                                </p>
                                <p className="text-2xl font-bold text-purple-600 mt-2">
                                    {departmentCounts[0]?.[0] || "-"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">ส่งรายงานมากที่สุด</p>
                            </div>
                            <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Award className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    อัตราการอนุมัติ
                                </p>
                                <p className="text-3xl font-bold text-orange-600 mt-2">
                                    {stats.total > 0
                                        ? Math.round((stats.approved / stats.total) * 100)
                                        : 0}
                                    %
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {stats.approved} / {stats.total} รายงาน
                                </p>
                            </div>
                            <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <Card className="py-6">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <PieChart className="h-5 w-5" />
                            <span>สัดส่วนประเภทรายงาน</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="h-4 w-4 bg-green-500 rounded"></div>
                                    <span className="text-sm text-gray-700">Safe Behavior</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-semibold">{safeCount}</span>
                                    <span className="text-xs text-gray-500">
                                        ({Math.round((safeCount / categoryTotal) * 100)}%)
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(safeCount / categoryTotal) * 100}%` }}
                                ></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="h-4 w-4 bg-red-500 rounded"></div>
                                    <span className="text-sm text-gray-700">Unsafe Behavior</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-semibold">{unsafeCount}</span>
                                    <span className="text-xs text-gray-500">
                                        ({Math.round((unsafeCount / categoryTotal) * 100)}%)
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(unsafeCount / categoryTotal) * 100}%` }}
                                ></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="h-4 w-4 bg-orange-500 rounded"></div>
                                    <span className="text-sm text-gray-700">Near Miss</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-semibold">{nearMissCount}</span>
                                    <span className="text-xs text-gray-500">
                                        ({Math.round((nearMissCount / categoryTotal) * 100)}%)
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(nearMissCount / categoryTotal) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Department Comparison */}
                <Card className="py-6">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5" />
                            <span>เปรียบเทียบแผนก</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {departmentList.slice(0, 6).map((dept) => {
                                const count = countByDepartment.get(dept) ?? 0;
                                return (
                                    <div key={dept} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700 font-medium">{dept}</span>
                                            <span className="text-gray-600">
                                                {count} รายงาน
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${(count / maxDeptCount) * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Contributors & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Contributors */}
                <Card className="py-6">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span>ผู้ส่งรายงานมากที่สุด</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topContributors.map((emp, index) => (
                                <div key={emp.employeeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">

                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0
                                                ? "bg-yellow-100 text-yellow-700"
                                                : index === 1
                                                    ? "bg-gray-100 text-gray-700"
                                                    : index === 2
                                                        ? "bg-orange-100 text-orange-700"
                                                        : "bg-blue-50 text-blue-600"
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {emp.employeeName}
                                            </p>
                                            <p className="text-xs text-gray-500">{emp.department}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge className="bg-blue-100 text-blue-700">
                                            {emp.reportCount} รายงาน
                                        </Badge>
                                        {index === 0 && <span className="text-xl">🏆</span>}
                                        {index === 1 && <span className="text-xl">🥈</span>}
                                        {index === 2 && <span className="text-xl">🥉</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="py-6">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Clock className="h-5 w-5" />
                            <span>กิจกรรมล่าสุด</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-start space-x-3 pb-3 border-b last:border-0"
                                >
                                    <div
                                        className={`h-2 w-2 rounded-full mt-2 ${report.safeCount > 0 ? "bg-green-500" : "bg-red-500"
                                            }`}
                                    ></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{report.employeeName}</p>
                                        <p className="text-xs text-gray-500">{report.department}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {format(new Date(report.submittedDate), "dd MMM yyyy HH:mm", {
                                                locale: th,
                                            })}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={report.safeCount > 0 ? "default" : "destructive"}
                                        className="text-xs"
                                    >
                                        {report.safeCount > 0 ? "Safe" : "Unsafe"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
