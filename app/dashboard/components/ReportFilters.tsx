"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CalendarIcon,
  ChevronDown,
  FileText,
  Filter,
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
  return (
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
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ค้นหาพนักงาน, รหัส, หรือรายงาน..."
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full lg:w-48">
                <Select
                  value={statusFilter}
                  onValueChange={onStatusFilterChange}
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
                  onValueChange={onDepartmentFilterChange}
                >
                  <SelectTrigger>
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="แผนก" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกแผนก</SelectItem>
                    {departmentList.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full lg:w-48">
                {/* Priority filter (reserved) */}
              </div>
            </div>

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
                            onQuickDateRange(7);
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
                            onQuickDateRange(30);
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
                            onQuickDateRange(90);
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
                          onDateRangeChange(newDateRange);
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

              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearDateRange}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  ล้างวันที่
                </Button>
              )}

              <Button
                onClick={onExport}
                disabled={filteredCount === 0}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export ({filteredCount})
              </Button>

              <div className="text-sm text-gray-600 whitespace-nowrap flex items-center gap-2">
                <span>
                  แสดง {filteredCount} จาก {totalCount} รายการ
                </span>
                {(statusFilter !== "all" ||
                  departmentFilter !== "all" ||
                  searchTerm ||
                  dateRange.from) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
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
  );
}
