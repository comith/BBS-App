//dashboard/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  Settings,
  House,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Custom Calendar Component
type CustomCalendarProps = {
  mode: "range" | "single";
  selected: { from?: Date; to?: Date } | Date | undefined;
  onSelect: (value: any) => void;
  numberOfMonths?: number;
  className?: string;
  [key: string]: any;
};

const CustomCalendar = ({
  mode,
  selected,
  onSelect,
  numberOfMonths = 1,
  className,
  ...props
}: CustomCalendarProps) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  interface GetDaysInMonth {
    (date: Date): number;
  }

  const getDaysInMonth: GetDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  interface GetFirstDayOfMonth {
    (date: Date): number;
  }

  const getFirstDayOfMonth: GetFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  interface DateRange {
    from?: Date;
    to?: Date;
  }

  const isDateInRange = (date: Date): boolean => {
    if (!selected || typeof selected !== "object") return false;
    if ("from" in selected) {
      const range = selected as DateRange;
      if (!range.from) return false;
      if (mode === "range" && range.from && range.to) {
        return date >= range.from && date <= range.to;
      }
      return range.from && date.getTime() === range.from.getTime();
    }
    return false;
  };

  interface IsDateRangeStart {
    (date: Date): boolean;
  }

  const isDateRangeStart: IsDateRangeStart = (date) => {
    if (
      selected &&
      typeof selected === "object" &&
      "from" in selected &&
      selected.from
    ) {
      return date.getTime() === selected.from.getTime();
    }
    return false;
  };

  interface IsDateRangeEnd {
    (date: Date): boolean;
  }

  const isDateRangeEnd: IsDateRangeEnd = (date) => {
    return selected &&
      typeof selected === "object" &&
      "to" in selected &&
      selected.to
      ? date.getTime() === selected.to.getTime()
      : false;
  };

  interface RangeSelected {
    from?: Date;
    to?: Date;
  }

  type HandleDateClick = (date: Date) => void;

  const handleDateClick: HandleDateClick = (date) => {
    if (mode === "range") {
      const range = selected as RangeSelected | undefined;
      if (!range?.from || (range.from && range.to)) {
        onSelect({ from: date, to: undefined });
      } else if (range.from && !range.to) {
        if (date < range.from) {
          onSelect({ from: date, to: range.from });
        } else {
          onSelect({ from: range.from, to: date });
        }
      }
    } else {
      onSelect(date);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isInRange = isDateInRange(date);
      const isRangeStart = isDateRangeStart(date);
      const isRangeEnd = isDateRangeEnd(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={cn(
            "h-9 w-9 rounded-md text-sm font-normal transition-colors hover:bg-gray-100",
            isInRange && "bg-orange-100 text-orange-900",
            (isRangeStart || isRangeEnd) &&
              "bg-orange-500 text-white hover:bg-orange-600",
            isToday && !isInRange && "bg-gray-200 font-medium",
            "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

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

  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="h-8 w-8 rounded-md border hover:bg-gray-100 flex items-center justify-center"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          onClick={nextMonth}
          className="h-8 w-8 rounded-md border hover:bg-gray-100 flex items-center justify-center"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="h-9 w-9 flex items-center justify-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
    </div>
  );
};

interface ApiReport {
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
  status: string;
  // ✅ เพิ่ม fields ใหม่สำหรับ approval data
  adminNote?: string;
  approvedDate?: string;
  approvedBy?: string;
}

interface Report {
  id: number;
  recordId: string; // ✅ เพิ่มฟิลด์นี้
  date: Date;
  employeeId: string;
  employeeName: string;
  department: string;
  group: string;
  safetyCategory: string;
  subCategory: string | null;
  observedWork: string;
  observedDepartment: string;
  status: "approved" | "pending" | "rejected";
  safeCount: number;
  unsafeCount: number;
  selectedOptions: string[];
  attachment: Array<{
    id: string;
    name: string;
    webViewLink: string;
  }>;
  adminNote: string | null;
  approvedDate: Date | null;
  approvedBy: string | null;
  submittedDate: Date;
  priority: "low" | "normal" | "high";
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "approved":
      return {
        label: "อนุมัติแล้ว",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle2,
        textColor: "text-green-600",
      };
    case "pending":
      return {
        label: "รอการอนุมัติ",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        textColor: "text-yellow-600",
      };
    case "rejected":
      return {
        label: "ไม่อนุมัติ",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        textColor: "text-red-600",
      };
    default:
      return {
        label: "ไม่ทราบสถานะ",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: AlertCircle,
        textColor: "text-gray-600",
      };
  }
};

const getPriorityInfo = (priority: string) => {
  switch (priority) {
    case "high":
      return {
        label: "สูง",
        color: "bg-red-100 text-red-800",
        textColor: "text-red-600",
      };
    case "normal":
      return {
        label: "ปกติ",
        color: "bg-blue-100 text-blue-800",
        textColor: "text-blue-600",
      };
    case "low":
      return {
        label: "ต่ำ",
        color: "bg-gray-100 text-gray-800",
        textColor: "text-gray-600",
      };
    default:
      return {
        label: "ปกติ",
        color: "bg-blue-100 text-blue-800",
        textColor: "text-blue-600",
      };
  }
};

const transformApiDataToDashboardReport = (
  apiData: ApiReport[],
  categories: any[],
  subCategories: any[]
): Report[] => {
  return apiData.map((item, index) => {
    // หา category name จาก ID
    const category = categories.find(
      (cat) => cat.id === parseInt(item.safetycategory_id)
    );
    const subCategory = subCategories.find(
      (sub) => sub.id === parseInt(item.sub_safetycategory_id)
    );

    // กำหนด priority จาก unsafe count
    let priority: "low" | "normal" | "high" = "normal";
    if (item.unsafeActionCount >= 3) {
      priority = "high";
    } else if (item.unsafeActionCount === 0) {
      priority = "low";
    }

    // แปลง selectedOptions
    const selectedOptionsArray = Array.isArray(item.selectedOptions)
      ? item.selectedOptions.map((opt) =>
          typeof opt === "string" ? opt : opt.name || "ไม่ระบุ"
        )
      : [];

    // ส่งค่าไฟล์แนบเป็นอาเรย์ของอ็อบเจกต์
    const attachmentArray = Array.isArray(item.attachment)
      ? item.attachment.map((file) => {
          if (typeof file === "string") {
            return { id: "", name: file, webViewLink: "" };
          }
          return {
            id: file.id || "",
            name: file.name || "ไม่ระบุ",
            webViewLink: file.webViewLink || "",
          };
        })
      : [];

    return {
      id: index + 1,
      recordId: item.record_id, // ✅ ใช้ recordId จริงจาก API
      date: new Date(item.date),
      employeeId: item.employee_id,
      employeeName: item.fullname,
      department: item.depart,
      group: item.group,
      safetyCategory:
        category?.name || `Category ID: ${item.safetycategory_id}`,
      subCategory: subCategory?.name || null,
      observedWork: item.observed_Work || "ไม่ระบุ",
      observedDepartment: item.department_notice || item.group || "ไม่ระบุ",
      status:
        item.status && item.status.trim() !== ""
          ? (item.status as "approved" | "pending" | "rejected")
          : "pending",
      safeCount: Number(item.safeActionCount) || 0,
      unsafeCount: Number(item.unsafeActionCount) || 0,
      selectedOptions: selectedOptionsArray,
      attachment: attachmentArray,
      adminNote: item.adminNote || null,
      approvedDate: item.approvedDate ? new Date(item.approvedDate) : null,
      approvedBy: item.approvedBy || null,
      submittedDate: new Date(item.date),
      priority: priority,
    };
  });
};

function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  // Removed duplicate filteredReports state, use useMemo version below
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("reports");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const sheid = searchParams.get("employeeId");
  const employeeId = searchParams.get("employeeId");
  const employeeName = searchParams.get("fullName");
  const depatment = searchParams.get("department");
  const group = searchParams.get("group");

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

  // Approval modal states
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [adminNote, setAdminNote] = useState("");

  // Statistics
  const stats = useMemo(
    () => ({
      total: reports.length,
      pending: reports.filter((r) => r.status === "pending").length,
      approved: reports.filter((r) => r.status === "approved").length,
      rejected: reports.filter((r) => r.status === "rejected").length,
      highPriority: reports.filter(
        (r) => r.priority === "high" && r.status === "pending"
      ).length,
      totalSafeActions: reports.reduce((sum, r) => sum + r.safeCount, 0),
      totalUnsafeActions: reports.reduce((sum, r) => sum + r.unsafeCount, 0),
      todayReports: reports.filter(
        (r) =>
          startOfDay(r.submittedDate).getTime() ===
          startOfDay(new Date()).getTime()
      ).length,
    }),
    [reports]
  );

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
      setIsApprovalModalOpen(true);
    },
    []
  );

  const closeApprovalModal = useCallback(() => {
    setIsApprovalModalOpen(false);
    setSelectedReport(null);
    setApprovalAction(null);
    setAdminNote("");
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
      console.log("🔄 Submitting approval action:", {
        recordId: selectedReport.recordId,
        action: approvalAction,
        note: adminNote.trim() || null,
      });

      const response = await fetch("/api/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordId: selectedReport.recordId,
          status: approvalAction === "approve" ? "approved" : "rejected",
          adminNote: adminNote.trim() || null,
          approvedBy: sheid || "SHE", // ใช้ sheid ถ้ามี ไม่งั้นใช้ "unknown"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update approval status"
        );
      }

      const result = await response.json();
      console.log("✅ Approval API response:", result);

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
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("❌ Error updating approval status:", error);
      setError(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการอัพเดตสถานะ"
      );
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Mock function to fetch reports
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔄 Fetching all reports for admin dashboard...");

      const [recordResponse, categoryResponse, subCategoryResponse] =
        await Promise.all([
          fetch("/api/get?type=record"),
          fetch("/api/get?type=category"),
          fetch("/api/get?type=subcategory"),
        ]);

      if (!recordResponse.ok) {
        throw new Error(`HTTP error! status: ${recordResponse.status}`);
      }

      const [apiData, categoryData, subCategoryData] = await Promise.all([
        recordResponse.json(),
        categoryResponse.json(),
        subCategoryResponse.json(),
      ]);

      console.log("✅ API Response received:", {
        totalRecords: apiData,
        categories: categoryData,
        subCategories: subCategoryData,
      });

      if (!Array.isArray(apiData)) {
        throw new Error("ข้อมูลที่ได้รับไม่ใช่ array");
      }

      const transformedReports = transformApiDataToDashboardReport(
        apiData,
        categoryData,
        subCategoryData
      );

      console.log("📊 Transformed reports for dashboard:", {
        count: transformedReports.length,
        pending: transformedReports.filter((r) => r.status === "pending")
          .length,
        approved: transformedReports.filter((r) => r.status === "approved")
          .length,
        rejected: transformedReports.filter((r) => r.status === "rejected")
          .length,
      });

      setReports(transformedReports);
    } catch (error) {
      console.error("❌ Error fetching reports:", error);
      setError(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
      );

      // ✅ ไม่ใช้ mock data แล้ว - ให้เป็น empty array
      setReports([]);
    } finally {
      setIsLoading(false);
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

  const MonthlyReportSummary = React.memo(
    ({ reports }: { reports: Report[] }) => {
      const [selectedMonth, setSelectedMonth] = useState(new Date());

      // ฟังก์ชันคำนวณสัปดาห์ในเดือน
      const getWeeksInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const weeks = [];
        let current = new Date(firstDay);

        // ย้อนกลับไปวันจันทร์ของสัปดาห์แรก
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
      };

      // ฟิลเตอร์รายงานตามเดือนที่เลือก
      const monthlyReports = useMemo(() => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();

        return reports.filter((report) => {
          const reportDate = report.submittedDate;
          return (
            reportDate.getFullYear() === year && reportDate.getMonth() === month
          );
        });
      }, [reports, selectedMonth]);

      // สร้างข้อมูลสรุปตามสัปดาห์และกลุ่ม
      const weeklySummary = useMemo(() => {
        const weeks = getWeeksInMonth(selectedMonth);
        const groups = [...new Set(monthlyReports.map((r) => r.group))].sort();

        return weeks.map((week) => {
          const weekReports = monthlyReports.filter((report) => {
            const reportDate = startOfDay(report.submittedDate);
            return (
              reportDate >= startOfDay(week.start) &&
              reportDate <= endOfDay(week.end)
            );
          });

          const groupStats = groups.map((group) => {
            const groupReports = weekReports.filter((r) => r.group === group);
            return {
              group,
              total: groupReports.length,
              approved: groupReports.filter((r) => r.status === "approved")
                .length,
              pending: groupReports.filter((r) => r.status === "pending")
                .length,
              rejected: groupReports.filter((r) => r.status === "rejected")
                .length,
            };
          });

          return {
            ...week,
            totalReports: weekReports.length,
            groupStats,
          };
        });
      }, [monthlyReports, selectedMonth]);

      // สถิติรวมของเดือน
      const monthlyStats = useMemo(() => {
        const groups = [...new Set(monthlyReports.map((r) => r.group))].sort();

        return {
          totalReports: monthlyReports.length,
          totalApproved: monthlyReports.filter((r) => r.status === "approved")
            .length,
          totalPending: monthlyReports.filter((r) => r.status === "pending")
            .length,
          totalRejected: monthlyReports.filter((r) => r.status === "rejected")
            .length,
          groupSummary: groups
            .map((group) => {
              const groupReports = monthlyReports.filter(
                (r) => r.group === group
              );
              return {
                group,
                total: groupReports.length,
                approved: groupReports.filter((r) => r.status === "approved")
                  .length,
                pending: groupReports.filter((r) => r.status === "pending")
                  .length,
                rejected: groupReports.filter((r) => r.status === "rejected")
                  .length,
                approvalRate:
                  groupReports.length > 0
                    ? Math.round(
                        (groupReports.filter((r) => r.status === "approved")
                          .length /
                          groupReports.length) *
                          100
                      )
                    : 0,
              };
            })
            .sort((a, b) => b.total - a.total),
        };
      }, [monthlyReports]);

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

      const changeMonth = (direction: "prev" | "next") => {
        setSelectedMonth((prev) => {
          const newDate = new Date(prev);
          if (direction === "prev") {
            newDate.setMonth(newDate.getMonth() - 1);
          } else {
            newDate.setMonth(newDate.getMonth() + 1);
          }
          return newDate;
        });
      };

      return (
        <div className="space-y-6">
          {/* Month Selector */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {monthNames[selectedMonth.getMonth()]}{" "}
                {selectedMonth.getFullYear()}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              รายงานทั้งหมด: {monthlyStats.totalReports} รายการ
            </div>
          </div>

          {/* Monthly Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {monthlyStats.totalReports}
              </div>
              <div className="text-sm text-blue-700">รายงานทั้งหมด</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {monthlyStats.totalApproved}
              </div>
              <div className="text-sm text-green-700">อนุมัติแล้ว</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {monthlyStats.totalPending}
              </div>
              <div className="text-sm text-yellow-700">รอการอนุมัติ</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {monthlyStats.totalRejected}
              </div>
              <div className="text-sm text-red-700">ไม่อนุมัติ</div>
            </div>
          </div>

          {/* Group Summary */}
          <div>
            <h4 className="text-md font-semibold mb-3">สรุปตามกลุ่ม</h4>
            <div className="space-y-2">
              {monthlyStats.groupSummary.map((group, index) => (
                <div key={group.group} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium">{group.group}</div>
                      <Badge variant="secondary" className="text-xs">
                        {group.approvalRate}% อนุมัติ
                      </Badge>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-gray-600">
                        ทั้งหมด: {group.total}
                      </span>
                      <span className="text-green-600">
                        อนุมัติ: {group.approved}
                      </span>
                      <span className="text-yellow-600">
                        รอ: {group.pending}
                      </span>
                      <span className="text-red-600">
                        ไม่อนุมัติ: {group.rejected}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full flex">
                      {group.total > 0 && (
                        <>
                          <div
                            className="bg-green-500 h-full"
                            style={{
                              width: `${(group.approved / group.total) * 100}%`,
                            }}
                          />
                          <div
                            className="bg-yellow-500 h-full"
                            style={{
                              width: `${(group.pending / group.total) * 100}%`,
                            }}
                          />
                          <div
                            className="bg-red-500 h-full"
                            style={{
                              width: `${(group.rejected / group.total) * 100}%`,
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Breakdown */}
          <div>
            <h4 className="text-md font-semibold mb-3">สรุปรายสัปดาห์</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 font-medium">สัปดาห์</th>
                    <th className="text-left p-3 font-medium">ช่วงวันที่</th>
                    <th className="text-center p-3 font-medium">
                      รายงานทั้งหมด
                    </th>
                    {[...new Set(monthlyReports.map((r) => r.group))]
                      .sort()
                      .map((group) => (
                        <th key={group} className="text-center p-3 font-medium">
                          {group}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {weeklySummary.map((week, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 font-medium">{week.label}</td>
                      <td className="p-3 text-gray-600">
                        {format(week.start, "dd/MM")} -{" "}
                        {format(week.end, "dd/MM")}
                      </td>
                      <td className="p-3 text-center font-medium">
                        {week.totalReports}
                      </td>
                      {[...new Set(monthlyReports.map((r) => r.group))]
                        .sort()
                        .map((group) => {
                          const groupStat = week.groupStats.find(
                            (g) => g.group === group
                          );
                          return (
                            <td key={group} className="p-3 text-center">
                              {groupStat ? (
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {groupStat.total}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    <span className="text-green-600">
                                      {groupStat.approved}
                                    </span>
                                    /
                                    <span className="text-yellow-600">
                                      {groupStat.pending}
                                    </span>
                                    /
                                    <span className="text-red-600">
                                      {groupStat.rejected}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-center space-x-4">
              <span>📊 รูปแบบ: ทั้งหมด</span>
              <span className="text-green-600">🟢 อนุมัติ</span>
              <span className="text-yellow-600">🟡 รอการอนุมัติ</span>
              <span className="text-red-600">🔴 ไม่อนุมัติ</span>
            </div>
          </div>

          {/* Export Monthly Report Button */}
          <div className="flex justify-end">
            <Button
              onClick={() =>
                exportMonthlyReport(weeklySummary, monthlyStats, selectedMonth)
              }
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export รายงานประจำเดือน
            </Button>
          </div>
        </div>
      );
    }
  );

  MonthlyReportSummary.displayName = "MonthlyReportSummary";

  const exportMonthlyReport = (
    weeklySummary: any[],
    monthlyStats: any,
    selectedMonth: Date
  ) => {
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

    // สร้าง CSV สำหรับรายงานประจำเดือน
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

    // เพิ่มแถวสรุปรวม
    csvData.push([
      "รวมทั้งเดือน",
      "",
      monthlyStats.totalReports,
      ...monthlyStats.groupSummary.map((g: any) => g.total),
      ...monthlyStats.groupSummary.map((g: any) => g.approved),
    ]);

    const allData = [headers, ...csvData];
    const csvContent = allData
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const filename = `BBS_Monthly_Report_${monthName}_${year}.csv`;
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
  };

  useEffect(() => {
    fetchReports();
  }, []);

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
                className="rounded-lg"
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
              <Button
                onClick={fetchReports}
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? "กำลังโหลด..." : "รีเฟรช"}
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/managecategory")}
                >
                  <Settings />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams({
                      employeeId: employeeId || "",
                      fullName: employeeName || "",
                      department: depatment || "",
                      group: group || "",
                    }).toString();
                    router.push(`/?${params}`);
                  }}
                >
                  <House className="h-5 w-5" />
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
              <p className="text-red-600 mb-2">{error}</p>
              <Button
                onClick={fetchReports}
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">รายงานทั้งหมด</TabsTrigger>
            <TabsTrigger value="analytics">สถิติและรายงาน</TabsTrigger>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              </div>
            )}

            {/* Filters */}
            <Card>
              <CardContent className="p-6">
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
                          <SelectItem value="pending">รอการอนุมัติ</SelectItem>
                          <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
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
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      แสดง {filteredReports.length} จาก {reports.length} รายการ
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
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
                filteredReports.map((report) => {
                  const statusInfo = getStatusInfo(report.status);
                  const priorityInfo = getPriorityInfo(report.priority);
                  const StatusIcon = statusInfo.icon;
                  const isOpen = openAccordions.has(report.id);

                  return (
                    <Card
                      key={report.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <Collapsible
                        open={isOpen}
                        onOpenChange={() => toggleAccordion(report.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardContent className="p-4 cursor-pointer hover:bg-gray-50">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    รายงาน #{report.id}
                                  </h3>
                                  <Badge className={statusInfo.color}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusInfo.label}
                                  </Badge>
                                  <Badge className={priorityInfo.color}>
                                    {priorityInfo.label}
                                  </Badge>
                                  {report.status === "pending" && (
                                    <span className="text-xs text-gray-500">
                                      ส่งเมื่อ{" "}
                                      {format(
                                        report.submittedDate,
                                        "dd/MM/yyyy HH:mm"
                                      )}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">
                                      พนักงาน:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {report.employeeName}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      รหัส:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {report.employeeId}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      แผนก:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {report.department}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Safe/Unsafe:{" "}
                                    </span>
                                    <span className="text-green-600 font-medium">
                                      {report.safeCount}
                                    </span>
                                    <span className="text-gray-400 mx-1">
                                      /
                                    </span>
                                    <span className="text-red-600 font-medium">
                                      {report.unsafeCount}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                {report.status === "pending" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApprovalAction("approve", report);
                                      }}
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApprovalAction("reject", report);
                                      }}
                                      className="text-red-600 border-red-600 hover:bg-red-50"
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedReport(report);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {isOpen ? (
                                  <ChevronUp className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-4 px-4">
                            <div className="border-t pt-4">
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
                                      <strong>โดย:</strong> {report.approvedBy}{" "}
                                      เมื่อ{" "}
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
                })
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
                      <div className="flex items-center space-x-2">
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
                      <div className="flex items-center space-x-2">
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
                      <div className="flex items-center space-x-2">
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
          </TabsContent>
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

      {/* Report Detail Modal */}
      {selectedReport && !isApprovalModalOpen && (
        <div className="fixed inset-0 bg-[#00000094] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  รายละเอียดรายงาน #{selectedReport.id}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
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
                            className="text-xs"
                          >
                            {option}
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
                      </p>
                      <p>
                        <strong className="text-red-600">
                          Unsafe Actions:
                        </strong>{" "}
                        {selectedReport.unsafeCount} คน
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
                  <div className="mt-2 space-y-1">
                    {selectedReport.attachment.map((file, index) => (
                      <a
                        key={index}
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline cursor-pointer"
                      >
                        📎 {file.name}
                      </a>
                    ))}
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
