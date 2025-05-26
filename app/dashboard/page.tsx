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
  Download,
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
  Settings
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
  DialogTrigger,
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

// Mock data
const mockReports: Report[] = [
  {
    id: 1,
    date: new Date("2024-01-15"),
    employeeId: "5LD01234",
    employeeName: "สมชาย ใจดี",
    department: "ITH-CV",
    group: "CV1",
    safetyCategory: "การสวมใส่อุปกรณ์คุ้มครองส่วนบุคคล PPE",
    subCategory: "PPE งานซ่อมบำรุง และงานก่อสร้าง",
    observedWork: "ซ่อมเครื่องจักรในโรงงาน",
    observedDepartment: "CV",
    status: "pending",
    safeCount: 5,
    unsafeCount: 2,
    selectedOptions: ["หมวกเซฟตี้", "รองเท้าเซฟตี้"],
    attachment: ["image1.jpg", "image2.jpg"],
    adminNote: null,
    approvedDate: null,
    approvedBy: null,
    submittedDate: new Date("2024-01-15T09:30:00"),
    priority: "normal",
  },
  {
    id: 2,
    date: new Date("2024-01-10"),
    employeeId: "5LD05678",
    employeeName: "สมหญิง รักษาความปลอดภัย",
    department: "ITH-MT",
    group: "MT1",
    safetyCategory: "การใช้อุปกรณ์ เครื่องมือ เครื่องจักร",
    subCategory: "อุปกรณ์ ต่างๆของยานพาหนะและเครื่องจักร",
    observedWork: "การขับรถเครนในพื้นที่ก่อสร้าง",
    observedDepartment: "MT",
    status: "pending",
    safeCount: 3,
    unsafeCount: 1,
    selectedOptions: ["ระบบไฟส่องสว่าง", "ธงสะท้อนแสง"],
    attachment: ["video1.mp4"],
    adminNote: null,
    approvedDate: null,
    approvedBy: null,
    submittedDate: new Date("2024-01-10T14:20:00"),
    priority: "high",
  },
  {
    id: 3,
    date: new Date("2024-01-08"),
    employeeId: "5LD09999",
    employeeName: "สมศักดิ์ ดีใจ",
    department: "ITH-AUX",
    group: "AUX1",
    safetyCategory: "การกระทำที่ไม่ปลอดภัย",
    subCategory: "พฤติกรรมการทำงานไฟฟ้า",
    observedWork: "งานติดตั้งระบบไฟฟ้า",
    observedDepartment: "AUX",
    status: "approved",
    safeCount: 2,
    unsafeCount: 4,
    selectedOptions: ["การตัดจ่ายพลังงานหรือกระแสไฟฟ้าขณะทำงาน"],
    attachment: ["report1.pdf"],
    adminNote: "รายงานดีมาก มีรายละเอียดครบถ้วน",
    approvedDate: new Date("2024-01-09"),
    approvedBy: "ผจก.ความปลอดภัย",
    submittedDate: new Date("2024-01-08T11:15:00"),
    priority: "high",
  },
];

interface Report {
  id: number;
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
  attachment: string[];
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

function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [filteredReports, setFilteredReports] = useState<Report[]>(mockReports);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("reports");
  const router = useRouter();

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
  const stats = {
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
  };

  const departments = [
    "ITH-CV",
    "ITH-MT",
    "ITH-AUX",
    "ITH-MO",
    "ITH-OE",
    "SUB-VCS",
    "SUB-STN",
    "SUB-SDS",
    "SUB-3SL",
  ];

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

  // Filter and Search
  useEffect(() => {
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

    setFilteredReports(filtered);
  }, [
    reports,
    statusFilter,
    departmentFilter,
    priorityFilter,
    searchTerm,
    dateRange,
  ]);

  // Handle approval/rejection
  const handleApprovalAction = (
    action: "approve" | "reject",
    report: Report
  ) => {
    setSelectedReport(report);
    setApprovalAction(action);
    setAdminNote("");
    setIsApprovalModalOpen(true);
  };

  const submitApprovalAction = () => {
    if (!selectedReport || !approvalAction) return;

    const updatedReports = reports.map((report) => {
      if (report.id === selectedReport.id) {
        return {
          ...report,
          status:
            approvalAction === "approve"
              ? ("approved" as const)
              : ("rejected" as const),
          adminNote: adminNote.trim() || null,
          approvedDate: new Date(),
          approvedBy: "ผจก.ความปลอดภัย", // In real app, get from auth
        };
      }
      return report;
    });

    setReports(updatedReports);
    setIsApprovalModalOpen(false);
    setSelectedReport(null);
    setApprovalAction(null);
    setAdminNote("");
  };

  // Mock function to fetch reports
  const fetchReports = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setReports(mockReports);
    setIsLoading(false);
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
            <div className="flex items-center space-x-2">
            <Button
              onClick={fetchReports}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? "กำลังโหลด..." : "รีเฟรช"}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push("/managecategory")
              }
            >
                <Settings/>

            </Button>
            </div>
          </div>
        </div>
      </div>

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
                      <p className="text-sm font-medium text-gray-600">ด่วน</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.highPriority}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-600" />
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
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full lg:w-48">
                      <Select
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
                              width: `${(stats.approved / stats.total) * 100}%`,
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
                              width: `${(stats.pending / stats.total) * 100}%`,
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
                              width: `${(stats.rejected / stats.total) * 100}%`,
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
                    {departments.slice(0, 5).map((dept) => {
                      const count = reports.filter(
                        (r) => r.department === dept
                      ).length;
                      return (
                        <div
                          key={dept}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600">{dept}</span>
                          <span className="text-sm font-medium">
                            {count} รายการ
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval/Rejection Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
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
              onClick={() => setIsApprovalModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={submitApprovalAction}
              disabled={approvalAction === "reject" && !adminNote.trim()}
              className={
                approvalAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {approvalAction === "approve" ? "อนุมัติ" : "ไม่อนุมัติ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Detail Modal */}
      {selectedReport && !isApprovalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                      <div
                        key={index}
                        className="text-sm text-blue-600 hover:underline cursor-pointer"
                      >
                        📎 {file}
                      </div>
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
                    variant="destructive"
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
