"use client";

import { useEffect, useMemo, useState, useDeferredValue } from "react";
import {
  endOfDay,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
} from "date-fns";
import { type Report } from "../types";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface ReportFiltersState {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  clearDateRange: () => void;
  setQuickDateRange: (days: number) => void;
  filteredReports: Report[];
  visibleReports: Report[];
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  loadMore: () => void;
  pageSize: number;
}

const PAGE_SIZE = 30;

export function useReportFilters(reports: Report[]): ReportFiltersState {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const clearDateRange = () =>
    setDateRange({ from: undefined, to: undefined });

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - days);
    setDateRange({ from: fromDate, to: today });
  };

  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (departmentFilter !== "all") {
      filtered = filtered.filter((r) => r.department === departmentFilter);
    }
    if (priorityFilter !== "all") {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }

    if (dateRange.from) {
      const fromDate = startOfDay(dateRange.from);
      filtered = filtered.filter((r) => {
        const d = startOfDay(r.submittedDate);
        return isAfter(d, fromDate) || isEqual(d, fromDate);
      });
    }
    if (dateRange.to) {
      const toDate = endOfDay(dateRange.to);
      filtered = filtered.filter((r) => {
        const d = endOfDay(r.submittedDate);
        return isBefore(d, toDate) || isEqual(d, toDate);
      });
    }

    if (deferredSearchTerm) {
      const q = deferredSearchTerm.toLowerCase();
      filtered = filtered.filter((r) => r.searchString.includes(q));
    }

    filtered.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;

      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return b.submittedDate.getTime() - a.submittedDate.getTime();
    });

    return filtered;
  }, [
    reports,
    statusFilter,
    departmentFilter,
    priorityFilter,
    deferredSearchTerm,
    dateRange,
  ]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    statusFilter,
    departmentFilter,
    priorityFilter,
    deferredSearchTerm,
    dateRange,
  ]);

  const visibleReports = useMemo(
    () => filteredReports.slice(0, visibleCount),
    [filteredReports, visibleCount]
  );

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    priorityFilter,
    setPriorityFilter,
    dateRange,
    setDateRange,
    clearDateRange,
    setQuickDateRange,
    filteredReports,
    visibleReports,
    visibleCount,
    setVisibleCount,
    loadMore: () => setVisibleCount((c) => c + PAGE_SIZE),
    pageSize: PAGE_SIZE,
  };
}
