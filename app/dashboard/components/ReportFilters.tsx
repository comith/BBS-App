"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CalendarIcon,
  FileText,
  Search,
  X,
} from "lucide-react";
import { CustomCalendar } from "../CustomCalendar";
import { type DateRange } from "../hooks/useReportFilters";

interface Props {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (v: string) => void;
  departmentList: string[];
  dateRange: DateRange;
  onDateRangeChange: React.Dispatch<React.SetStateAction<DateRange>>;
  isDatePickerOpen: boolean;
  setIsDatePickerOpen: (v: boolean) => void;
  onClearDateRange: () => void;
  onQuickDateRange: (days: number) => void;
  onExport: () => void;
  filteredCount: number;
  totalCount: number;
  onClearAll: () => void;
}

export function ReportFilters({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  departmentList,
  dateRange,
  onDateRangeChange,
  isDatePickerOpen,
  setIsDatePickerOpen,
  onClearDateRange,
  onQuickDateRange,
  onExport,
  filteredCount,
  totalCount,
  onClearAll,
}: Props) {
  const statusOptions = [
    { id: "all", label: "ทั้งหมด" },
    { id: "pending", label: "รอการอนุมัติ" },
    { id: "approved", label: "อนุมัติแล้ว" },
    { id: "rejected", label: "ไม่อนุมัติ" },
  ];

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Search & Export Row */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาพนักงาน, รหัส..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-9 h-11 bg-white border-transparent shadow-sm rounded-2xl focus-visible:ring-1 focus-visible:ring-indigo-500 text-sm"
          />
        </div>
        <Button
          onClick={onExport}
          disabled={filteredCount === 0}
          size="icon"
          className="h-11 w-11 rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-sm flex-shrink-0"
          title="Export CSV"
        >
          <FileText className="h-5 w-5" />
        </Button>
      </div>

      {/* Status Chips (Horizontally Scrollable) */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {statusOptions.map((status) => (
          <button
            key={status.id}
            onClick={() => onStatusFilterChange(status.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border shadow-sm flex-shrink-0",
              statusFilter === status.id
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={departmentFilter} onValueChange={onDepartmentFilterChange}>
          <SelectTrigger className="h-9 w-[130px] sm:w-[150px] bg-white border-slate-200 shadow-sm rounded-full text-xs">
            <Building2 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="แผนก" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">ทุกแผนก</SelectItem>
            {departmentList.map((dept) => (
              <SelectItem key={dept} value={dept} className="text-xs">
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 px-3 bg-white border-slate-200 shadow-sm rounded-full text-xs font-normal",
                !dateRange.from && "text-slate-500"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yy")
                )
              ) : (
                "ช่วงวันที่"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
            <div className="p-3 border-b bg-slate-50">
              <p className="text-xs font-medium text-slate-700 mb-2">เลือกเวลาด่วน</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { onQuickDateRange(7); setIsDatePickerOpen(false); }} className="h-7 text-[10px] rounded-full">7 วัน</Button>
                <Button variant="outline" size="sm" onClick={() => { onQuickDateRange(30); setIsDatePickerOpen(false); }} className="h-7 text-[10px] rounded-full">30 วัน</Button>
                <Button variant="outline" size="sm" onClick={() => { onQuickDateRange(90); setIsDatePickerOpen(false); }} className="h-7 text-[10px] rounded-full">3 เดือน</Button>
              </div>
            </div>
            <div className="p-2">
              <CustomCalendar
                mode="range"
                selected={dateRange}
                onSelect={(newDateRange) => {
                  onDateRangeChange(newDateRange);
                  if (newDateRange?.from && newDateRange?.to) {
                    setIsDatePickerOpen(false);
                  }
                }}
                numberOfMonths={1}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button */}
        {(statusFilter !== "all" || departmentFilter !== "all" || searchTerm || dateRange.from) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-9 px-3 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full ml-auto"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            ล้าง
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-[11px] text-slate-400 mt-1 pl-1">
        แสดง {filteredCount} จาก {totalCount} รายการ
      </div>
    </div>
  );
}
