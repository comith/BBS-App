"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import {
  type Report,
  transformApiDataToDashboardReport,
} from "../types";

interface EmployeeInfo {
  employeeId: string;
  employeeName: string;
  department: string;
  group: string;
  [key: string]: any;
}

interface StaticData {
  categories: any[];
  subCategories: any[];
}

export interface RecentReport {
  id: number;
  employeeName: string;
  department: string;
  submittedDate: Date;
  safeCount: number;
}

export interface AnalyticsExtras {
  departmentCounts: [string, number][];
  currentMonthCount: number;
  safeReportsCount: number;
  unsafeReportsCount: number;
  nearMissCount: number;
  topContributors: { employeeId: string; count: number }[];
  recentReports: RecentReport[];
}

const EMPTY_ANALYTICS: AnalyticsExtras = {
  departmentCounts: [],
  currentMonthCount: 0,
  safeReportsCount: 0,
  unsafeReportsCount: 0,
  nearMissCount: 0,
  topContributors: [],
  recentReports: [],
};

export interface ReportsState {
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  isLoading: boolean;
  isBackgroundLoading: boolean;
  isStatsLoading: boolean;
  error: string | null;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  fetchReports: () => Promise<void>;
  refreshStats: () => Promise<void>;
  employeeList: EmployeeInfo[];
  departmentList: string[];
  topDepartments: [string, number][];
  stats: ReportStats;
  analytics: AnalyticsExtras;
}

export interface ReportStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  highPriority: number;
  totalSafeActions: number;
  totalUnsafeActions: number;
  todayReports: number;
  ppe: number;
  ppe_safe: number;
  ppe_unsafe: number;
  tools: number;
  tools_safe: number;
  tools_unsafe: number;
  unsafe_actions: number;
  unsafe_actions_safe: number;
  unsafe_actions_unsafe: number;
  unsafe_condition: number;
  unsafe_condition_safe: number;
  unsafe_condition_unsafe: number;
}

const EMPTY_STATS: ReportStats = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  highPriority: 0,
  totalSafeActions: 0,
  totalUnsafeActions: 0,
  todayReports: 0,
  ppe: 0,
  ppe_safe: 0,
  ppe_unsafe: 0,
  tools: 0,
  tools_safe: 0,
  tools_unsafe: 0,
  unsafe_actions: 0,
  unsafe_actions_safe: 0,
  unsafe_actions_unsafe: 0,
  unsafe_condition: 0,
  unsafe_condition_safe: 0,
  unsafe_condition_unsafe: 0,
};

export function useReports(sessionLoaded: boolean): ReportsState {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employeeList, setEmployeeList] = useState<EmployeeInfo[]>([]);

  // Whole-year summary (cards) — comes from a dedicated DB-side aggregate query,
  // decoupled from the (much heavier) full record list so cards show correct
  // totals immediately instead of waiting for/depending on the list to finish loading.
  const [stats, setStats] = useState<ReportStats>(EMPTY_STATS);
  const [departmentList, setDepartmentList] = useState<string[]>([]);
  const [topDepartments, setTopDepartments] = useState<[string, number][]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsExtras>(EMPTY_ANALYTICS);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const staticDataRef = useRef<StaticData | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const res = await apiFetch(
        `/api/get?type=stats&year=${selectedYear}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats ?? EMPTY_STATS);
      setDepartmentList(Array.isArray(data.departmentList) ? data.departmentList : []);
      setTopDepartments(Array.isArray(data.topDepartments) ? data.topDepartments : []);
      setAnalytics({
        departmentCounts: Array.isArray(data.departmentCounts) ? data.departmentCounts : [],
        currentMonthCount: data.currentMonthCount ?? 0,
        safeReportsCount: data.safeReportsCount ?? 0,
        unsafeReportsCount: data.unsafeReportsCount ?? 0,
        nearMissCount: data.nearMissCount ?? 0,
        topContributors: Array.isArray(data.topContributors) ? data.topContributors : [],
        recentReports: Array.isArray(data.recentReports)
          ? data.recentReports.map((r: any) => ({
              id: r.id,
              employeeName: r.employeeName || "",
              department: r.department || "",
              submittedDate: new Date(r.submittedDate),
              safeCount: Number(r.safeCount) || 0,
            }))
          : [],
      });
    } catch (err) {
      console.warn("Stats fetch warning:", err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [selectedYear]);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      refreshStats();

      // Fetch page 1 (50 items) first for instant render
      const params = new URLSearchParams({
        type: "record",
        year: selectedYear.toString(),
        page: "1",
        limit: "50",
      });

      const cached = staticDataRef.current;

      const fetchPromises: Promise<Response>[] = [
        apiFetch(`/api/get?${params.toString()}`),
        ...(cached
          ? []
          : [
              apiFetch("/api/get?type=category"),
              apiFetch("/api/get?type=subcategory"),
              apiFetch("/api/get?type=employee"),
            ]),
      ];

      const [recordResponse, ...staticResponses] = await Promise.all(
        fetchPromises
      );

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
        const failedStatic = staticResponses.find((r) => !r.ok);
        if (failedStatic) {
          const err = new Error("server") as Error & { status: number };
          err.status = failedStatic.status;
          throw err;
        }

        const [catData, subCatData, empData] = await Promise.all(
          staticResponses.map((r) => r.json())
        );
        categoryData = Array.isArray(catData) ? catData : [];
        subCategoryData = Array.isArray(subCatData) ? subCatData : [];
        staticDataRef.current = {
          categories: catData,
          subCategories: subCatData,
        };
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
      setReports(
        transformApiDataToDashboardReport(
          apiData ?? [],
          categoryData,
          subCategoryData
        )
      );
      setIsLoading(false); // Done loading page 1!

      // Now fetch the rest of the year's records in the background, page by page
      // (a single unbounded request would defeat the DB connection-pool limits set
      // elsewhere, but a single capped request would silently drop older records —
      // so keep requesting pages until a short page tells us we've reached the end).
      setIsBackgroundLoading(true);
      const BG_PAGE_SIZE = 800;
      (async () => {
        try {
          let page = 1;
          let allBgData: any[] = [];
          while (true) {
            const bgParams = new URLSearchParams({
              type: "record",
              year: selectedYear.toString(),
              page: page.toString(),
              limit: BG_PAGE_SIZE.toString(),
            });
            const res = await apiFetch(`/api/get?${bgParams.toString()}`);
            if (!res.ok) throw new Error("Background fetch failed");
            const pageData = await res.json();
            const pageArray = Array.isArray(pageData) ? pageData : [];
            allBgData = allBgData.concat(pageArray);

            setReports(
              transformApiDataToDashboardReport(
                allBgData,
                categoryData,
                subCategoryData
              )
            );

            if (pageArray.length < BG_PAGE_SIZE) break;
            page++;
          }
        } catch (err) {
          console.warn("Background fetch warning:", err);
        } finally {
          setIsBackgroundLoading(false);
        }
      })();

    } catch (err) {
      console.error("Error fetching reports:", err);
      if (err instanceof TypeError) {
        setError("CONNECTION_FAILED");
      } else if (err instanceof Error && (err as any).status >= 500) {
        setError("DB_ERROR");
      } else {
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
      }
      setIsLoading(false);
    }
  }, [selectedYear, refreshStats]);

  // Initial load — once session is ready
  useEffect(() => {
    if (sessionLoaded) {
      fetchReports();
    }
    // Only on session load; selectedYear changes handled by next effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoaded]);

  // Re-fetch on year change (skip first run)
  const isFirstYearRun = useRef(true);
  useEffect(() => {
    if (isFirstYearRun.current) {
      isFirstYearRun.current = false;
      return;
    }
    fetchReports();
  }, [selectedYear, fetchReports]);

  // Auto-refresh on service worker message
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/alert.mp3");
      audio.play().catch((e) => {
        console.warn("Sound playback blocked or failed:", e);
      });
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.serviceWorker) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "REFRESH_REPORTS") {
        playNotificationSound();
        fetchReports();
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
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
  };
}

export type { EmployeeInfo };
