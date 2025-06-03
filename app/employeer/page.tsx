"use client";

import * as React from "react";
import { useState, useEffect } from "react";
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
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
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

// Custom Calendar Component with proper styling
type CustomCalendarProps = {
  mode: "range" | "single";
  selected: any;
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

  interface GetDaysInMonthFn {
    (date: Date): number;
  }

  const getDaysInMonth: GetDaysInMonthFn = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  interface GetFirstDayOfMonthFn {
    (date: Date): number;
  }

  const getFirstDayOfMonth: GetFirstDayOfMonthFn = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  interface DateRange {
    from?: Date;
    to?: Date;
  }

  type CalendarMode = "range" | "single";

  const isDateInRange = (date: Date): boolean => {
    if (!selected?.from) return false;
    if (
      mode === "range" &&
      (selected as DateRange).from &&
      (selected as DateRange).to
    ) {
      return (
        date >= (selected as DateRange).from! &&
        date <= (selected as DateRange).to!
      );
    }
    return !!(
      (selected as DateRange).from &&
      date.getTime() === (selected as DateRange).from!.getTime()
    );
  };

  interface IsDateRangeStartFn {
    (date: Date): boolean;
  }

  const isDateRangeStart: IsDateRangeStartFn = (date) => {
    return selected?.from && date.getTime() === selected.from.getTime();
  };

  interface IsDateRangeEndFn {
    (date: Date): boolean;
  }

  const isDateRangeEnd: IsDateRangeEndFn = (date) => {
    return selected?.to && date.getTime() === selected.to.getTime();
  };

  interface RangeDate {
    from?: Date;
    to?: Date;
  }

  type HandleDateClickFn = (date: Date) => void;

  const handleDateClick: HandleDateClickFn = (date) => {
    if (mode === "range") {
      if (!selected?.from || (selected.from && selected.to)) {
        onSelect({ from: date, to: undefined });
      } else if (selected.from && !selected.to) {
        if (date < selected.from) {
          onSelect({ from: date, to: selected.from });
        } else {
          onSelect({ from: selected.from, to: date });
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

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
    }

    // Days of the month
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

// Mock data - ในโปรเจคจริงจะเรียกจาก API

interface Report {
  id: number;
  date: Date;
  safetyCategory: string;
  subCategory: string | null;
  observedWork: string;
  department: string;
  status: "approved" | "pending" | "rejected";
  safeCount: number;
  unsafeCount: number;
  adminNote: string | null;
  approvedDate: Date | null;
  approvedBy: string | null;
}

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

function EmployeeReportStatus() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [sheViolations, setSheViolations] = useState<SheViolation[]>([]);
  const [sheStats, setSheStats] = useState<{
    total: number;
    byMonth: Record<string, number>;
    byCategory: Record<string | number, number>;
    byRiskLevel: Record<string, number>;
    ppeViolations: number;
  }>({
    total: 0,
    byMonth: {},
    byCategory: {},
    byRiskLevel: {},
    ppeViolations: 0,
  });

  const fetchSheViolations = async () => {
    try {
      const response = await fetch("/api/get?type=she_violations");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData = await response.json();

      if (!Array.isArray(apiData)) {
        throw new Error("ข้อมูล SHE violations ไม่ใช่ array");
      }

      // กรองข้อมูลเฉพาะพนักงานคนนี้
      const filteredData = apiData.filter(
        (item) => item.employee_code === employeeId
      );

      setSheViolations(filteredData);

      // คำนวณสถิติ
      const stats = calculateSheStats(filteredData);
      setSheStats(stats);
    } catch (error) {
      console.error("❌ Error fetching SHE violations:", error);
    }
  };

  // ฟังก์ชันคำนวณสถิติ SHE Violations
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

  // เรียกใช้ฟังก์ชันใน useEffect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setEmployeeId(searchParams.get("employeeId") || "");
      setEmployeeName(searchParams.get("fullName") || "");
      setDepartment(searchParams.get("department") || "");
      setGroup(searchParams.get("group") || "");

      if (searchParams.get("employeeId")) {
        fetchReports();
        fetchSheViolations(); // เพิ่มบรรทัดนี้
      }
    }
  }, [employeeId]);

  const fetchCategoriesAndSubCategories = async () => {
    try {
      const [categoryResponse, subCategoryResponse] = await Promise.all([
        fetch("/api/get?type=category"),
        fetch("/api/get?type=subcategory"),
      ]);

      const categoryData = await categoryResponse.json();
      const subCategoryData = await subCategoryResponse.json();

      setCategories(categoryData);
      setSubCategories(subCategoryData);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const SheViolationsDashboard = () => {
    if (sheViolations.length === 0) {
      return null; // ไม่แสดงถ้าไม่มีข้อมูล
    }

    return (
      <Card className="mb-6 p-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-red-100 rounded flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <span>รายงาน SHE</span>
            <Badge variant="secondary">{sheStats.total} ครั้ง</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* สถิติรวม */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

          {/* รายการล่าสุด */}
          {/* <div>
          <h4 className="text-lg font-semibold mb-3">รายการล่าสุด</h4>
          <div className="space-y-2">
            {sheViolations
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 3)
              .map((violation, index) => (
                <div key={violation.record_id || index} className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge 
                          variant={violation.level_accident === 'เสี่ยงสูง' ? 'destructive' : 'secondary'}
                        >
                          {violation.level_accident || 'ไม่ระบุระดับ'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {format(new Date(violation.date), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{violation.observed_Work}</p>
                      <p className="text-xs text-gray-600">{violation.department_notice}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600 font-medium">
                        Unsafe: {violation.unsafeActionCount}
                      </p>
                      <p className="text-sm text-green-600">
                        Safe: {violation.safeActionCount}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            }
            
            {sheViolations.length > 3 && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement view all functionality
                    console.log("View all SHE violations");
                  }}
                >
                  ดูทั้งหมด ({sheViolations.length} รายการ)
                </Button>
              </div>
            )}
          </div>
        </div> */}
        </CardContent>
      </Card>
    );
  };

  const transformApiDataToReportWithCategories = (
    apiData: ApiReport[],
    employeeId: string,
    categories: any[],
    subCategories: any[]
  ): Report[] => {


    const filtered = apiData.filter((item) => item.employee_id === employeeId);

    return filtered.map((item, index) => {
      // หา category name จาก ID
      const category = categories.find(
        (cat) => cat.id === parseInt(item.safetycategory_id)
      );
      const subCategory = subCategories.find(
        (sub) => sub.id === parseInt(item.sub_safetycategory_id)
      );

      return {
        id: index + 1,
        date: new Date(item.date),
        safetyCategory:
          category?.name || `Category ID: ${item.safetycategory_id}`,
        subCategory: subCategory?.name || null,
        observedWork: item.observed_Work || "ไม่ระบุ",
        department: item.department_notice || item.group || "ไม่ระบุ",
        status:
          item.status && item.status.trim() !== ""
            ? (item.status as "approved" | "pending" | "rejected")
            : "pending",
        safeCount: Number(item.safeActionCount) || 0,
        unsafeCount: Number(item.unsafeActionCount) || 0,
        adminNote: null,
        approvedDate: null,
        approvedBy: null,
      };
    });
  };

  const calculateStats = (reports: Report[]) => {
    return {
      total: reports.length,
      approved: reports.filter((r) => r.status === "approved").length,
      pending: reports.filter((r) => r.status === "pending").length,
      rejected: reports.filter((r) => r.status === "rejected").length,
      totalSafeActions: reports.reduce((sum, r) => sum + r.safeCount, 0),
      totalUnsafeActions: reports.reduce((sum, r) => sum + r.unsafeCount, 0),
    };
  };

  // Date range states
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // สถิติโดยรวม
  const stats = calculateStats(reports);

  // Toggle accordion
  const toggleAccordion = (reportId: number) => {
    const newOpenAccordions = new Set(openAccordions);
    if (newOpenAccordions.has(reportId)) {
      newOpenAccordions.delete(reportId);
    } else {
      newOpenAccordions.add(reportId);
    }
    setOpenAccordions(newOpenAccordions);
  };

  // Clear date range
  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  // Quick date presets
  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - days);
    setDateRange({ from: fromDate, to: today });
  };

  // Filter และ Search
  useEffect(() => {
    let filtered = reports;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    // Filter by date range
    if (dateRange.from) {
      const fromDate = startOfDay(dateRange.from);
      filtered = filtered.filter((report) => {
        const reportDate = startOfDay(report.date);
        return isAfter(reportDate, fromDate) || isEqual(reportDate, fromDate);
      });
    }

    if (dateRange.to) {
      const toDate = endOfDay(dateRange.to);
      filtered = filtered.filter((report) => {
        const reportDate = endOfDay(report.date);
        return isBefore(reportDate, toDate) || isEqual(reportDate, toDate);
      });
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.safetyCategory
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.observedWork
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  }, [reports, statusFilter, searchTerm, dateRange]);

  // Mock function to fetch reports

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // เรียกข้อมูลทั้งหมดพร้อมกัน
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


      if (!Array.isArray(apiData)) {
        throw new Error("ข้อมูลที่ได้รับไม่ใช่ array");
      }

      const transformedReports = transformApiDataToReportWithCategories(
        apiData,
        employeeId || "",
        categoryData,
        subCategoryData
      );

      setReports(transformedReports);

      if (transformedReports.length === 0) {
        setError("ไม่พบรายงานของท่าน");
      }
    } catch (error) {
      console.error("❌ Error fetching reports:", error);
      setError(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
      );
      // ใช้ mock data เป็น fallback เฉพาะตอน development
      if (process.env.NODE_ENV === "development") {
        setReports([]);
      } else {
        setReports([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!employeeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">
              ไม่พบรหัสพนักงาน กรุณาเข้าถึงหน้านี้ผ่านลิงก์ที่ถูกต้อง
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* {error && !isLoading && (
        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={fetchReports}
              className="bg-orange-500 hover:bg-orange-600"
            >
              ลองใหม่อีกครั้ง
            </Button>
          </CardContent>
        </Card>
      )} */}

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
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
                  สถานะรายงานความปลอดภัย
                </h1>
                <p className="text-gray-600">
                  รหัสพนักงาน: {employeeId} | {employeeName}
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-2">
              <Button
                onClick={() => {
                  fetchReports();
                  fetchSheViolations();
                }}
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600 w-full"
              >
                {isLoading ? "กำลังโหลด..." : "รีเฟรช"}
              </Button>
              <Button
                variant="outline"
                className="text-gray-600 hover:text-gray-900"
                onClick={() => {
                    const params = new URLSearchParams({
                      employeeId: employeeId || "",
                      fullName: employeeName || "",
                      department: department || "",
                      group: group || "",
                    }).toString();
                    router.push(`/?${params}`);
                  }}
              >
                ย้อนกลับ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="py-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    รายงานทั้งหมด
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardContent className="p-4">
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
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardContent className="p-4">
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

          <Card className="py-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    ไม่อนุมัติ
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.rejected}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card className="mb-6 py-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-orange-100 rounded flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
              <span>สรุปผลการสังเกต</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">
                    {stats.totalSafeActions}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">
                    Safe Actions
                  </p>
                  <p className="text-sm text-gray-600">
                    พฤติกรรมที่ปลอดภัย (คน)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-red-600">
                    {stats.totalUnsafeActions}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-red-600">
                    Unsafe Actions
                  </p>
                  <p className="text-sm text-gray-600">
                    พฤติกรรมที่ไม่ปลอดภัย (คน)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SHE Violations Dashboard */}
        <SheViolationsDashboard />

        {/* Calendar */}

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-[12fr_1fr_2fr] gap-4">
              {/* First row: Search and Status filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="ค้นหารายงาน..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="กรองตามสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                      <SelectItem value="pending">รอการอนุมัติ</SelectItem>
                      <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                    </SelectContent>
                  </Select>
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
                            onClick={() => setQuickDateRange(7)}
                            className="text-xs"
                          >
                            7 วันที่แล้ว
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuickDateRange(30)}
                            className="text-xs"
                          >
                            30 วันที่แล้ว
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuickDateRange(90)}
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
                          onSelect={setDateRange}
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

                {/* Show filtered results count */}
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  แสดง {filteredReports.length} จาก {reports.length} รายการ
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List with Accordion */}
        <div className="space-y-4 h-[400px] overflow-y-auto">
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
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                รายงาน #{report.id}
                              </h3>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">วันที่: </span>
                                <span className="font-medium">
                                  {format(report.date, "dd/MM/yyyy")}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">แผนก: </span>
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
                                <span className="text-gray-400 mx-1">/</span>
                                <span className="text-red-600 font-medium">
                                  {report.unsafeCount}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
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
                          </div>

                          {report.status === "approved" &&
                            report.approvedDate && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                                <p className="text-sm text-green-800">
                                  <strong>อนุมัติเมื่อ:</strong>{" "}
                                  {format(report.approvedDate, "dd MMMM yyyy", {
                                    locale: th,
                                  })}
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

                          {report.status === "rejected" && report.adminNote && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                              <p className="text-sm text-red-800">
                                <strong>เหตุผลที่ไม่อนุมัติ:</strong>{" "}
                                {report.adminNote}
                              </p>
                            </div>
                          )}

                          {report.status === "pending" && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                              <p className="text-sm text-yellow-800">
                                🕐 รายงานนี้อยู่ระหว่างการพิจารณาโดยผู้ดูแลระบบ
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

        {/* Export Button */}
        {/* {filteredReports.length > 0 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => {
                // TODO: Implement export functionality
                console.log("Export reports");
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              ส่งออกรายงาน PDF
            </Button>
          </div>
        )} */}
      </div>

      {/* Report Detail Modal (Simple version) */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
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

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">วันที่รายงาน</p>
                    <p className="font-medium">
                      {format(selectedReport.date, "dd MMMM yyyy", {
                        locale: th,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">สถานะ</p>
                    <Badge
                      className={getStatusInfo(selectedReport.status).color}
                    >
                      {getStatusInfo(selectedReport.status).label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">หมวดหมู่ความปลอดภัย</p>
                  <p className="font-medium">{selectedReport.safetyCategory}</p>
                </div>

                {selectedReport.subCategory && (
                  <div>
                    <p className="text-sm text-gray-600">หมวดหมู่ย่อย</p>
                    <p className="font-medium">{selectedReport.subCategory}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">งานที่สังเกต</p>
                  <p className="font-medium">{selectedReport.observedWork}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">แผนกที่สังเกต</p>
                  <p className="font-medium">{selectedReport.department}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">พฤติกรรมปลอดภัย</p>
                    <p className="font-medium text-green-600">
                      {selectedReport.safeCount} คน
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">พฤติกรรมไม่ปลอดภัย</p>
                    <p className="font-medium text-red-600">
                      {selectedReport.unsafeCount} คน
                    </p>
                  </div>
                </div>

                {selectedReport.adminNote && (
                  <div>
                    <p className="text-sm text-gray-600">หมายเหตุจากผู้ดูแล</p>
                    <div
                      className={cn(
                        "p-3 rounded-lg border",
                        selectedReport.status === "approved"
                          ? "bg-green-50 border-green-200"
                          : selectedReport.status === "rejected"
                          ? "bg-red-50 border-red-200"
                          : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <p className="text-sm">{selectedReport.adminNote}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeReportStatus;
