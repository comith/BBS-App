"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import PayrollReportSummary from "./PayrollReportSummary";
import { type Report } from "./types";
import { exportReportsToCSV } from "./utils/csvExport";

import { useEmployeeSession } from "./hooks/useEmployeeSession";
import { useReports } from "./hooks/useReports";
import { useReportFilters } from "./hooks/useReportFilters";
import { useMaintenance } from "./hooks/useMaintenance";

import { DashboardHeader } from "./components/DashboardHeader";
import { StatsCards } from "./components/StatsCards";
import { ReportFilters } from "./components/ReportFilters";
import { ReportCard } from "./components/ReportCard";
import { ApprovalDialog } from "./components/ApprovalDialog";
import { ImageViewer } from "./components/ImageViewer";
import { AiInsightDialog } from "./components/AiInsightDialog";
import { ReportDetailModal } from "./components/ReportDetailModal";
import { MaintenanceSettings } from "./components/MaintenanceSettings";
import { AnalyticsTab } from "./components/AnalyticsTab";

function InfiniteScrollTrigger({ onIntersect }: { onIntersect: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

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

function AdminDashboard() {
  const session = useEmployeeSession();
  const {
    reports,
    setReports,
    isLoading,
    isBackgroundLoading,
    isStatsLoading,
    error,
    selectedYear,
    setSelectedYear,
    fetchReports,
    refreshStats,
    employeeList,
    departmentList,
    topDepartments,
    stats,
    analytics,
  } = useReports(session.loaded);

  const filters = useReportFilters(reports);
  const maintenance = useMaintenance(session.isMaintenanceAdmin);

  const [activeTab, setActiveTab] = useState("reports");
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedAiReport, setSelectedAiReport] = useState<Report | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Approval modal
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [adminNote, setAdminNote] = useState("");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const toggleAccordion = useCallback((recordId: string) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  }, []);

  const handleApprovalAction = useCallback(
    (action: "approve" | "reject", report: Report) => {
      setSelectedReport(report);
      setApprovalAction(action);
      setAdminNote("");
      setApprovalError(null);
      setIsApprovalModalOpen(true);
    },
    [],
  );

  const closeApprovalModal = useCallback(() => {
    setIsApprovalModalOpen(false);
    setSelectedReport(null);
    setApprovalAction(null);
    setAdminNote("");
    setApprovalError(null);
  }, []);

  const submitApprovalAction = async () => {
    if (!selectedReport || !approvalAction) return;

    setIsSubmittingApproval(true);

    try {
      const response = await apiFetch("/api/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Employee-Id": session.sheid || "",
          "X-Employee-Group": session.group || "",
        },
        body: JSON.stringify({
          recordId: selectedReport.recordId,
          status: approvalAction === "approve" ? "approved" : "rejected",
          adminNote: adminNote.trim() || null,
          approvedBy: session.sheid || "SHE",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update approval status",
        );
      }

      const result = await response.json();

      apiFetch("/api/notification-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: approvalAction === "approve" ? "approved" : "rejected",
          action_from: "SHE",
          notification_to: selectedReport.employeeId,
        }),
      }).catch((err) => console.warn("notification-logs failed:", err));

      setReports((prev) =>
        prev.map((report) =>
          report.recordId === selectedReport.recordId
            ? {
                ...report,
                status:
                  approvalAction === "approve"
                    ? ("approved" as const)
                    : ("rejected" as const),
                adminNote: adminNote.trim() || null,
                approvedDate: new Date(result.data.approvedDate),
                approvedBy: result.data.approvedBy,
              }
            : report,
        ),
      );
      refreshStats();
      setIsApprovalModalOpen(false);
      setSelectedReport(null);
      setApprovalAction(null);
      setAdminNote("");

      const actionText =
        approvalAction === "approve" ? "อนุมัติ" : "ไม่อนุมัติ";
      setSuccessMessage(`${actionText}รายงาน #${selectedReport.id} สำเร็จแล้ว`);

      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("❌ Error updating approval status:", err);
      setApprovalError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัพเดตสถานะ",
      );
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleExport = useCallback(() => {
    exportReportsToCSV(filters.filteredReports, filters.dateRange);
  }, [filters.filteredReports, filters.dateRange]);

  const handleClearAll = useCallback(() => {
    filters.setStatusFilter("all");
    filters.setDepartmentFilter("all");
    filters.setSearchTerm("");
    filters.setDateRange({ from: undefined, to: undefined });
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        isLoading={isLoading}
        onRefresh={() => fetchReports()}
        employeeId={session.employeeId}
        employeeName={session.employeeName}
        department={session.department}
        group={session.group}
        isSheOrManager={session.isSheOrManager}
      />

      {error && !isLoading && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-600 font-medium mb-1">
                {error === "DB_ERROR"
                  ? "ไม่สามารถเชื่อมต่อฐานข้อมูลได้"
                  : error === "CONNECTION_FAILED"
                    ? "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"
                    : error}
              </p>
              <p className="text-red-500 text-sm mb-3">
                {error === "DB_ERROR" || error === "CONNECTION_FAILED"
                  ? "กรุณาลองใหม่ในอีกสักครู่"
                  : "กรุณาลองใหม่อีกครั้ง"}
              </p>
              <Button
                onClick={() => fetchReports()}
                size="sm"
                className="bg-red-500 hover:bg-red-600"
              >
                ลองใหม่อีกครั้ง
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-700 font-medium">{successMessage}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList
            className={cn(
              "flex overflow-x-auto no-scrollbar w-full justify-start sm:h-full sm:grid bg-slate-100/80 backdrop-blur-md p-1.5 sm:p-2 rounded-[1.25rem] sm:rounded-2xl border border-slate-200/60 shadow-sm",
              session.isMaintenanceAdmin ? "sm:grid-cols-4" : "sm:grid-cols-3",
            )}
          >
            <TabsTrigger
              value="reports"
              className="rounded-xl px-5 py-2 sm:py-2.5 text-sm whitespace-nowrap min-w-fit"
            >
              รายงานทั้งหมด
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-xl px-5 py-2 sm:py-2.5 text-sm whitespace-nowrap min-w-fit"
            >
              สถิติและรายงาน
            </TabsTrigger>
            <TabsTrigger
              value="payroll"
              className="rounded-xl px-5 py-2 sm:py-2.5 text-sm whitespace-nowrap min-w-fit"
            >
              การจ่ายเงิน
            </TabsTrigger>
            {session.isMaintenanceAdmin && (
              <TabsTrigger
                value="system"
                className="rounded-xl px-5 py-2 sm:py-2.5 text-sm whitespace-nowrap min-w-fit"
              >
                จัดการระบบ
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            {isBackgroundLoading && (
              <div className="bg-orange-50 border border-orange-100 text-orange-700 text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-pulse shadow-sm">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <span>กำลังโหลดข้อมูลทั้งหมดสถิติรายปีในเบื้องหลังเพื่อให้รายงานอัปเดตครบถ้วน...</span>
              </div>
            )}

            <StatsCards stats={stats} isLoading={isStatsLoading} />

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
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
              ) : filters.filteredReports.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      ไม่พบรายงานที่ตรงกับเงื่อนไขการค้นหา
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
                      isSheOrManager={session.isSheOrManager}
                      onToggle={() => toggleAccordion(report.recordId)}
                      onApprove={() => handleApprovalAction("approve", report)}
                      onReject={() => handleApprovalAction("reject", report)}
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

          <TabsContent value="analytics" className="space-y-6">
            {isBackgroundLoading && (
              <div className="bg-orange-50 border border-orange-100 text-orange-700 text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-pulse shadow-sm">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <span>กำลังดาวน์โหลดและวิเคราะห์สถิติทั้งหมดในระบบ ข้อมูลวิเคราะห์ด้านล่างจะสมบูรณ์ในสักครู่...</span>
              </div>
            )}

            <AnalyticsTab
              reports={reports}
              employeeList={employeeList}
              stats={stats}
              departmentList={departmentList}
              topDepartments={topDepartments}
              analytics={analytics}
            />
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <div className="flex items-center space-x-2 mb-2 px-1">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-800">รายงานการจ่ายเงิน BBS</h2>
            </div>
            <PayrollReportSummary
              reports={reports}
              employeeList={employeeList}
            />
          </TabsContent>

          {session.isMaintenanceAdmin && (
            <TabsContent value="system" className="space-y-4">
              <MaintenanceSettings state={maintenance} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <ApprovalDialog
        open={isApprovalModalOpen}
        onOpenChange={(open) => {
          if (!open) closeApprovalModal();
        }}
        action={approvalAction}
        report={selectedReport}
        adminNote={adminNote}
        onAdminNoteChange={setAdminNote}
        isSubmitting={isSubmittingApproval}
        error={approvalError}
        onSubmit={submitApprovalAction}
        onCancel={closeApprovalModal}
      />

      <ImageViewer image={viewingImage} onClose={() => setViewingImage(null)} />

      <ReportDetailModal
        report={selectedReport}
        open={!!selectedReport && !isApprovalModalOpen}
        onOpenChange={(open) => !open && setSelectedReport(null)}
        isSheOrManager={session.isSheOrManager}
        onViewImage={setViewingImage}
        onApprove={(r) => handleApprovalAction("approve", r)}
        onReject={(r) => handleApprovalAction("reject", r)}
        onAiView={(r) => setSelectedAiReport(r)}
      />

      <AiInsightDialog
        report={selectedAiReport}
        onClose={() => setSelectedAiReport(null)}
        onRefresh={() => fetchReports()}
      />
    </div>
  );
}

export default AdminDashboard;
