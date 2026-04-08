"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  format,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
  endOfDay,
} from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart3,
  TrendingUp,
  FileText,
  Check,
  Ban,
  Building2,
  House,
  DollarSign,
  UserRoundCog,
  HardHat,
  Wrench,
  Bike,
  ReceiptText,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define EmployeeInfo interface
interface EmployeeInfo {
  employeeId: string;
  employeeName: string;
  department: string;
  group: string;
  [key: string]: any;
}
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PayrollReportSummary from "./PayrollReportSummary";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { CustomCalendar } from "./CustomCalendar";
import { MonthlyReportSummary } from "./MonthlyReportSummary";
import { IndividualReportSummary } from "./IndividualReportSummary";
import {
  type Report,
  type ApiReport,
  getStatusInfo,
  getPriorityInfo,
  transformApiDataToDashboardReport,
} from "./types";


function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  // Removed duplicate filteredReports state, use useMemo version below
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("reports");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [sheid, setSheid] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [employeeList, setEmployeeList] = useState<EmployeeInfo[]>([]);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const MAINTENANCE_ADMIN = "3ST19686";
  const isMaintenanceAdmin = sheid === MAINTENANCE_ADMIN;

  const [maintenanceSetting, setMaintenanceSetting] = useState({
    isActive: false,
    startTime: "",
    endTime: "",
    message: "",
  });
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [maintenanceSaveMsg, setMaintenanceSaveMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const maintenanceSaveMsgTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toDatetimeLocal = (iso?: string | null) => {
    if (!iso) return "";
    return new Date(iso).toISOString().slice(0, 16);
  };

  const fetchMaintenanceSetting = useCallback(async () => {
    if (!isMaintenanceAdmin) return;
    try {
      const res = await fetch("/api/maintenance", {
        headers: { "x-employee-id": MAINTENANCE_ADMIN },
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceSetting({
          isActive: data.isActive ?? false,
          startTime: toDatetimeLocal(data.startTime),
          endTime: toDatetimeLocal(data.endTime),
          message: data.message ?? "",
        });
      }
    } catch {
      // silently ignore
    }
  }, [isMaintenanceAdmin]);

  const saveMaintenance = async () => {
    setIsSavingMaintenance(true);
    if (maintenanceSaveMsgTimeoutRef.current)
      clearTimeout(maintenanceSaveMsgTimeoutRef.current);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-employee-id": MAINTENANCE_ADMIN,
        },
        body: JSON.stringify({
          isActive: maintenanceSetting.isActive,
          startTime: maintenanceSetting.startTime || null,
          endTime: maintenanceSetting.endTime || null,
          message: maintenanceSetting.message || null,
        }),
      });
      if (res.ok) {
        setMaintenanceSaveMsg({ type: "success", text: "บันทึกการตั้งค่าสำเร็จ" });
      } else {
        setMaintenanceSaveMsg({ type: "error", text: "บันทึกไม่สำเร็จ กรุณาลองใหม่" });
      }
    } catch {
      setMaintenanceSaveMsg({ type: "error", text: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
    } finally {
      setIsSavingMaintenance(false);
      maintenanceSaveMsgTimeoutRef.current = setTimeout(
        () => setMaintenanceSaveMsg(null),
        4000
      );
    }
  };

  // Cache for static data (categories, subcategories) — fetched once per session
  const staticDataRef = React.useRef<{
    categories: any[];
    subCategories: any[];
  } | null>(null);

  // Ref for success message timeout — cleared on unmount to prevent memory leak
  const successTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (maintenanceSaveMsgTimeoutRef.current)
        clearTimeout(maintenanceSaveMsgTimeoutRef.current);
    };
  }, []);


  const departmentList = useMemo(
    () => [...new Set(reports.map((r) => r.department))].sort(),
    [reports]
  );

  // Date range states
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [adminNote, setAdminNote] = useState("");

  // Image Viewer State
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Helper to check if file is image
  const isImageFile = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filename);
  };

  // Helper to detect Google Drive URL
  const isGoogleDriveUrl = (url: string) => url.includes("drive.google.com");

  // Helper to convert Drive URL to preview link for iframe
  // If webViewLink is "https://drive.google.com/file/d/ID/view?usp=drivesdk"
  // We want "https://drive.google.com/file/d/ID/preview" for iframe
  const getPreviewUrl = (url: string) => {
    try {
      if (isGoogleDriveUrl(url) && url.includes("/view")) {
        return url.replace(/\/view.*/, "/preview");
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  // Statistics — single pass over reports
  const stats = useMemo(() => {
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
          ppe++; ppe_safe += r.safeCount; ppe_unsafe += r.unsafeCount;
        } else if (cat === "การใช้อุปกรณ์ เครื่องมือ เครื่องจักร และยานพาหนะต่างๆ ในการทำงาน Tool / Equipment / Machine / Vehicle") {
          tools++; tools_safe += r.safeCount; tools_unsafe += r.unsafeCount;
        } else if (cat === "การกระทำที่ไม่ปลอดภัย และการจับชิ้นส่วน Unsafe Action / Driving / Line of fire") {
          unsafe_actions++; unsafe_actions_safe += r.safeCount; unsafe_actions_unsafe += r.unsafeCount;
        } else if (cat === "สภาพแวดล้อมที่ไม่ปลอดภัย Plant / Unsafe Condition (UC)") {
          unsafe_condition++; unsafe_condition_safe += r.safeCount; unsafe_condition_unsafe += r.unsafeCount;
        }
      }
    }

    return {
      total: reports.length,
      pending, approved, rejected, highPriority,
      totalSafeActions, totalUnsafeActions, todayReports,
      ppe, ppe_safe, ppe_unsafe,
      tools, tools_safe, tools_unsafe,
      unsafe_actions, unsafe_actions_safe, unsafe_actions_unsafe,
      unsafe_condition, unsafe_condition_safe, unsafe_condition_unsafe,
    };
  }, [reports]);

  // Toggle accordion
  const toggleAccordion = useCallback(
    (reportId: number) => {
      const newOpenAccordions = new Set(openAccordions);
      if (newOpenAccordions.has(reportId)) {
        newOpenAccordions.delete(reportId);
      } else {
        newOpenAccordions.add(reportId);
      }
      setOpenAccordions(newOpenAccordions);
    },
    [openAccordions]
  );

  const handleApprovalAction = useCallback(
    (action: "approve" | "reject", report: Report) => {
      setSelectedReport(report);
      setApprovalAction(action);
      setAdminNote("");
      setApprovalError(null);
      setIsApprovalModalOpen(true);
    },
    []
  );

  const closeApprovalModal = useCallback(() => {
    setIsApprovalModalOpen(false);
    setSelectedReport(null);
    setApprovalAction(null);
    setAdminNote("");
    setApprovalError(null);
  }, []);

  const clearDateRange = useCallback(() => {
    setDateRange({ from: undefined, to: undefined });
  }, []);

  const setQuickDateRange = useCallback((days: number) => {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - days);
    setDateRange({ from: fromDate, to: today });
  }, []);

  // Filter and Search
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    // Filter by department
    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (report) => report.department === departmentFilter
      );
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (report) => report.priority === priorityFilter
      );
    }

    // Filter by date range
    if (dateRange.from) {
      const fromDate = startOfDay(dateRange.from);
      filtered = filtered.filter((report) => {
        const reportDate = startOfDay(report.submittedDate);
        return isAfter(reportDate, fromDate) || isEqual(reportDate, fromDate);
      });
    }

    if (dateRange.to) {
      const toDate = endOfDay(dateRange.to);
      filtered = filtered.filter((report) => {
        const reportDate = endOfDay(report.submittedDate);
        return isBefore(reportDate, toDate) || isEqual(reportDate, toDate);
      });
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.employeeName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.safetyCategory
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.observedWork
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      // First sort by status (pending first)
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;

      // Then by priority
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Finally by submission date (newest first)
      return b.submittedDate.getTime() - a.submittedDate.getTime();
    });

    return filtered;
  }, [
    reports,
    statusFilter,
    departmentFilter,
    priorityFilter,
    searchTerm,
    dateRange,
  ]);

  const submitApprovalAction = async () => {
    if (!selectedReport || !approvalAction) return;

    setIsSubmittingApproval(true);

    try {
      const response = await fetch("/api/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Employee-Id": sheid || "",
          "X-Employee-Group": group || "",
        },
        body: JSON.stringify({
          recordId: selectedReport.recordId,
          status: approvalAction === "approve" ? "approved" : "rejected",
          adminNote: adminNote.trim() || null,
          approvedBy: sheid || "SHE",
        }),
      });

      const notificationResponse = await fetch("/api/notification-logs", {
        method: "POST",
        body: JSON.stringify({
          action: "approved",
          action_from: "SHE",
          notification_to: "5LD02067",
        }),
      });
      const notification = await notificationResponse.json();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update approval status"
        );
      }

      const result = await response.json();

      // อัพเดต local state
      const updatedReports = reports.map((report) => {
        if (report.id === selectedReport.id) {
          return {
            ...report,
            status:
              approvalAction === "approve"
                ? ("approved" as const)
                : ("rejected" as const),
            adminNote: adminNote.trim() || null,
            approvedDate: new Date(result.data.approvedDate),
            approvedBy: result.data.approvedBy,
          };
        }
        return report;
      });

      setReports(updatedReports);
      setIsApprovalModalOpen(false);
      setSelectedReport(null);
      setApprovalAction(null);
      setAdminNote("");

      // ✅ แสดง success message
      const actionText =
        approvalAction === "approve" ? "อนุมัติ" : "ไม่อนุมัติ";
      setSuccessMessage(`${actionText}รายงาน #${selectedReport.id} สำเร็จแล้ว`);

      // ซ่อน success message หลัง 3 วินาที
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("❌ Error updating approval status:", error);
      setApprovalError(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการอัพเดตสถานะ"
      );
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const exportToCSV = useCallback(() => {
    // สร้าง CSV header
    const headers = [
      "รหัสรายงาน",
      "วันที่ส่ง",
      "รหัสพนักงาน",
      "ชื่อพนักงาน",
      "แผนก",
      "กลุ่ม",
      "หมวดหมู่ความปลอดภัย",
      "หมวดหมู่ย่อย",
      "งานที่สังเกต",
      "แผนกที่สังเกต",
      "จำนวน Safe",
      "จำนวน Unsafe",
      "สถานะ",
      "ความสำคัญ",
      "รายการที่เลือก",
      "จำนวนไฟล์แนบ",
      "หมายเหตุผู้อนุมัติ",
      "วันที่อนุมัติ",
      "ผู้อนุมัติ",
    ];

    // สร้าง CSV data จาก filteredReports
    const csvData = filteredReports.map((report) => [
      report.id,
      format(report.submittedDate, "dd/MM/yyyy HH:mm"),
      report.employeeId,
      report.employeeName,
      report.department,
      report.group,
      report.safetyCategory,
      report.subCategory || "",
      report.observedWork,
      report.observedDepartment,
      report.safeCount,
      report.unsafeCount,
      getStatusInfo(report.status).label,
      getPriorityInfo(report.priority).label,
      report.selectedOptions.join("; "),
      report.attachment.length,
      report.adminNote || "",
      report.approvedDate
        ? format(report.approvedDate, "dd/MM/yyyy HH:mm")
        : "",
      report.approvedBy || "",
    ]);

    // รวม header กับ data
    const allData = [headers, ...csvData];

    // แปลงเป็น CSV string
    const csvContent = allData
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    // สร้าง filename ตามช่วงวันที่
    let filename = "BBS_Reports";
    if (dateRange.from && dateRange.to) {
      filename += `_${format(dateRange.from, "dd-MM-yyyy")}_to_${format(
        dateRange.to,
        "dd-MM-yyyy"
      )}`;
    } else if (dateRange.from) {
      filename += `_from_${format(dateRange.from, "dd-MM-yyyy")}`;
    }
    filename += ".csv";

    // Download file
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredReports, dateRange]);

  // Fetch data
  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: "record",
        year: selectedYear.toString(),
      });

      const cached = staticDataRef.current;

      // On first load: fetch records + static data in parallel
      // On subsequent loads (year change / refresh): fetch records only
      const fetchPromises: Promise<Response>[] = [
        fetch(`/api/get?${params.toString()}`),
        ...(cached
          ? []
          : [
              fetch("/api/get?type=category"),
              fetch("/api/get?type=subcategory"),
              fetch("/api/get?type=employee"),
            ]),
      ];

      const [recordResponse, ...staticResponses] = await Promise.all(fetchPromises);

      if (!recordResponse.ok) {
        const err = new Error("server") as Error & { status: number };
        err.status = recordResponse.status;
        throw err;
      }

      let categoryData: any[];
      let subCategoryData: any[];

      if (cached) {
        categoryData = cached.categories;
        subCategoryData = cached.subCategories;
      } else {
        const [catData, subCatData, empData] = await Promise.all(
          staticResponses.map((r) => r.json())
        );
        categoryData = catData;
        subCategoryData = subCatData;
        staticDataRef.current = { categories: catData, subCategories: subCatData };
        setEmployeeList(
          Array.isArray(empData)
            ? empData.map((emp: any) => ({
                ...emp,
                employeeId: emp.employeerId || emp.employeeId || "",
                employeeName: emp.fullName || emp.employeeName || "",
              }))
            : []
        );
      }

      const apiData = await recordResponse.json();
      setReports(transformApiDataToDashboardReport(apiData ?? [], categoryData, subCategoryData));
    } catch (error) {
      console.error("Error fetching reports:", error);
      if (error instanceof TypeError) {
        setError("CONNECTION_FAILED");
      } else if (error instanceof Error && (error as any).status >= 500) {
        setError("DB_ERROR");
      } else {
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const STORAGE_KEY = "bbs_employee_data";

  const loadFromLocalStorage = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // โหลดข้อมูลจาก localStorage เท่านั้น
      const employeeData = loadFromLocalStorage();

      if (employeeData) {
        const {
          employeerId = "",
          fullName = "",
          department = "",
          group = "",
          position = "",
        } = employeeData;

        // ตั้งค่า state
        setSheid(employeerId);
        setEmployeeId(employeerId);
        setEmployeeName(fullName);
        setDepartment(department);
        setGroup(group);

        // fetch ข้อมูลรายงาน
        fetchReports();
      } else {
        console.warn("No employee data found in localStorage");
      }
    }
  }, []);

  // Fetch maintenance settings once sheid is available (admin only)
  useEffect(() => {
    if (sheid === MAINTENANCE_ADMIN) {
      fetchMaintenanceSetting();
    }
  }, [sheid, fetchMaintenanceSetting]);

  // Re-fetch when year changes (skip first mount — handled by the effect above)
  const isFirstMount = React.useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchReports();
  }, [selectedYear]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/img/ith.png"
                alt="ITH Logo"
                width={60}
                height={60}
                className="rounded-lg hidden md:flex"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  จัดการรายงานความปลอดภัย
                </h1>
                <p className="text-gray-600">
                  ระบบอนุมัติรายงานการสังเกตความปลอดภัย
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 justify-center items-center space-x-2">
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: new Date().getFullYear() - 2022 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year + 543} ({year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => fetchReports()}
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? "กำลังโหลด..." : "รีเฟรช"}
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push(`/`);
                  }}
                >
                  <House className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams({
                      employeeId: employeeId || "",
                      fullName: employeeName || "",
                      department: department || "",
                      group: group || "",
                    }).toString();
                    router.push(`/manageusers?${params}`);
                  }}
                >
                  <UserRoundCog className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          <TabsList className={`grid w-full ${isMaintenanceAdmin ? "grid-cols-4" : "grid-cols-3"}`}>
            <TabsTrigger value="reports">รายงานทั้งหมด</TabsTrigger>
            <TabsTrigger value="analytics">สถิติและรายงาน</TabsTrigger>
            <TabsTrigger value="payroll">การจ่ายเงิน</TabsTrigger>
            {isMaintenanceAdmin && (
              <TabsTrigger value="system">จัดการระบบ</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            {/* Statistics Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
                            <div className="h-8 bg-gray-200 rounded w-12"></div>
                          </div>
                          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          รอการอนุมัติ
                        </p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {stats.pending}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          อนุมัติแล้ว
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.approved}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          วันนี้
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.todayReports}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          รายงานทั้งหมด
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.total}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* เพิ่มสรุปสำหรับหัวข้อรายงานหลัก 4 หัวข้อ */}
                <Card>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-full md:w-3/4">
                        <div className="flex items-center gap-2 justify-between w-full">
                          <p className="text-sm font-medium text-gray-600">
                            PPE
                          </p>
                          <div className="h-12 w-12  md:hidden  bg-orange-100 rounded-full flex items-center justify-center">
                            <HardHat className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                        <div className="flex flex-col mt-4 md:mt-0">
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.ppe}
                          </p>
                          <div className="flex flex-col mt-4 md:mt-0">
                            <p className="text-sm text-green-600">
                              Safe Act. : {stats.ppe_safe}
                            </p>
                            <p className="text-sm text-red-600">
                              UnSafe Act. : {stats.ppe_unsafe}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-12 w-12 hidden md:flex bg-orange-100 rounded-full flex items-center justify-center">
                        <HardHat className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-full md:w-3/4">
                        <div className="flex items-center gap-2 justify-between w-full">
                          <p className="text-sm font-medium text-gray-600">
                            Tools
                          </p>
                          <div className="h-12 w-12 md:hidden bg-gray-100 rounded-full flex items-center justify-center">
                            <Wrench className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex flex-col mt-4 md:mt-0">
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.tools}
                          </p>
                          <div className="flex flex-col mt-4 md:mt-0">
                            <p className="text-sm text-green-600">
                              Safe Act. : {stats.tools_safe}
                            </p>
                            <p className="text-sm text-red-600">
                              UnSafe Act. : {stats.tools_unsafe}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-12 w-12 hidden md:flex bg-gray-100 rounded-full flex items-center justify-center">
                        <Wrench className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-full md:w-3/4">
                        <div className="flex items-center gap-2 justify-between w-full">
                          <p className="text-sm font-medium text-gray-600">
                            Unsafe Action
                          </p>
                          <div className="h-12 w-12 md:hidden bg-green-100 rounded-full flex items-center justify-center">
                            <Bike className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                        <div className="flex flex-col mt-4 md:mt-0">
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.unsafe_actions}
                          </p>
                          <div className="flex flex-col mt-4 md:mt-0">
                            <p className="text-sm text-green-600">
                              Safe Act. : {stats.unsafe_actions_safe}
                            </p>
                            <p className="text-sm text-red-600">
                              UnSafe Act. : {stats.unsafe_actions_unsafe}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-12 w-12 hidden md:flex bg-green-100 rounded-full flex items-center justify-center">
                        <Bike className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-full md:w-3/4">
                        <div className="flex items-center gap-2 justify-between w-full">
                          <p className="text-sm font-medium text-gray-600">
                            Unsafe Condition
                          </p>
                          <div className="h-12 w-12 md:hidden bg-blue-100 rounded-full flex items-center justify-center">
                            <ReceiptText className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex flex-col mt-4 md:mt-0">
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.unsafe_condition}
                          </p>
                          <div className="flex flex-col mt-4 md:mt-0">
                            <p className="text-sm text-green-600">
                              Safe Act. : {stats.unsafe_condition_safe}
                            </p>
                            <p className="text-sm text-red-600">
                              UnSafe Act. : {stats.unsafe_condition_unsafe}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-12 w-12 hidden md:flex bg-blue-100 rounded-full flex items-center justify-center">
                        <ReceiptText className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card>
              <Collapsible>
                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    ตัวกรองและการค้นหา
                  </CardTitle>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                      <ChevronDown className="h-4 w-4" />
                      <span className="sr-only">Toggle filters</span>
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent className="px-4 pb-4">
                  <div className="flex flex-col gap-4">
                    {/* First row: Search and basic filters */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="ค้นหาพนักงาน, รหัส, หรือรายงาน..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="w-full lg:w-48">
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger>
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="กรองตามสถานะ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            <SelectItem value="pending">
                              รอการอนุมัติ
                            </SelectItem>
                            <SelectItem value="approved">
                              อนุมัติแล้ว
                            </SelectItem>
                            <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full lg:w-48">
                        <Select
                          value={departmentFilter}
                          onValueChange={setDepartmentFilter}
                        >
                          <SelectTrigger>
                            <Building2 className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="แผนก" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">ทุกแผนก</SelectItem>
                            {/* ✅ แก้ไขให้ถูกต้อง */}
                            {departmentList.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full lg:w-48">
                        {/* <Select
                        value={priorityFilter}
                        onValueChange={setPriorityFilter}
                      >
                        <SelectTrigger>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="ความสำคัญ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">ทุกระดับ</SelectItem>
                          <SelectItem value="high">สูง</SelectItem>
                          <SelectItem value="normal">ปกติ</SelectItem>
                          <SelectItem value="low">ต่ำ</SelectItem>
                        </SelectContent>
                      </Select> */}
                      </div>
                    </div>

                    {/* Second row: Date range picker */}
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-1">
                        <Popover
                          open={isDatePickerOpen}
                          onOpenChange={setIsDatePickerOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange.from && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                                    {format(dateRange.to, "dd/MM/yyyy")}
                                  </>
                                ) : (
                                  format(dateRange.from, "dd/MM/yyyy")
                                )
                              ) : (
                                "เลือกช่วงวันที่"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3 border-b bg-gray-50">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                เลือกช่วงเวลา
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setQuickDateRange(7);
                                    setIsDatePickerOpen(false);
                                  }}
                                  className="text-xs"
                                >
                                  7 วันที่แล้ว
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setQuickDateRange(30);
                                    setIsDatePickerOpen(false);
                                  }}
                                  className="text-xs"
                                >
                                  30 วันที่แล้ว
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setQuickDateRange(90);
                                    setIsDatePickerOpen(false);
                                  }}
                                  className="text-xs"
                                >
                                  3 เดือนที่แล้ว
                                </Button>
                              </div>
                            </div>
                            <div className="p-3">
                              <CustomCalendar
                                mode="range"
                                selected={dateRange}
                                onSelect={(newDateRange) => {
                                  setDateRange(newDateRange);
                                  // ปิด popover เมื่อเลือกวันที่ครบแล้ว (มีทั้ง from และ to)
                                  if (newDateRange?.from && newDateRange?.to) {
                                    setIsDatePickerOpen(false);
                                  }
                                }}
                                numberOfMonths={1}
                                className="rounded-md"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Clear date range button */}
                      {(dateRange.from || dateRange.to) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearDateRange}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          ล้างวันที่
                        </Button>
                      )}

                      <Button
                        onClick={exportToCSV}
                        disabled={filteredReports.length === 0}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Export ({filteredReports.length})
                      </Button>

                      {/* Show filtered results count */}
                      <div className="text-sm text-gray-600 whitespace-nowrap flex items-center gap-2">
                        <span>
                          แสดง {filteredReports.length} จาก {reports.length}{" "}
                          รายการ
                        </span>
                        {(statusFilter !== "all" ||
                          departmentFilter !== "all" ||
                          searchTerm ||
                          dateRange.from) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setStatusFilter("all");
                              setDepartmentFilter("all");
                              setSearchTerm("");
                              setDateRange({ from: undefined, to: undefined });
                            }}
                            className="h-auto p-0 text-red-500 hover:text-red-600 hover:bg-transparent"
                          >
                            ล้างตัวกรอง
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Reports List */}
            <div className="space-y-2 overflow-auto h-[60dvh] md:h-[calc(100vh-320px)] pr-1">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
              ) : filteredReports.length === 0 ? (
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
                  {filteredReports.map((report) => {
                    const statusInfo = getStatusInfo(report.status);
                    // ... rest of map code ...
                    const priorityInfo = getPriorityInfo(report.priority);
                    const StatusIcon = statusInfo.icon;
                    const isOpen = openAccordions.has(report.id);

                    return (
                      <Card
                        key={report.id}
                        className="hover:shadow-md transition-shadow border-l-4 border-l-transparent data-[status=pending]:border-l-yellow-400 data-[status=approved]:border-l-green-500 data-[status=rejected]:border-l-red-500"
                        data-status={report.status}
                      >
                        <Collapsible
                          open={isOpen}
                          onOpenChange={() => toggleAccordion(report.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <CardContent className="p-3 md:p-4 cursor-pointer hover:bg-gray-50">
                              <div className="flex flex-col gap-2">
                                {/* Header: ID, Status, Date */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">
                                      #{report.id}
                                    </span>
                                    <Badge
                                      className={cn(
                                        "hidden md:flex",
                                        statusInfo.color
                                      )}
                                    >
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {statusInfo.label}
                                    </Badge>
                                    <Badge
                                      className={cn(
                                        "md:hidden text-[10px] px-1.5 h-5",
                                        statusInfo.color
                                      )}
                                    >
                                      {statusInfo.label}
                                    </Badge>
                                    {report.priority === "high" && (
                                      <Badge
                                        variant="outline"
                                        className="text-red-600 border-red-200 text-[10px] h-5 px-1.5"
                                      >
                                        สำคัญ
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">
                                      {format(
                                        report.submittedDate,
                                        "dd/MM/yy HH:mm"
                                      )}
                                    </span>
                                    {isOpen ? (
                                      <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>

                                {/* Content Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start md:items-center">
                                  {/* Employee Info */}
                                  <div className="md:col-span-4">
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 uppercase">
                                        {report.employeeName.substring(0, 2)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                          {report.employeeName}
                                        </p>
                                        <p className="text-xs text-gray-500 line-clamp-1">
                                          {report.department}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Category (Desktop) */}
                                  <div className="hidden md:block md:col-span-4">
                                    <p
                                      className="text-sm text-gray-600 line-clamp-1"
                                      title={report.safetyCategory}
                                    >
                                      {report.safetyCategory}
                                    </p>
                                  </div>

                                  {/* Counts */}
                                  <div className="md:col-span-2 flex items-center gap-3 text-sm">
                                    <div
                                      className="flex items-center gap-1.5"
                                      title="Safe Actions"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      <span className="font-medium text-gray-700">
                                        {report.safeCount}
                                      </span>
                                    </div>
                                    <div
                                      className="flex items-center gap-1.5"
                                      title="Unsafe Actions"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      <span className="font-medium text-gray-700">
                                        {report.unsafeCount}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div
                                    className="md:col-span-2 flex items-center justify-end gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {report.status === "pending" && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApprovalAction(
                                              "approve",
                                              report
                                            );
                                          }}
                                          title="อนุมัติ"
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApprovalAction(
                                              "reject",
                                              report
                                            );
                                          }}
                                          title="ไม่อนุมัติ"
                                        >
                                          <Ban className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedReport(report);
                                      }}
                                      title="ดูรายละเอียด"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Mobile Category */}
                                <div className="md:hidden text-xs text-gray-500 line-clamp-1 mt-1">
                                  {report.safetyCategory}
                                </div>
                              </div>
                            </CardContent>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <CardContent className="pt-4 pb-4 px-4 bg-gray-50/50 border-t">
                              <div className="pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      หมวดหมู่ความปลอดภัย
                                    </p>
                                    <p className="font-medium text-sm">
                                      {report.safetyCategory}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      งานที่สังเกต
                                    </p>
                                    <p className="font-medium">
                                      {report.observedWork}
                                    </p>
                                  </div>
                                  {report.subCategory && (
                                    <div className="md:col-span-2">
                                      <p className="text-sm text-gray-600">
                                        หมวดหมู่ย่อย
                                      </p>
                                      <p className="font-medium text-sm">
                                        {report.subCategory}
                                      </p>
                                    </div>
                                  )}
                                  <div className="md:col-span-2">
                                    <p className="text-sm text-gray-600">
                                      รายการที่เลือก
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {report.selectedOptions.map(
                                        (option, index) => (
                                          <Badge
                                            key={index}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {option}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      ไฟล์แนบ
                                    </p>
                                    <p className="font-medium text-blue-600">
                                      {report.attachment.length} ไฟล์
                                    </p>
                                  </div>
                                </div>

                                {report.status === "approved" &&
                                  report.approvedDate && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                                      <p className="text-sm text-green-800">
                                        <strong>อนุมัติเมื่อ:</strong>{" "}
                                        {format(
                                          report.approvedDate,
                                          "dd MMMM yyyy HH:mm",
                                          { locale: th }
                                        )}
                                      </p>
                                      <p className="text-sm text-green-800">
                                        <strong>อนุมัติโดย:</strong>{" "}
                                        {report.approvedBy}
                                      </p>
                                      {report.adminNote && (
                                        <p className="text-sm text-green-800 mt-1">
                                          <strong>หมายเหตุ:</strong>{" "}
                                          {report.adminNote}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                {report.status === "rejected" &&
                                  report.adminNote && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                                      <p className="text-sm text-red-800">
                                        <strong>เหตุผลที่ไม่อนุมัติ:</strong>{" "}
                                        {report.adminNote}
                                      </p>
                                      <p className="text-sm text-red-800">
                                        <strong>โดย:</strong>{" "}
                                        {report.approvedBy} เมื่อ{" "}
                                        {report.approvedDate &&
                                          format(
                                            report.approvedDate,
                                            "dd/MM/yyyy HH:mm"
                                          )}
                                      </p>
                                    </div>
                                  )}

                                {report.status === "pending" && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                                    <p className="text-sm text-yellow-800">
                                      🕐 รายงานนี้รอการพิจารณาอนุมัติ
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    );
                  })}

                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Content */}
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
                        <span className="text-sm font-medium">
                          {stats.approved}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        รอการอนุมัติ
                      </span>
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
                        <span className="text-sm font-medium">
                          {stats.pending}
                        </span>
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
                        <span className="text-sm font-medium">
                          {stats.rejected}
                        </span>
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
                        <p className="font-semibold text-green-600">
                          Safe Actions
                        </p>
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
                        <p className="font-semibold text-red-600">
                          Unsafe Actions
                        </p>
                        <p className="text-sm text-gray-600">
                          พฤติกรรมไม่ปลอดภัย
                        </p>
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
                    {departmentList.length > 0 ? (
                      departmentList
                        .slice(0, 5)
                        .map((dept) => {
                          const count = reports.filter(
                            (r) => r.department === dept
                          ).length;
                          if (count === 0) return null; // ไม่แสดงแผนกที่ไม่มีข้อมูล
                          return (
                            <div
                              key={dept}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm text-gray-600">
                                {dept}
                              </span>
                              <span className="text-sm font-medium">
                                {count} รายการ
                              </span>
                            </div>
                          );
                        })
                        .filter(Boolean) // กรอง null ออก
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
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <Card className="py-4 px-0 md:p-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>รายงานการจ่ายเงิน BBS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4 px-2 md:p-6">
                <PayrollReportSummary
                  reports={reports}
                  employeeList={employeeList}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* =================== Maintenance Tab (3ST19686 only) =================== */}
          {isMaintenanceAdmin && (
            <TabsContent value="system" className="space-y-4">
              <Card className="py-4 px-0 md:p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span>ตั้งค่าการปิดปรับปรุงระบบ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">สถานะระบบ</p>
                      <p className="text-sm text-gray-500">
                        {maintenanceSetting.isActive
                          ? "ระบบปิดปรับปรุง — ผู้ใช้จะเห็นหน้าแจ้งซ่อมบำรุง"
                          : "ระบบเปิดใช้งานปกติ"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setMaintenanceSetting((prev) => ({
                          ...prev,
                          isActive: !prev.isActive,
                        }))
                      }
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                        maintenanceSetting.isActive
                          ? "bg-orange-500"
                          : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          maintenanceSetting.isActive
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Time range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        เวลาเริ่มต้น
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={maintenanceSetting.startTime.slice(0, 10)}
                          onChange={(e) =>
                            setMaintenanceSetting((prev) => ({
                              ...prev,
                              startTime: e.target.value + (prev.startTime.slice(10) || "T00:00"),
                            }))
                          }
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="HH:mm"
                          maxLength={5}
                          value={maintenanceSetting.startTime.slice(11, 16)}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                            const formatted = digits.length > 2 ? digits.slice(0, 2) + ":" + digits.slice(2) : digits;
                            setMaintenanceSetting((prev) => ({
                              ...prev,
                              startTime: (prev.startTime.slice(0, 10) || new Date().toISOString().slice(0, 10)) + "T" + formatted,
                            }));
                          }}
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        เวลาสิ้นสุด
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={maintenanceSetting.endTime.slice(0, 10)}
                          onChange={(e) =>
                            setMaintenanceSetting((prev) => ({
                              ...prev,
                              endTime: e.target.value + (prev.endTime.slice(10) || "T00:00"),
                            }))
                          }
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="HH:mm"
                          maxLength={5}
                          value={maintenanceSetting.endTime.slice(11, 16)}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                            const formatted = digits.length > 2 ? digits.slice(0, 2) + ":" + digits.slice(2) : digits;
                            setMaintenanceSetting((prev) => ({
                              ...prev,
                              endTime: (prev.endTime.slice(0, 10) || new Date().toISOString().slice(0, 10)) + "T" + formatted,
                            }));
                          }}
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom message */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      ข้อความแจ้งผู้ใช้{" "}
                      <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                    </label>
                    <Textarea
                      value={maintenanceSetting.message}
                      onChange={(e) =>
                        setMaintenanceSetting((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder="เช่น กำลังอัปเดตระบบฐานข้อมูล คาดว่าจะแล้วเสร็จภายใน 2 ชั่วโมง"
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Save feedback */}
                  {maintenanceSaveMsg && (
                    <div
                      className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${
                        maintenanceSaveMsg.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {maintenanceSaveMsg.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      {maintenanceSaveMsg.text}
                    </div>
                  )}

                  {/* Save button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={saveMaintenance}
                      disabled={isSavingMaintenance}
                      className="bg-orange-500 hover:bg-orange-600 min-w-[120px]"
                    >
                      {isSavingMaintenance ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        "บันทึกการตั้งค่า"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Approval/Rejection Modal */}
      <Dialog
        open={isApprovalModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeApprovalModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {approvalAction === "approve" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>อนุมัติรายงาน</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>ไม่อนุมัติรายงาน</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              รายงาน #{selectedReport?.id} - {selectedReport?.employeeName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">ข้อมูลรายงาน</h4>
              <div className="text-sm space-y-1">
                <p>
                  <strong>พนักงาน:</strong> {selectedReport?.employeeName} (
                  {selectedReport?.employeeId})
                </p>
                <p>
                  <strong>แผนก:</strong> {selectedReport?.department}
                </p>
                <p>
                  <strong>งานที่สังเกต:</strong> {selectedReport?.observedWork}
                </p>
                <p>
                  <strong>Safe/Unsafe:</strong> {selectedReport?.safeCount}/
                  {selectedReport?.unsafeCount}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {approvalAction === "approve"
                  ? "หมายเหตุการอนุมัติ (ไม่บังคับ)"
                  : "เหตุผลที่ไม่อนุมัติ (บังคับ)"}
              </label>
              <Textarea
                placeholder={
                  approvalAction === "approve"
                    ? "เช่น รายงานดีมาก มีรายละเอียดครบถ้วน"
                    : "เช่น ขาดรายละเอียดในการอธิบาย กรุณาส่งใหม่"
                }
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {approvalError && (
            <div className="px-1 pb-2">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {approvalError}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeApprovalModal()}
              disabled={isSubmittingApproval}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={submitApprovalAction}
              disabled={
                (approvalAction === "reject" && !adminNote.trim()) ||
                isSubmittingApproval
              }
              className={
                approvalAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isSubmittingApproval ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังประมวลผล...
                </>
              ) : approvalAction === "approve" ? (
                "อนุมัติ"
              ) : (
                "ไม่อนุมัติ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog
        open={!!viewingImage}
        onOpenChange={(open) => !open && setViewingImage(null)}
      >
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex justify-between items-center">
              <span>รูปภาพแนบ</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-black/5 flex items-center justify-center p-4">
            {viewingImage && (
              <div className="relative w-full h-full flex items-center justify-center">
                {isGoogleDriveUrl(viewingImage) ? (
                  <iframe
                    src={getPreviewUrl(viewingImage)}
                    className="w-full h-full rounded shadow-sm border-0"
                    allow="autoplay"
                    title="File Preview"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewingImage}
                    alt="ไฟล์แนบ"
                    className="max-w-full max-h-full object-contain rounded shadow-sm"
                  />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Detail Modal */}
      {selectedReport && !isApprovalModalOpen && (
        <div className="fixed inset-0 bg-[#00000094] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  รายละเอียดรายงาน #{selectedReport.id}
                </h2>
                <Button variant="ghost" onClick={() => setSelectedReport(null)}>
                  <p className="text-xl">✕</p>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">ข้อมูลพนักงาน</h3>
                    <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                      <p>
                        <strong>ชื่อ:</strong> {selectedReport.employeeName}
                      </p>
                      <p>
                        <strong>รหัส:</strong> {selectedReport.employeeId}
                      </p>
                      <p>
                        <strong>แผนก:</strong> {selectedReport.department}
                      </p>
                      <p>
                        <strong>กลุ่ม:</strong> {selectedReport.group}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">ข้อมูลการสังเกต</h3>
                    <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                      <p>
                        <strong>วันที่:</strong>{" "}
                        {format(selectedReport.date, "dd MMMM yyyy", {
                          locale: th,
                        })}
                      </p>
                      <p>
                        <strong>งานที่สังเกต:</strong>{" "}
                        {selectedReport.observedWork}
                      </p>
                      <p>
                        <strong>แผนกที่ถูกสังเกต:</strong>{" "}
                        {selectedReport.observedDepartment}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">หมวดหมู่ความปลอดภัย</h3>
                    <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                      <p>
                        <strong>หมวดหมู่หลัก:</strong>{" "}
                        {selectedReport.safetyCategory}
                      </p>
                      {selectedReport.subCategory && (
                        <p>
                          <strong>หมวดหมู่ย่อย:</strong>{" "}
                          {selectedReport.subCategory}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">รายการที่เลือก</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex flex-wrap gap-1">
                        {selectedReport.selectedOptions.map((option, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs !text-wrap"
                          >
                            {option === "8. อื่นๆ"
                              ? "อื่นๆ: " + selectedReport.other
                              : option}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">ผลการสังเกต</h3>
                    <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                      <p>
                        <strong className="text-green-600">
                          Safe Actions:
                        </strong>{" "}
                        {selectedReport.safeCount} คน
                        {selectedReport.actionType != ""
                          ? " และได้ดำเนินการ "
                          : ""}{" "}
                        <strong className="text-green-600">
                          {" "}
                          {selectedReport.actionType}
                        </strong>
                      </p>

                      <p>
                        <strong className="text-red-600">
                          Unsafe Actions:
                        </strong>{" "}
                        {selectedReport.unsafeCount} คน
                        {selectedReport.actionTypeunsafe != ""
                          ? " และได้ดำเนินการ "
                          : ""}{" "}
                        <strong className="text-red-600">
                          {" "}
                          {selectedReport.actionTypeunsafe}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-2">ไฟล์แนบ</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    มีไฟล์แนบทั้งหมด {selectedReport.attachment.length} ไฟล์
                  </p>
                  <div className="mt-2 space-y-2">
                    {selectedReport.attachment.map((file, index) => {
                      const isImg = isImageFile(file.name);
                      return (
                        <div key={index} className="flex items-center gap-2">
                          {isImg ? (
                            <button
                              onClick={() => setViewingImage(file.webViewLink)}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1 text-left"
                            >
                              <div className="w-4 h-4 overflow-hidden relative mr-1">
                                <Image
                                  className="object-cover"
                                  src="/icons/image.png"
                                  alt="img"
                                  width={16}
                                  height={16}
                                  onError={(e) => {
                                    // Fallback icon if image.png missing, using lucid-react Image icon
                                    // But we are in a map, keeping it simple
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                {/* Fallback svg if image fails to load or just use standard icon */}
                              </div>
                              📎 {file.name} (คลิกเพื่อดูรูป)
                            </button>
                          ) : (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline cursor-pointer flex items-center"
                            >
                              📎 {file.name}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selectedReport.status !== "pending" && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">ข้อมูลการอนุมัติ</h3>
                  <div
                    className={cn(
                      "p-3 rounded border",
                      selectedReport.status === "approved"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    )}
                  >
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>สถานะ:</strong>{" "}
                        {getStatusInfo(selectedReport.status).label}
                        {selectedReport.status === "rejected" && (
                          <span className="text-gray-500 ml-2">
                            ({selectedReport.comment})
                          </span>
                        )}
                      </p>
                      {selectedReport.approvedDate && (
                        <p>
                          <strong>วันที่:</strong>{" "}
                          {format(
                            selectedReport.approvedDate,
                            "dd MMMM yyyy HH:mm",
                            { locale: th }
                          )}
                        </p>
                      )}
                      {selectedReport.approvedBy && (
                        <p>
                          <strong>อนุมัติโดย:</strong>{" "}
                          {selectedReport.approvedBy}
                        </p>
                      )}
                      {selectedReport.adminNote && (
                        <p>
                          <strong>หมายเหตุ:</strong> {selectedReport.adminNote}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.status === "pending" && (
                <div className="mt-6 flex space-x-4">
                  <Button
                    onClick={() =>
                      handleApprovalAction("approve", selectedReport)
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    อนุมัติ
                  </Button>
                  <Button
                    onClick={() =>
                      handleApprovalAction("reject", selectedReport)
                    }
                    // variant="destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    ไม่อนุมัติ
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
