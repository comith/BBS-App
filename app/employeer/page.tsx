"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Calendar, AlertTriangle, XCircle } from "lucide-react";
import { startOfDay } from "date-fns";

// Use dashboard types and helpers
import { Report, transformApiDataToDashboardReport } from "@/app/dashboard/types";
import { ReportStats } from "@/app/dashboard/hooks/useReports";
import { useReportFilters } from "@/app/dashboard/hooks/useReportFilters";

// Dashboard components
import { StatsCards } from "@/app/dashboard/components/StatsCards";
import { ReportFilters } from "@/app/dashboard/components/ReportFilters";
import { ReportCard } from "@/app/dashboard/components/ReportCard";
import { ReportDetailModal } from "@/app/dashboard/components/ReportDetailModal";
import { AiInsightDialog } from "@/app/dashboard/components/AiInsightDialog";
import { exportReportsToCSV } from "@/app/dashboard/utils/csvExport";

interface SheViolation {
  record_id: string;
  date: string;
  employee_id: string;
  fullname: string;
  group: string;
  depart: string;
  safetycategory_id: string;
  sub_safetycategory_id: string;
  observed_Work: string;
  department_notice: string;
  vehicleEquipment: any;
  selectedOptions: any[];
  safeActionCount: number;
  actionType: string;
  unsafeActionCount: number;
  actionTypeunsafe: string;
  attachment: any[];
  other: string;
  employee_code: string;
  level_accident: string; // ระดับความเสี่ยง: เสี่ยงสูง, เสี่ยงต่ำ, etc.
}

interface SheStats {
  total: number;
  byMonth: Record<string, number>;
  byCategory: Record<string | number, number>;
  byRiskLevel: Record<string, number>;
  ppeViolations: number;
}

interface CalculateSheStatsViolation {
  date: string;
  safetycategory_id: string | number;
  level_accident?: string;
}

const calculateSheStats = (
  violations: CalculateSheStatsViolation[]
): SheStats => {
  const stats: SheStats = {
    total: violations.length,
    byMonth: {},
    byCategory: {},
    byRiskLevel: {},
    ppeViolations: 0,
  };

  violations.forEach((violation) => {
    // จัดกลุ่มตามเดือน
    const date = new Date(violation.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!stats.byMonth[monthKey]) {
      stats.byMonth[monthKey] = 0;
    }
    stats.byMonth[monthKey]++;

    // จัดกลุ่มตามหมวดหมู่
    if (violation.level_accident === "PPE") {
      stats.ppeViolations++;
    } else if (violation.level_accident === "เสี่ยงสูง") {
      stats.byRiskLevel["เสี่ยงสูง"] =
        (stats.byRiskLevel["เสี่ยงสูง"] || 0) + 1;
    } else if (violation.level_accident === "เสี่ยงต่ำ") {
      stats.byRiskLevel["อุบัติเหตุ"] =
        (stats.byRiskLevel["อุบัติเหตุ"] || 0) + 1;
    }
  });

  return stats;
};

// ฟังก์ชันแปลงเดือนเป็นภาษาไทย
const getThaiMonth = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(year) + 543}`;
};

function SheViolationsDashboard({
  sheViolations,
  sheStats,
  getThaiMonth,
}: Readonly<{
  sheViolations: SheViolation[];
  sheStats: SheStats;
  getThaiMonth: (monthKey: string) => string;
}>) {
  if (sheViolations.length === 0) {
    return (
      <Card className="p-6">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">ไม่พบประวัติการละเมิดความปลอดภัย (SHE Violations)</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 p-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="h-6 w-6 bg-red-100 rounded flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <span>รายงานการกระทำผิด (SHE Violations)</span>
          <Badge variant="secondary">{sheStats.total} ครั้ง</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* สถิติรวม */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">
                  การละเมิด PPE
                </p>
                <p className="text-2xl font-bold text-red-700">
                  {sheStats.ppeViolations}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">
                  เสี่ยงสูง
                </p>
                <p className="text-2xl font-bold text-orange-700">
                  {sheStats.byRiskLevel["เสี่ยงสูง"] || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* สถิติรายเดือน */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-3">รายงานรายเดือน</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(sheStats.byMonth)
              .sort(([a], [b]) => b.localeCompare(a)) // เรียงจากใหม่ไปเก่า
              .slice(0, 6) // แสดงแค่ 6 เดือนล่าสุด
              .map(([monthKey, count]) => (
                <div
                  key={monthKey}
                  className="bg-gray-50 p-3 rounded-lg border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {getThaiMonth(monthKey)}
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {count}
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfiniteScrollTrigger({ onIntersect }: { onIntersect: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin: "200px" },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onIntersect]);

  return (
    <div ref={ref} className="w-full py-4 flex justify-center text-gray-400">
      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  
  const [reports, setReports] = useState<Report[]>([]);
  const [departmentList, setDepartmentList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheViolations, setSheViolations] = useState<SheViolation[]>([]);
  const [sheStats, setSheStats] = useState<SheStats>({
    total: 0,
    byMonth: {},
    byCategory: {},
    byRiskLevel: {},
    ppeViolations: 0,
  });

  const [activeTab, setActiveTab] = useState("reports");
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedAiReport, setSelectedAiReport] = useState<Report | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const toggleAccordion = useCallback((recordId: string) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  }, []);

  const loadFromLocalStorage = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("bbs_employee_data");
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const employeeData = loadFromLocalStorage();
    if (employeeData && employeeData.employeerId) {
      setEmployeeId(employeeData.employeerId);
      setEmployeeName(employeeData.fullName || "");
    } else {
      console.warn("No employee data found in localStorage");
      // router.push("/");
    }
  }, []);

  const fetchReports = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [recordResponse, categoryResponse, subCategoryResponse] = await Promise.all([
        fetch("/api/get?type=record"),
        fetch("/api/get?type=category"),
        fetch("/api/get?type=subcategory"),
      ]);

      if (!recordResponse.ok) throw new Error("Failed to fetch records");

      const [apiData, categoryData, subCategoryData] = await Promise.all([
        recordResponse.json(),
        categoryResponse.json(),
        subCategoryResponse.json(),
      ]);

      const allReports = transformApiDataToDashboardReport(apiData ?? [], categoryData, subCategoryData);
      
      // Filter reports only for the logged-in employee
      const myReports = allReports.filter((r) => r.employeeId === employeeId);
      
      setReports(myReports);
      
      // Extract unique departments for the filter dropdown
      const depts = [...new Set(myReports.map((r) => r.department))].sort();
      setDepartmentList(depts);
      
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const fetchSheViolations = useCallback(async () => {
    if (!employeeId) return;
    try {
      const response = await fetch("/api/get?type=she_violations");
      if (!response.ok) throw new Error("Failed to fetch she violations");
      const apiData = await response.json();
      const myViolations = apiData.filter((item: SheViolation) => item.employee_code === employeeId);
      setSheViolations(myViolations);
      setSheStats(calculateSheStats(myViolations));
    } catch (err) {
      console.error("Error fetching SHE violations:", err);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      fetchReports();
      fetchSheViolations();
    }
  }, [employeeId, fetchReports, fetchSheViolations]);

  // Calculate Stats specifically for Employee's reports
  const stats = useMemo<ReportStats>(() => {
    const todayStart = startOfDay(new Date()).getTime();
    let pending = 0, approved = 0, rejected = 0, highPriority = 0;
    let totalSafeActions = 0, totalUnsafeActions = 0, todayReports = 0;
    let ppe = 0, ppe_safe = 0, ppe_unsafe = 0;
    let tools = 0, tools_safe = 0, tools_unsafe = 0;
    let unsafe_actions = 0, unsafe_actions_safe = 0, unsafe_actions_unsafe = 0;
    let unsafe_condition = 0, unsafe_condition_safe = 0, unsafe_condition_unsafe = 0;

    for (const r of reports) {
      if (r.status === "pending") pending++;
      else if (r.status === "approved") approved++;
      else if (r.status === "rejected") rejected++;

      if (r.priority === "high" && r.status === "pending") highPriority++;
      totalSafeActions += r.safeCount;
      totalUnsafeActions += r.unsafeCount;
      if (startOfDay(r.submittedDate).getTime() === todayStart) todayReports++;

      if (r.status === "approved") {
        const cat = r.safetyCategory;
        if (cat === "การสวมใส่อุปกรณ์คุ้มครองส่วนบุคคล PPE") {
          ppe++;
          ppe_safe += r.safeCount;
          ppe_unsafe += r.unsafeCount;
        } else if (cat === "การใช้อุปกรณ์ เครื่องมือ เครื่องจักร และยานพาหนะต่างๆ ในการทำงาน Tool / Equipment / Machine / Vehicle") {
          tools++;
          tools_safe += r.safeCount;
          tools_unsafe += r.unsafeCount;
        } else if (cat === "การกระทำที่ไม่ปลอดภัย และการจับชิ้นส่วน Unsafe Action / Driving / Line of fire") {
          unsafe_actions++;
          unsafe_actions_safe += r.safeCount;
          unsafe_actions_unsafe += r.unsafeCount;
        } else if (cat === "สภาพแวดล้อมที่ไม่ปลอดภัย Plant / Unsafe Condition (UC)") {
          unsafe_condition++;
          unsafe_condition_safe += r.safeCount;
          unsafe_condition_unsafe += r.unsafeCount;
        }
      }
    }

    return {
      total: reports.length, pending, approved, rejected, highPriority,
      totalSafeActions, totalUnsafeActions, todayReports,
      ppe, ppe_safe, ppe_unsafe,
      tools, tools_safe, tools_unsafe,
      unsafe_actions, unsafe_actions_safe, unsafe_actions_unsafe,
      unsafe_condition, unsafe_condition_safe, unsafe_condition_unsafe,
    };
  }, [reports]);

  const filters = useReportFilters(reports);

  const handleExport = useCallback(() => {
    exportReportsToCSV(filters.filteredReports, filters.dateRange);
  }, [filters.filteredReports, filters.dateRange]);

  const handleClearAll = useCallback(() => {
    filters.setStatusFilter("all");
    filters.setDepartmentFilter("all");
    filters.setSearchTerm("");
    filters.setDateRange({ from: undefined, to: undefined });
  }, [filters]);

  if (!employeeId && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">
              ไม่พบรหัสพนักงาน กรุณาเข้าถึงหน้านี้ผ่านลิงก์ที่ถูกต้อง
            </p>
            <Button onClick={() => router.push("/")} className="mt-4">กลับหน้าหลัก</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Image
                src="/img/ith.png"
                alt="ITH Logo"
                width={50}
                height={50}
                className="rounded-xl shadow-sm border border-slate-100"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  รายงานของฉัน
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  {employeeId} • {employeeName}
                </p>
              </div>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1 sm:flex-none text-slate-600 hover:text-slate-900 border-slate-200"
              >
                ย้อนกลับ
              </Button>
              <Button
                onClick={() => {
                  fetchReports();
                  fetchSheViolations();
                }}
                disabled={isLoading}
                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                {isLoading ? "กำลังรีเฟรช..." : "รีเฟรชข้อมูล"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="py-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button
                onClick={() => fetchReports()}
                size="sm"
                className="mt-3 bg-red-500 hover:bg-red-600"
              >
                ลองใหม่อีกครั้ง
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="flex overflow-x-auto no-scrollbar w-full justify-start sm:h-full sm:grid bg-white p-1.5 sm:p-2 rounded-[1.25rem] sm:rounded-2xl border border-slate-200 shadow-sm sm:grid-cols-2">
            <TabsTrigger
              value="reports"
              className="rounded-xl px-5 py-2 sm:py-2.5 text-sm whitespace-nowrap min-w-fit"
            >
              ประวัติการรายงาน
            </TabsTrigger>
            <TabsTrigger
              value="she"
              className="rounded-xl px-5 py-2 sm:py-2.5 text-sm whitespace-nowrap min-w-fit"
            >
              ประวัติการละเมิด (SHE)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <StatsCards stats={stats} isLoading={isLoading} />

            <ReportFilters
              searchTerm={filters.searchTerm}
              onSearchTermChange={filters.setSearchTerm}
              statusFilter={filters.statusFilter}
              onStatusFilterChange={filters.setStatusFilter}
              departmentFilter={filters.departmentFilter}
              onDepartmentFilterChange={filters.setDepartmentFilter}
              departmentList={departmentList}
              dateRange={filters.dateRange}
              onDateRangeChange={filters.setDateRange}
              isDatePickerOpen={isDatePickerOpen}
              setIsDatePickerOpen={setIsDatePickerOpen}
              onClearDateRange={filters.clearDateRange}
              onQuickDateRange={filters.setQuickDateRange}
              onExport={handleExport}
              filteredCount={filters.filteredReports.length}
              totalCount={reports.length}
              onClearAll={handleClearAll}
            />

            <div className="space-y-2 overflow-auto h-[60dvh] md:h-[calc(100vh-320px)] pr-1">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <p className="mt-2 text-slate-500 text-sm">กำลังโหลดข้อมูล...</p>
                </div>
              ) : filters.filteredReports.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 bg-transparent">
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">
                      ไม่พบรายงานที่ตรงกับเงื่อนไข
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {filters.visibleReports.map((report) => (
                    <ReportCard
                      key={report.recordId}
                      report={report}
                      isOpen={openAccordions.has(report.recordId)}
                      isSheOrManager={false}
                      onToggle={() => toggleAccordion(report.recordId)}
                      onApprove={() => {}}
                      onReject={() => {}}
                      onView={() => setSelectedReport(report)}
                      onAiView={() => setSelectedAiReport(report)}
                    />
                  ))}

                  {filters.visibleCount < filters.filteredReports.length && (
                    <InfiniteScrollTrigger onIntersect={filters.loadMore} />
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="she" className="space-y-6">
             <SheViolationsDashboard
               sheViolations={sheViolations}
               sheStats={sheStats}
               getThaiMonth={getThaiMonth}
             />
          </TabsContent>
        </Tabs>
      </div>

      <ReportDetailModal
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
        isSheOrManager={false}
        onApprove={() => {}}
        onReject={() => {}}
        onViewImage={(url) => window.open(url, '_blank')}
        onAiView={(r) => setSelectedAiReport(r)}
      />

      <AiInsightDialog
        report={selectedAiReport}
        onClose={() => setSelectedAiReport(null)}
      />
    </div>
  );
}
